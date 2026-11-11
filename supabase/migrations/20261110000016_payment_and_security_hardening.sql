-- 20261110000016_payment_and_security_hardening.sql
-- Phase 10: Razorpay Payment Integration, Webhook Idempotency, and Security Hardening

-- 1. Ensure 'failed' is in payment_status enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'failed' 
    AND enumtypid = 'public.payment_status'::regtype
  ) THEN
    ALTER TYPE public.payment_status ADD VALUE 'failed';
  END IF;
END $$;

-- 2. Add Unique constraint on payments to prevent duplicate payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uq_payments_order_ref'
  ) THEN
    ALTER TABLE public.payments 
    ADD CONSTRAINT uq_payments_order_ref UNIQUE (order_id, transaction_reference);
  END IF;
END $$;

-- 3. Add Indexes for performance & quick lookup
CREATE INDEX IF NOT EXISTS idx_payments_transaction_ref ON public.payments(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_created ON public.orders(restaurant_id, created_at DESC);

-- 4. Secure RPC: Record Verified Payment
CREATE OR REPLACE FUNCTION public.record_verified_payment(
  p_order_id uuid,
  p_payment_reference text,
  p_method public.payment_method,
  p_amount numeric,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order record;
  v_payment_id uuid;
  v_existing_payment record;
BEGIN
  -- 1. Fetch target order
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % does not exist.', p_order_id;
  END IF;

  -- 2. Guard against duplicate payment
  IF v_order.payment_status = 'paid' THEN
    SELECT id, transaction_reference INTO v_existing_payment
    FROM public.payments
    WHERE order_id = p_order_id AND payment_status = 'paid'
    LIMIT 1;

    RETURN jsonb_build_object(
      'success', true,
      'already_paid', true,
      'order_id', p_order_id,
      'payment_reference', COALESCE(v_existing_payment.transaction_reference, v_order.payment_method::text),
      'message', 'Order is already marked as paid'
    );
  END IF;

  -- 3. Validate payment amount matches order total (tolerance 0.05 for rounding)
  IF abs(p_amount - v_order.total) > 0.05 THEN
    RAISE EXCEPTION 'Payment amount (₹%) does not match order total (₹%).', p_amount, v_order.total;
  END IF;

  -- 4. Insert ledger record into public.payments
  INSERT INTO public.payments (
    restaurant_id,
    order_id,
    amount,
    payment_method,
    payment_status,
    transaction_reference,
    metadata,
    created_at
  )
  VALUES (
    v_order.restaurant_id,
    p_order_id,
    p_amount,
    p_method,
    'paid'::public.payment_status,
    p_payment_reference,
    p_metadata,
    now()
  )
  RETURNING id INTO v_payment_id;

  -- 5. Update order payment status
  UPDATE public.orders
  SET
    payment_status = 'paid'::public.payment_status,
    payment_method = p_method,
    updated_at = now()
  WHERE id = p_order_id;

  -- 6. Record in audit logs
  INSERT INTO public.audit_logs (
    restaurant_id,
    user_id,
    action,
    entity_type,
    entity_id,
    details,
    created_at
  )
  VALUES (
    v_order.restaurant_id,
    auth.uid(),
    'payment_verified_captured',
    'payment',
    p_order_id,
    jsonb_build_object(
      'payment_id', v_payment_id,
      'reference', p_payment_reference,
      'amount', p_amount,
      'method', p_method,
      'order_number', v_order.order_number,
      'metadata', p_metadata
    ),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'already_paid', false,
    'order_id', p_order_id,
    'payment_id', v_payment_id,
    'payment_reference', p_payment_reference,
    'order_number', v_order.order_number,
    'amount', p_amount,
    'status', 'paid'
  );
END;
$$;

-- 5. Secure RPC: Record Failed Payment
CREATE OR REPLACE FUNCTION public.record_failed_payment(
  p_order_id uuid,
  p_payment_reference text,
  p_reason text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order record;
  v_payment_id uuid;
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % does not exist.', p_order_id;
  END IF;

  INSERT INTO public.payments (
    restaurant_id,
    order_id,
    amount,
    payment_method,
    payment_status,
    transaction_reference,
    metadata,
    created_at
  )
  VALUES (
    v_order.restaurant_id,
    p_order_id,
    v_order.total,
    v_order.payment_method,
    'failed'::public.payment_status,
    p_payment_reference,
    jsonb_build_object('failure_reason', p_reason) || p_metadata,
    now()
  )
  RETURNING id INTO v_payment_id;

  -- Record audit log
  INSERT INTO public.audit_logs (
    restaurant_id,
    user_id,
    action,
    entity_type,
    entity_id,
    details,
    created_at
  )
  VALUES (
    v_order.restaurant_id,
    auth.uid(),
    'payment_attempt_failed',
    'payment',
    p_order_id,
    jsonb_build_object(
      'payment_id', v_payment_id,
      'reference', p_payment_reference,
      'reason', p_reason,
      'order_number', v_order.order_number
    ),
    now()
  );

  RETURN jsonb_build_object(
    'success', false,
    'order_id', p_order_id,
    'payment_id', v_payment_id,
    'reason', p_reason
  );
END;
$$;

-- 6. Secure RPC: Process Order Refund
CREATE OR REPLACE FUNCTION public.process_order_refund(
  p_order_id uuid,
  p_refund_amount numeric,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order record;
  v_payment_id uuid;
  v_refund_ref text;
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % does not exist.', p_order_id;
  END IF;

  -- Role check: Manager/Owner or Super Admin
  IF NOT (public.is_restaurant_manager_or_owner(v_order.restaurant_id) OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Unauthorized: Only restaurant owners, managers, or super admins can authorize refunds.';
  END IF;

  IF v_order.payment_status <> 'paid' THEN
    RAISE EXCEPTION 'Cannot refund order with payment status "%". Only paid orders can be refunded.', v_order.payment_status;
  END IF;

  v_refund_ref := 'rfnd_' || to_char(now(), 'YYYYMMDD') || '_' || substr(md5(random()::text), 1, 8);

  -- Record refund payment entry
  INSERT INTO public.payments (
    restaurant_id,
    order_id,
    amount,
    payment_method,
    payment_status,
    transaction_reference,
    metadata,
    created_at
  )
  VALUES (
    v_order.restaurant_id,
    p_order_id,
    p_refund_amount,
    v_order.payment_method,
    'refunded'::public.payment_status,
    v_refund_ref,
    jsonb_build_object('refund_reason', p_reason, 'initiated_by', auth.uid()),
    now()
  )
  RETURNING id INTO v_payment_id;

  -- Update order status
  UPDATE public.orders
  SET
    payment_status = 'refunded'::public.payment_status,
    updated_at = now()
  WHERE id = p_order_id;

  -- Audit log
  INSERT INTO public.audit_logs (
    restaurant_id,
    user_id,
    action,
    entity_type,
    entity_id,
    details,
    created_at
  )
  VALUES (
    v_order.restaurant_id,
    auth.uid(),
    'payment_refunded',
    'payment',
    p_order_id,
    jsonb_build_object(
      'refund_id', v_payment_id,
      'refund_reference', v_refund_ref,
      'amount', p_refund_amount,
      'reason', p_reason,
      'order_number', v_order.order_number
    ),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'refund_reference', v_refund_ref,
    'amount', p_refund_amount,
    'status', 'refunded'
  );
END;
$$;

-- 7. Security Hardening: Fix permissive RLS policies
-- 7a. Hardening on public.payments
DROP POLICY IF EXISTS payments_select_staff ON public.payments;
CREATE POLICY payments_select_staff ON public.payments
  FOR SELECT
  USING (
    public.is_restaurant_member(restaurant_id)
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS payments_insert_staff ON public.payments;
CREATE POLICY payments_insert_staff ON public.payments
  FOR INSERT
  WITH CHECK (
    public.is_restaurant_member(restaurant_id)
    OR public.is_super_admin()
  );

-- 7b. Hardening on public.orders update
DROP POLICY IF EXISTS orders_update_staff ON public.orders;
CREATE POLICY orders_update_staff ON public.orders
  FOR UPDATE
  USING (
    public.is_restaurant_member(restaurant_id)
    OR public.is_super_admin()
  )
  WITH CHECK (
    public.is_restaurant_member(restaurant_id)
    OR public.is_super_admin()
  );

-- 7c. Ensure public.orders delete is only for managers/owners
DROP POLICY IF EXISTS orders_delete_managers ON public.orders;
CREATE POLICY orders_delete_managers ON public.orders
  FOR DELETE
  USING (
    public.is_restaurant_manager_or_owner(restaurant_id)
    OR public.is_super_admin()
  );

