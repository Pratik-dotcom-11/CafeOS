-- 20261110000014_kds_phase5.sql
-- Phase 5 Kitchen Display System (KDS): Priority flagging, prep timing timestamps, and enhanced state transitions

-- 1. Add priority and execution timestamp columns to public.orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS is_priority BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS priority_reason TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS prep_started_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Create index on status & priority for rapid KDS polling/sorting
CREATE INDEX IF NOT EXISTS idx_orders_kds_status_priority
  ON public.orders (restaurant_id, status, is_priority DESC, created_at ASC);

-- 3. Stored function to toggle order rush/priority
CREATE OR REPLACE FUNCTION public.toggle_order_priority(
  p_order_id UUID,
  p_is_priority BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_order RECORD;
BEGIN
  UPDATE public.orders
  SET is_priority = p_is_priority,
      priority_reason = CASE WHEN p_is_priority THEN COALESCE(p_reason, 'Kitchen Rush Priority') ELSE NULL END,
      updated_at = now()
  WHERE id = p_order_id
  RETURNING id, order_number, status, is_priority, priority_reason INTO v_order;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % does not exist.', p_order_id;
  END IF;

  RETURN jsonb_build_object(
    'id', v_order.id,
    'order_number', v_order.order_number,
    'status', v_order.status,
    'is_priority', v_order.is_priority,
    'priority_reason', v_order.priority_reason
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_order_priority(UUID, BOOLEAN, TEXT) TO anon, authenticated;

-- 4. Enhanced state machine supporting staff workflows, remakes, recalls, and timing
CREATE OR REPLACE FUNCTION public.transition_order_status(
  p_order_id UUID,
  p_next_status public.order_status,
  p_reason TEXT DEFAULT NULL,
  p_is_staff BOOLEAN DEFAULT FALSE
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_current_status public.order_status;
  v_table_id UUID;
  v_now timestamptz := now();
  v_order RECORD;
BEGIN
  SELECT status, table_id INTO v_current_status, v_table_id
  FROM public.orders WHERE id = p_order_id;
  
  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Order % does not exist.', p_order_id;
  END IF;
  
  -- Customer Cancellation Rules:
  IF NOT p_is_staff AND p_next_status = 'cancelled' THEN
    IF v_current_status <> 'pending' THEN
      RAISE EXCEPTION 'Cannot cancel order once cooking or preparation has started (% status). Please contact floor staff.', v_current_status;
    END IF;
  END IF;
  
  -- State Machine Transition Rules:
  IF v_current_status = 'pending' AND p_next_status NOT IN ('accepted', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot transition pending order to % (expected accepted or cancelled).', p_next_status;
  ELSIF v_current_status = 'accepted' AND p_next_status NOT IN ('preparing', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot transition accepted order to % (expected preparing or cancelled).', p_next_status;
  ELSIF v_current_status = 'preparing' AND p_next_status NOT IN ('ready', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot transition preparing order to % (expected ready or cancelled).', p_next_status;
  ELSIF v_current_status = 'ready' AND p_next_status NOT IN ('completed', 'preparing', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot transition ready order to % (expected completed, preparing or cancelled).', p_next_status;
  ELSIF v_current_status = 'completed' AND NOT (p_is_staff AND p_next_status IN ('ready', 'preparing')) THEN
    RAISE EXCEPTION 'Order is already completed and fulfilled.';
  ELSIF v_current_status = 'cancelled' THEN
    RAISE EXCEPTION 'Order is already cancelled.';
  END IF;
  
  -- Update order status and appropriate timestamp
  UPDATE public.orders
  SET status = p_next_status,
      cancellation_reason = CASE WHEN p_next_status = 'cancelled' THEN COALESCE(p_reason, cancellation_reason) ELSE cancellation_reason END,
      prep_started_at = CASE WHEN p_next_status = 'preparing' AND prep_started_at IS NULL THEN v_now ELSE prep_started_at END,
      ready_at = CASE WHEN p_next_status = 'ready' THEN v_now ELSE ready_at END,
      completed_at = CASE WHEN p_next_status = 'completed' THEN v_now WHEN p_next_status IN ('ready', 'preparing') THEN NULL ELSE completed_at END,
      updated_at = v_now
  WHERE id = p_order_id
  RETURNING id, order_number, status, table_number_snapshot, cancellation_reason, prep_started_at, ready_at, completed_at, updated_at INTO v_order;
  
  -- Table occupancy management
  IF p_next_status IN ('completed', 'cancelled') AND v_table_id IS NOT NULL THEN
    UPDATE public.restaurant_tables
    SET status = 'available',
        active_order_id = NULL,
        occupied_since = NULL
    WHERE id = v_table_id;
  ELSIF p_next_status IN ('preparing', 'ready') AND v_table_id IS NOT NULL THEN
    UPDATE public.restaurant_tables
    SET status = 'occupied',
        active_order_id = p_order_id
    WHERE id = v_table_id;
  END IF;

  RETURN jsonb_build_object(
    'id', v_order.id,
    'order_number', v_order.order_number,
    'status', v_order.status,
    'cancellation_reason', v_order.cancellation_reason,
    'prep_started_at', v_order.prep_started_at,
    'ready_at', v_order.ready_at,
    'completed_at', v_order.completed_at,
    'updated_at', v_order.updated_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.transition_order_status(UUID, public.order_status, TEXT, BOOLEAN) TO anon, authenticated;

