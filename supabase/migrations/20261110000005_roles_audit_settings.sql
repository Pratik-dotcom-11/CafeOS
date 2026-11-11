-- 20261110000005_roles_audit_settings.sql
-- CafeOS Roles, Permissions Matrix, Audit Logs, Notifications, and Restaurant Settings

-- 1. Role Permissions Mapping Table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.restaurant_role NOT NULL,
  permission text NOT NULL,
  description text,
  CONSTRAINT uq_role_permission UNIQUE (role, permission)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role);

-- Seed default permission matrix
INSERT INTO public.role_permissions (role, permission, description) VALUES
  ('owner', '*', 'Full unrestricted tenant access'),
  ('manager', 'menu.manage', 'Create, edit, and delete dishes and categories'),
  ('manager', 'orders.manage', 'Manage and cancel orders'),
  ('manager', 'tables.manage', 'Floor plan configuration and table assignments'),
  ('manager', 'inventory.manage', 'Restock, adjust, and edit ingredients and recipes'),
  ('manager', 'analytics.view', 'View financial and operational reports'),
  ('manager', 'billing.manage', 'View and reconcile invoices and payments'),
  ('manager', 'staff.manage', 'Invite and manage team members'),
  ('cashier', 'pos.order', 'Create tickets and process counter transactions'),
  ('cashier', 'orders.manage', 'Update order statuses and notes'),
  ('cashier', 'billing.record', 'Record cash, card, and UPI payments'),
  ('cashier', 'tables.view', 'View floor seating and billing status'),
  ('cashier', 'tables.update', 'Mark tables billing or available'),
  ('kitchen', 'kds.view', 'View live KDS station queues'),
  ('kitchen', 'kds.update_status', 'Progress orders: accept, cook, mark ready'),
  ('kitchen', 'inventory.view', 'Check ingredient levels'),
  ('server', 'orders.create', 'Take orders at table'),
  ('server', 'orders.view', 'View status of table tickets'),
  ('server', 'tables.view', 'View floor availability'),
  ('server', 'tables.update', 'Seat guests and update table occupancy')
ON CONFLICT (role, permission) DO NOTHING;

-- 2. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_restaurant ON public.audit_logs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(restaurant_id, created_at DESC);

-- 3. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text NOT NULL DEFAULT 'system',
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_restaurant ON public.notifications(restaurant_id, created_at DESC);

-- 4. Restaurant Settings
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  kds_chime_enabled boolean NOT NULL DEFAULT true,
  auto_accept_orders boolean NOT NULL DEFAULT false,
  sound_volume integer NOT NULL DEFAULT 80,
  printer_ip text,
  receipt_header text,
  receipt_footer text DEFAULT 'Thank you for dining with us! Please come again.',
  tax_id_number text,
  low_stock_threshold_alert boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_restaurant_settings UNIQUE (restaurant_id)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_settings_restaurant ON public.restaurant_settings(restaurant_id);

