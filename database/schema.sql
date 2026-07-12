-- Olmeware Store PostgreSQL schema
-- Money is stored in minor units (MXN centavos), never floating point.

create extension if not exists pgcrypto;
create extension if not exists citext;

create schema if not exists olmeware;

create or replace function olmeware.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table olmeware.users (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  password_hash text not null,
  full_name text not null,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  email_verified_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table olmeware.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references olmeware.users(id) on delete cascade,
  label text,
  recipient_name text not null,
  phone text,
  line1 text not null,
  line2 text,
  neighborhood text,
  city text not null,
  state text not null,
  postal_code text not null,
  country_code char(2) not null default 'MX',
  is_default_shipping boolean not null default false,
  is_default_billing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index addresses_one_default_shipping_per_user
  on olmeware.addresses(user_id) where is_default_shipping;
create unique index addresses_one_default_billing_per_user
  on olmeware.addresses(user_id) where is_default_billing;

create table olmeware.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references olmeware.users(id) on delete cascade,
  refresh_token_hash text not null unique,
  user_agent text,
  ip_address inet,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

create index user_sessions_active_user_idx
  on olmeware.user_sessions(user_id, expires_at)
  where revoked_at is null;

create table olmeware.user_action_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references olmeware.users(id) on delete cascade,
  purpose text not null check (purpose in ('verify_email', 'reset_password', 'change_email')),
  token_hash text not null unique,
  pending_email citext,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index user_action_tokens_active_user_idx
  on olmeware.user_action_tokens(user_id, purpose, expires_at)
  where consumed_at is null;

create table olmeware.tech_themes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null,
  logo_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table olmeware.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  garment_type text not null check (garment_type in ('shirt', 'sweater', 'hoodie', 'cap')),
  stack text not null check (stack in ('languages', 'frontend', 'backend', 'ai-ml', 'devops', 'databases', 'cloud', 'tools')),
  tech_theme_id uuid references olmeware.tech_themes(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  is_featured boolean not null default false,
  default_color text,
  default_logo_path text,
  created_by uuid references olmeware.users(id) on delete set null,
  updated_by uuid references olmeware.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (default_color is null or default_color ~ '^#[0-9A-Fa-f]{6}$')
);

create index products_storefront_idx
  on olmeware.products(created_at desc)
  where status = 'active' and deleted_at is null;
create index products_garment_idx
  on olmeware.products(garment_type) where status = 'active' and deleted_at is null;
create index products_stack_idx
  on olmeware.products(stack) where status = 'active' and deleted_at is null;

create table olmeware.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references olmeware.products(id) on delete cascade,
  sku text not null unique,
  size text not null check (size in ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  color_name text,
  color_hex text not null check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  price_minor bigint not null check (price_minor >= 0),
  compare_at_price_minor bigint check (compare_at_price_minor is null or compare_at_price_minor >= price_minor),
  currency char(3) not null default 'MXN',
  weight_grams integer check (weight_grams is null or weight_grams > 0),
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, size, color_hex)
);

create index product_variants_product_idx on olmeware.product_variants(product_id);
create index product_variants_price_idx on olmeware.product_variants(price_minor)
  where status = 'active';

create table olmeware.inventory (
  variant_id uuid primary key references olmeware.product_variants(id) on delete cascade,
  quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0),
  quantity_reserved integer not null default 0 check (quantity_reserved >= 0),
  low_stock_threshold integer not null default 10 check (low_stock_threshold >= 0),
  updated_at timestamptz not null default now(),
  check (quantity_reserved <= quantity_on_hand)
);

create table olmeware.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references olmeware.product_variants(id) on delete restrict,
  delta integer not null check (delta <> 0),
  reason text not null check (reason in ('initial', 'restock', 'reservation', 'release', 'sale', 'return', 'adjustment')),
  reference_type text,
  reference_id uuid,
  note text,
  created_by uuid references olmeware.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index inventory_movements_variant_created_idx
  on olmeware.inventory_movements(variant_id, created_at desc);

