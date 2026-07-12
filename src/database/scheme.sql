begin;

create extension if not exists pgcrypto;

create type user_role as enum ('customer', 'admin');
create type user_status as enum ('active', 'disabled');
create type product_status as enum ('draft', 'active', 'archived');
create type garment_type as enum ('shirt', 'sweater', 'hoodie', 'cap');
create type product_side as enum ('front', 'back');
create type cart_status as enum ('active', 'converted', 'abandoned');
create type order_status as enum (
  'pending_payment',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
  'partially_refunded'
);
create type payment_status as enum (
  'pending',
  'requires_action',
  'processing',
  'succeeded',
  'failed',
  'cancelled',
  'partially_refunded',
  'refunded'
);
create type refund_status as enum ('pending', 'succeeded', 'failed', 'cancelled');
create type fulfillment_status as enum ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
create type inventory_movement_type as enum (
  'initial',
  'adjustment',
  'reservation',
  'reservation_release',
  'sale',
  'return'
);

create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text not null,
  full_name text not null,
  role user_role not null default 'customer',
  status user_status not null default 'active',
  email_verified_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint users_email_normalized check (email = lower(btrim(email))),
  constraint users_email_not_blank check (length(btrim(email)) > 3),
  constraint users_name_not_blank check (length(btrim(full_name)) > 0)
);

create unique index users_email_unique on users (lower(email)) where deleted_at is null;
create index users_role_status_idx on users (role, status) where deleted_at is null;

create table user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  refresh_token_hash text not null unique,
  user_agent text,
  ip_address inet,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index user_sessions_user_active_idx on user_sessions (user_id, expires_at)
where revoked_at is null;

create table addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
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
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint addresses_country_uppercase check (country_code = upper(country_code))
);

create index addresses_user_idx on addresses (user_id) where deleted_at is null;
create unique index addresses_one_default_shipping_idx on addresses (user_id)
where is_default_shipping and deleted_at is null;
create unique index addresses_one_default_billing_idx on addresses (user_id)
where is_default_billing and deleted_at is null;

create table customer_payment_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text not null default '',
  status product_status not null default 'active',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint collections_name_not_blank check (length(btrim(name)) > 0),
  constraint collections_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create unique index collections_slug_unique on collections (slug) where deleted_at is null;
create index collections_storefront_idx on collections (status, sort_order) where deleted_at is null;

create table tech_themes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  category text not null,
  logo_path text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tech_themes_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create unique index tech_themes_slug_unique on tech_themes (slug);
create index tech_themes_category_active_idx on tech_themes (category, active);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text not null default '',
  garment garment_type not null,
  stack text not null,
  tech_theme_id uuid references tech_themes(id) on delete set null,
  tech_label text not null,
  status product_status not null default 'draft',
  featured boolean not null default false,
  default_color_hex char(7) not null,
  base_price_minor bigint not null,
  currency char(3) not null default 'MXN',
  created_by uuid references users(id) on delete set null,
  updated_by uuid references users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint products_name_not_blank check (length(btrim(name)) > 0),
  constraint products_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint products_color_hex check (default_color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  constraint products_base_price_nonnegative check (base_price_minor >= 0),
  constraint products_currency_uppercase check (currency = upper(currency)),
  constraint products_currency_length check (length(currency) = 3)
);

create unique index products_slug_unique on products (slug) where deleted_at is null;
create index products_storefront_idx on products (status, featured, published_at desc)
where deleted_at is null;
create index products_filters_idx on products (garment, stack, status) where deleted_at is null;
create index products_tech_theme_idx on products (tech_theme_id) where deleted_at is null;

create table product_collections (
  product_id uuid not null references products(id) on delete cascade,
  collection_id uuid not null references collections(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (product_id, collection_id)
);

create index product_collections_collection_idx on product_collections (collection_id, sort_order);

create table product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  side product_side,
  media_type text not null default 'image',
  storage_key text not null,
  alt_text text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint product_media_type check (media_type in ('image', 'mockup', 'logo')),
  unique (product_id, storage_key)
);

create index product_media_product_order_idx on product_media (product_id, sort_order);

create table product_designs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  side product_side not null,
  design_data jsonb not null default '{}'::jsonb,
  rendered_storage_key text,
  version integer not null default 1,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_designs_version_positive check (version > 0),
  unique (product_id, side, version)
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  sku text not null,
  size text not null,
  color_name text,
  color_hex char(7) not null,
  price_minor bigint,
  currency char(3),
  active boolean not null default true,
  weight_grams integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint product_variants_size_not_blank check (length(btrim(size)) > 0),
  constraint product_variants_color_hex check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  constraint product_variants_price_nonnegative check (price_minor is null or price_minor >= 0),
  constraint product_variants_currency_pair check (
    (price_minor is null and currency is null) or
    (price_minor is not null and currency is not null and currency = upper(currency))
  ),
  constraint product_variants_weight_positive check (weight_grams is null or weight_grams > 0)
);

