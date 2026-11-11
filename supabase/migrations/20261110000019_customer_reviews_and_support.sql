-- ============================================================================
-- Migration: 20261110000019_customer_reviews_and_support.sql
-- Description: Review moderation (owner replies & reporting) and support ticket threads
-- ============================================================================

-- 1. Extend customer_reviews with owner reply and moderation fields
ALTER TABLE public.customer_reviews
  ADD COLUMN IF NOT EXISTS owner_reply TEXT,
  ADD COLUMN IF NOT EXISTS owner_reply_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_reported BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS report_reason TEXT;

-- 2. Extend customer_support_tickets with category
ALTER TABLE public.customer_support_tickets
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'order_issue';

-- 3. Support Ticket Messages / Conversation Thread
CREATE TABLE IF NOT EXISTS public.customer_support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.customer_support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL DEFAULT 'customer', -- 'customer', 'staff', 'admin'
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON public.customer_support_messages(ticket_id, created_at ASC);

-- 4. Enable RLS
ALTER TABLE public.customer_support_messages ENABLE ROW LEVEL SECURITY;

-- 5. Policies for customer_reviews moderation
DO $$ BEGIN
  -- Restaurant managers / owners can view all reviews for their restaurant
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_reviews' AND policyname = 'cust_reviews_select_restaurant_staff') THEN
    CREATE POLICY cust_reviews_select_restaurant_staff ON public.customer_reviews
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.employees e
          WHERE e.restaurant_id = customer_reviews.restaurant_id
            AND e.user_id = auth.uid()
        ) OR is_super_admin()
      );
  END IF;

  -- Restaurant staff can update owner_reply on reviews belonging to their restaurant
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_reviews' AND policyname = 'cust_reviews_reply_staff') THEN
    CREATE POLICY cust_reviews_reply_staff ON public.customer_reviews
      FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.employees e
          WHERE e.restaurant_id = customer_reviews.restaurant_id
            AND e.user_id = auth.uid()
        ) OR is_super_admin()
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.employees e
          WHERE e.restaurant_id = customer_reviews.restaurant_id
            AND e.user_id = auth.uid()
        ) OR is_super_admin()
      );
  END IF;

  -- Support tickets staff policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_support_tickets' AND policyname = 'customer_support_select_staff') THEN
    CREATE POLICY customer_support_select_staff ON public.customer_support_tickets
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.employees e
          WHERE e.restaurant_id = customer_support_tickets.restaurant_id
            AND e.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_support_tickets' AND policyname = 'customer_support_update_staff') THEN
    CREATE POLICY customer_support_update_staff ON public.customer_support_tickets
      FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.employees e
          WHERE e.restaurant_id = customer_support_tickets.restaurant_id
            AND e.user_id = auth.uid()
        ) OR is_super_admin()
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.employees e
          WHERE e.restaurant_id = customer_support_tickets.restaurant_id
            AND e.user_id = auth.uid()
        ) OR is_super_admin()
      );
  END IF;

  -- Support messages customer policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_support_messages' AND policyname = 'support_msg_select_own') THEN
    CREATE POLICY support_msg_select_own ON public.customer_support_messages
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.customer_support_tickets t
          WHERE t.id = customer_support_messages.ticket_id
            AND (t.user_id = auth.uid() OR is_super_admin())
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_support_messages' AND policyname = 'support_msg_insert_own') THEN
    CREATE POLICY support_msg_insert_own ON public.customer_support_messages
      FOR INSERT TO authenticated
      WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
          SELECT 1 FROM public.customer_support_tickets t
          WHERE t.id = customer_support_messages.ticket_id
            AND (t.user_id = auth.uid() OR is_super_admin())
        )
      );
  END IF;

  -- Support messages staff policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_support_messages' AND policyname = 'support_msg_select_staff') THEN
    CREATE POLICY support_msg_select_staff ON public.customer_support_messages
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.customer_support_tickets t
          JOIN public.employees e ON e.restaurant_id = t.restaurant_id
          WHERE t.id = customer_support_messages.ticket_id
            AND e.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_support_messages' AND policyname = 'support_msg_insert_staff') THEN
    CREATE POLICY support_msg_insert_staff ON public.customer_support_messages
      FOR INSERT TO authenticated
      WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
          SELECT 1 FROM public.customer_support_tickets t
          JOIN public.employees e ON e.restaurant_id = t.restaurant_id
          WHERE t.id = customer_support_messages.ticket_id
            AND e.user_id = auth.uid()
        )
      );
  END IF;
END $$;