create table olmeware.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references olmeware.products(id) on delete cascade,
  variant_id uuid references olmeware.product_variants(id) on delete cascade,
  storage_path text not null,
  alt_text text not null default '',
  side text check (side is null or side in ('front', 'back')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_sort_idx
  on olmeware.product_images(product_id, sort_order, created_at);

create table olmeware.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  status text not null default 'active' check (status in ('draft', 'active', 'archived')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table olmeware.collection_products (
  collection_id uuid not null references olmeware.collections(id) on delete cascade,
  product_id uuid not null references olmeware.products(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (collection_id, product_id)
);

create index collection_products_product_idx on olmeware.collection_products(product_id);

create table olmeware.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references olmeware.users(id) on delete cascade,
  guest_token_hash text,
  status text not null default 'active' check (status in ('active', 'converted', 'abandoned', 'expired')),
  currency char(3) not null default 'MXN',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_id is not null or guest_token_hash is not null)
);

create unique index carts_one_active_per_user
  on olmeware.carts(user_id) where status = 'active' and user_id is not null;
create unique index carts_active_guest_token
  on olmeware.carts(guest_token_hash) where status = 'active' and guest_token_hash is not null;

create table olmeware.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references olmeware.carts(id) on delete cascade,
  variant_id uuid not null references olmeware.product_variants(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create index cart_items_variant_idx on olmeware.cart_items(variant_id);

create sequence olmeware.order_number_seq start 1000;

create table olmeware.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('OLM-' || lpad(nextval('olmeware.order_number_seq')::text, 8, '0')),
  user_id uuid references olmeware.users(id) on delete set null,
  cart_id uuid references olmeware.carts(id) on delete set null,
  customer_email citext not null,
  customer_name text not null,
  customer_phone text,
  status text not null default 'pending_payment' check (status in ('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'partially_refunded')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'processing', 'paid', 'failed', 'partially_refunded', 'refunded')),
  fulfillment_status text not null default 'unfulfilled' check (fulfillment_status in ('unfulfilled', 'processing', 'partially_fulfilled', 'fulfilled', 'returned')),
  currency char(3) not null default 'MXN',
  subtotal_minor bigint not null check (subtotal_minor >= 0),
  discount_minor bigint not null default 0 check (discount_minor >= 0),
  shipping_minor bigint not null default 0 check (shipping_minor >= 0),
  tax_minor bigint not null default 0 check (tax_minor >= 0),
  total_minor bigint not null check (total_minor >= 0),
  shipping_address jsonb not null,
  billing_address jsonb,
  customer_note text,
  internal_note text,
  placed_at timestamptz,
  paid_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (total_minor = subtotal_minor - discount_minor + shipping_minor + tax_minor)
);

create index orders_user_created_idx on olmeware.orders(user_id, created_at desc);
create index orders_status_created_idx on olmeware.orders(status, created_at desc);
create index orders_email_created_idx on olmeware.orders(customer_email, created_at desc);

create table olmeware.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references olmeware.orders(id) on delete restrict,
  product_id uuid references olmeware.products(id) on delete set null,
  variant_id uuid references olmeware.product_variants(id) on delete set null,
  sku text not null,
  product_name text not null,
  garment_type text not null,
  tech_name text,
  size text not null,
  color_name text,
  color_hex text,
  image_path text,
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  quantity integer not null check (quantity > 0),
  discount_minor bigint not null default 0 check (discount_minor >= 0),
  tax_minor bigint not null default 0 check (tax_minor >= 0),
  line_total_minor bigint not null check (line_total_minor >= 0),
  created_at timestamptz not null default now(),
  check (line_total_minor = unit_price_minor * quantity - discount_minor + tax_minor)
);

create index order_items_order_idx on olmeware.order_items(order_id);
create index order_items_variant_idx on olmeware.order_items(variant_id);

create table olmeware.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references olmeware.orders(id) on delete cascade,
  variant_id uuid not null references olmeware.product_variants(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  status text not null default 'active' check (status in ('active', 'committed', 'released', 'expired')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, variant_id)
);

create index inventory_reservations_expiry_idx
  on olmeware.inventory_reservations(expires_at)
  where status = 'active';
create index inventory_reservations_variant_idx
  on olmeware.inventory_reservations(variant_id) where status = 'active';

create table olmeware.stripe_customers (
  user_id uuid primary key references olmeware.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table olmeware.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references olmeware.orders(id) on delete restrict,
  provider text not null default 'stripe',
  provider_payment_id text,
  provider_checkout_session_id text,
  idempotency_key text not null unique,
  status text not null default 'pending' check (status in ('pending', 'requires_action', 'processing', 'succeeded', 'failed', 'cancelled', 'partially_refunded', 'refunded')),
  amount_minor bigint not null check (amount_minor > 0),
  currency char(3) not null default 'MXN',
  failure_code text,
  failure_message text,
  payment_method_type text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index payments_provider_payment_unique
  on olmeware.payments(provider, provider_payment_id) where provider_payment_id is not null;
create unique index payments_provider_checkout_unique
  on olmeware.payments(provider, provider_checkout_session_id) where provider_checkout_session_id is not null;
create index payments_order_created_idx on olmeware.payments(order_id, created_at desc);

create table olmeware.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references olmeware.payments(id) on delete restrict,
  provider_refund_id text unique,
  amount_minor bigint not null check (amount_minor > 0),
  currency char(3) not null default 'MXN',
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed', 'cancelled')),
  reason text,
  created_by uuid references olmeware.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index refunds_payment_idx on olmeware.refunds(payment_id);

create table olmeware.stripe_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  api_version text,
  payload jsonb not null,
  status text not null default 'received' check (status in ('received', 'processing', 'processed', 'failed', 'ignored')),
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create index stripe_webhook_events_pending_idx
  on olmeware.stripe_webhook_events(received_at)
  where status in ('received', 'failed');

create table olmeware.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references olmeware.orders(id) on delete restrict,
  carrier text,
  service text,
  tracking_number text,
  tracking_url text,
  status text not null default 'pending' check (status in ('pending', 'ready', 'shipped', 'delivered', 'returned', 'lost', 'cancelled')),
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shipments_order_idx on olmeware.shipments(order_id);

create table olmeware.admin_audit_log (
  id bigint generated always as identity primary key,
  admin_user_id uuid references olmeware.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index admin_audit_log_entity_idx
  on olmeware.admin_audit_log(entity_type, entity_id, created_at desc);
create index admin_audit_log_admin_idx
  on olmeware.admin_audit_log(admin_user_id, created_at desc);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'users', 'addresses', 'tech_themes', 'products', 'product_variants',
    'inventory', 'collections', 'carts', 'cart_items', 'orders',
    'inventory_reservations', 'stripe_customers', 'payments', 'refunds', 'shipments'
  ] loop
    execute format(
      'create trigger %I before update on olmeware.%I for each row execute function olmeware.set_updated_at()',
      table_name || '_set_updated_at', table_name
    );
  end loop;
end;
$$;

-- The Go API should connect with a dedicated, least-privilege database role.
-- Keep this schema outside Supabase's exposed Data API schemas. Do not grant
-- anon/authenticated direct access unless direct browser database access is
-- intentionally introduced with complete RLS policies.