create unique index product_variants_sku_unique on product_variants (sku) where deleted_at is null;
create unique index product_variants_option_unique
on product_variants (product_id, size, color_hex) where deleted_at is null;
create index product_variants_product_active_idx on product_variants (product_id, active)
where deleted_at is null;

create table inventory (
  variant_id uuid primary key references product_variants(id) on delete cascade,
  on_hand integer not null default 0,
  reserved integer not null default 0,
  reorder_level integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint inventory_on_hand_nonnegative check (on_hand >= 0),
  constraint inventory_reserved_valid check (reserved >= 0 and reserved <= on_hand),
  constraint inventory_reorder_nonnegative check (reorder_level >= 0)
);

create table inventory_movements (
  id bigserial primary key,
  variant_id uuid not null references product_variants(id) on delete restrict,
  movement_type inventory_movement_type not null,
  quantity_delta integer not null,
  reservation_delta integer not null default 0,
  reference_type text,
  reference_id uuid,
  note text,
  actor_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint inventory_movements_nonzero check (quantity_delta <> 0 or reservation_delta <> 0)
);

create index inventory_movements_variant_created_idx
on inventory_movements (variant_id, created_at desc);
create index inventory_movements_reference_idx
on inventory_movements (reference_type, reference_id) where reference_id is not null;

create table carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  guest_token_hash text,
  status cart_status not null default 'active',
  currency char(3) not null default 'MXN',
  expires_at timestamptz,
  converted_order_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carts_owner_present check (user_id is not null or guest_token_hash is not null),
  constraint carts_currency_uppercase check (currency = upper(currency))
);

create unique index carts_one_active_user_idx on carts (user_id)
where status = 'active' and user_id is not null;
create unique index carts_active_guest_token_idx on carts (guest_token_hash)
where status = 'active' and guest_token_hash is not null;
create index carts_expiry_idx on carts (expires_at) where status = 'active';

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  variant_id uuid not null references product_variants(id) on delete restrict,
  quantity integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cart_items_quantity_positive check (quantity > 0),
  unique (cart_id, variant_id)
);

create index cart_items_variant_idx on cart_items (variant_id);

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  user_id uuid references users(id) on delete set null,
  cart_id uuid unique references carts(id) on delete set null,
  status order_status not null default 'pending_payment',
  customer_email text not null,
  customer_name text not null,
  customer_phone text,
  currency char(3) not null default 'MXN',
  subtotal_minor bigint not null,
  discount_minor bigint not null default 0,
  shipping_minor bigint not null default 0,
  tax_minor bigint not null default 0,
  total_minor bigint not null,
  shipping_address jsonb not null,
  billing_address jsonb,
  customer_note text,
  internal_note text,
  placed_at timestamptz,
  paid_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_email_normalized check (customer_email = lower(btrim(customer_email))),
  constraint orders_currency_uppercase check (currency = upper(currency)),
  constraint orders_amounts_nonnegative check (
    subtotal_minor >= 0 and discount_minor >= 0 and shipping_minor >= 0 and
    tax_minor >= 0 and total_minor >= 0
  ),
  constraint orders_total_matches check (
    total_minor = subtotal_minor - discount_minor + shipping_minor + tax_minor
  )
);

alter table carts
  add constraint carts_converted_order_fk
  foreign key (converted_order_id) references orders(id) on delete set null;

create index orders_user_created_idx on orders (user_id, created_at desc);
create index orders_status_created_idx on orders (status, created_at desc);
create index orders_customer_email_idx on orders (lower(customer_email), created_at desc);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete set null,
  product_id uuid references products(id) on delete set null,
  sku text not null,
  product_name text not null,
  garment text not null,
  tech_label text not null,
  size text not null,
  color_hex char(7) not null,
  unit_price_minor bigint not null,
  quantity integer not null,
  line_total_minor bigint not null,
  product_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint order_items_unit_price_nonnegative check (unit_price_minor >= 0),
  constraint order_items_quantity_positive check (quantity > 0),
  constraint order_items_line_total_matches check (line_total_minor = unit_price_minor * quantity),
  constraint order_items_color_hex check (color_hex ~ '^#[0-9A-Fa-f]{6}$')
);

create index order_items_order_idx on order_items (order_id);
create index order_items_variant_idx on order_items (variant_id);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete restrict,
  provider text not null default 'stripe',
  status payment_status not null default 'pending',
  amount_minor bigint not null,
  currency char(3) not null,
  provider_payment_intent_id text,
  provider_checkout_session_id text,
  provider_charge_id text,
  idempotency_key text not null,
  failure_code text,
  failure_message text,
  payment_method_type text,
  payment_method_summary jsonb not null default '{}'::jsonb,
  provider_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  succeeded_at timestamptz,
  constraint payments_amount_positive check (amount_minor > 0),
  constraint payments_currency_uppercase check (currency = upper(currency)),
  unique (provider, idempotency_key)
);

create unique index payments_provider_intent_unique
on payments (provider, provider_payment_intent_id)
where provider_payment_intent_id is not null;
create unique index payments_provider_checkout_unique
on payments (provider, provider_checkout_session_id)
where provider_checkout_session_id is not null;
create index payments_order_created_idx on payments (order_id, created_at desc);
create index payments_status_idx on payments (status, created_at desc);

create table refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id) on delete restrict,
  order_id uuid not null references orders(id) on delete restrict,
  status refund_status not null default 'pending',
  amount_minor bigint not null,
  currency char(3) not null,
  reason text,
  provider_refund_id text,
  idempotency_key text not null,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  succeeded_at timestamptz,
  constraint refunds_amount_positive check (amount_minor > 0),
  constraint refunds_currency_uppercase check (currency = upper(currency)),
  unique (payment_id, idempotency_key)
);

create unique index refunds_provider_id_unique on refunds (provider_refund_id)
where provider_refund_id is not null;
create index refunds_order_created_idx on refunds (order_id, created_at desc);

create table stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  api_version text,
  livemode boolean not null,
  payload jsonb not null,
  processing_attempts integer not null default 0,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text,
  constraint stripe_webhook_attempts_nonnegative check (processing_attempts >= 0)
);

create index stripe_webhook_unprocessed_idx on stripe_webhook_events (received_at)
where processed_at is null;

create table fulfillments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete restrict,
  status fulfillment_status not null default 'pending',
  carrier text,
  service text,
  tracking_number text,
  tracking_url text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index fulfillments_order_idx on fulfillments (order_id, created_at desc);
create unique index fulfillments_tracking_unique on fulfillments (carrier, tracking_number)
where tracking_number is not null;

create table fulfillment_items (
  fulfillment_id uuid not null references fulfillments(id) on delete cascade,
  order_item_id uuid not null references order_items(id) on delete restrict,
  quantity integer not null,
  primary key (fulfillment_id, order_item_id),
  constraint fulfillment_items_quantity_positive check (quantity > 0)
);

create table admin_audit_log (
  id bigserial primary key,
  admin_user_id uuid references users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index admin_audit_entity_idx on admin_audit_log (entity_type, entity_id, created_at desc);
create index admin_audit_admin_idx on admin_audit_log (admin_user_id, created_at desc);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at before update on users
for each row execute function set_updated_at();
create trigger addresses_set_updated_at before update on addresses
for each row execute function set_updated_at();
create trigger customer_payment_profiles_set_updated_at before update on customer_payment_profiles
for each row execute function set_updated_at();
create trigger collections_set_updated_at before update on collections
for each row execute function set_updated_at();
create trigger tech_themes_set_updated_at before update on tech_themes
for each row execute function set_updated_at();
create trigger products_set_updated_at before update on products
for each row execute function set_updated_at();
create trigger product_designs_set_updated_at before update on product_designs
for each row execute function set_updated_at();
create trigger product_variants_set_updated_at before update on product_variants
for each row execute function set_updated_at();
create trigger inventory_set_updated_at before update on inventory
for each row execute function set_updated_at();
create trigger carts_set_updated_at before update on carts
for each row execute function set_updated_at();
create trigger cart_items_set_updated_at before update on cart_items
for each row execute function set_updated_at();
create trigger orders_set_updated_at before update on orders
for each row execute function set_updated_at();
create trigger payments_set_updated_at before update on payments
for each row execute function set_updated_at();
create trigger refunds_set_updated_at before update on refunds
for each row execute function set_updated_at();
create trigger fulfillments_set_updated_at before update on fulfillments
for each row execute function set_updated_at();

comment on column products.base_price_minor is 'Price in the smallest currency unit; MXN 449.00 is stored as 44900.';
comment on column product_variants.price_minor is 'Optional variant override; NULL means products.base_price_minor.';
comment on column orders.shipping_address is 'Immutable checkout snapshot, not a reference to the editable address book.';
comment on column order_items.product_snapshot is 'Immutable product/variant presentation captured when the order is placed.';
comment on table stripe_webhook_events is 'Webhook inbox. Insert by Stripe event ID before processing to guarantee idempotency.';
comment on table inventory_movements is 'Append-only inventory ledger; update inventory in the same database transaction.';

commit;
