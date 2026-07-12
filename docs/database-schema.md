# Olmeware database design

This design translates the current storefront and admin panel into a PostgreSQL model that can support a Go API and Stripe checkout without making Stripe the system of record.

The executable DDL is in [`database/schema.sql`](../database/schema.sql).

## Assumptions

- PostgreSQL is the database. The `olmeware` schema is private and accessed through the Go backend, not directly by the browser.
- Authentication is owned by the Go backend. Passwords are represented only by `password_hash`; use Argon2id or bcrypt and never store plaintext passwords.
- Customers may check out as guests or while logged in.
- MXN is the initial currency, but every monetary record carries a currency code.
- Product images and mockup exports live in object storage; the database stores paths, not base64 image data.
- One product can belong to multiple collections and can have multiple color/size variants.
- Prices are integer minor units. The current `449 MXN` becomes `44900` centavos.

## Model map

```text
users ──< addresses
  │
  ├──< user_sessions / user_action_tokens
  │
  ├──< carts ──< cart_items >── product_variants ── inventory
  │                                      │                ├──< inventory_movements
  │                                      │                └──< inventory_reservations
  │                                      v
  ├──< orders ──< order_items >────── products ──< product_images
  │       │                                 │
  │       ├──< payments ──< refunds         ├──< collection_products >── collections
  │       └──< shipments                    └── tech_themes
  │
  └──── stripe_customers

stripe_webhook_events       admin_audit_log
```

## Why the current product shape changes

The frontend currently stores `price`, `sizes`, `color`, and aggregate `stock` directly on each product. That works for a demo, but it cannot answer whether a blue XL hoodie is available independently from a black M hoodie.

- `products` stores merchandising content: name, description, garment, stack, theme, visibility, and featured state.
- `product_variants` stores each sellable SKU: size, color, price, currency, and status.
- `inventory` stores on-hand and reserved quantities per SKU.
- `product_images` preserves image order and can optionally target one variant.
- `tech_themes` makes `devicons.md` data manageable rather than repeating arbitrary logo/name strings.

For the first data migration, create one variant for each existing product/size combination. Divide the current product stock across those variants only if that reflects reality; otherwise inventory must be entered per size before checkout goes live.

## Customers and admins

`users.role` supports the current customer/admin split. Authorization must be enforced by Go middleware on every admin endpoint; the role sent by a browser is never authoritative. Soft deletion keeps order relationships and audit history intact. `user_sessions` stores only hashed refresh tokens and supports per-device revocation; `user_action_tokens` covers email verification and password resets without storing raw tokens.

Saved addresses are normalized for account reuse. Orders deliberately snapshot the shipping/billing address and customer identity so later profile edits do not rewrite historical invoices or shipments. Guest orders have a null `user_id` but retain their checkout email.

`admin_audit_log` records sensitive catalog, inventory, order, refund, and role changes. The application should write it in the same database transaction as the admin mutation.

## Checkout and inventory lifecycle

1. The Go API loads the cart and locks the relevant inventory rows.
2. It recalculates all prices, shipping, discounts, and taxes from database values. Client totals are ignored.
3. It creates an order plus immutable order-item snapshots in `pending_payment` state.
4. It reserves stock and records `inventory_movements` in the same transaction.
5. It creates a Stripe Checkout Session (recommended for the initial integration) or PaymentIntent with the order ID in Stripe metadata and a deterministic idempotency key.
6. The browser redirect is only UX. A verified Stripe webhook marks the payment/order paid and converts reservations into sales.
7. Failed or expired checkout releases reservations. A scheduled Go worker should also expire stale reservations defensively.

Use `SELECT ... FOR UPDATE` on inventory rows during reservation, always acquire locks in sorted variant-ID order, and keep the transaction short to avoid overselling and deadlocks.

## Stripe boundary

`orders` remains the commercial source of truth. Stripe identifiers live in integration tables:

- `stripe_customers` maps an Olmeware account to a Stripe Customer.
- `payments` permits multiple attempts for one order and stores either Checkout Session or PaymentIntent IDs.
- `refunds` supports partial and repeated refunds.
- `stripe_webhook_events` provides webhook idempotency, retry state, and a limited raw event audit trail.

The webhook handler must verify the Stripe signature against the raw request body before inserting the event. Insert `stripe_event_id` first; the primary key makes duplicate delivery harmless. Process state changes transactionally and do not trust a success redirect. Keep card data and client secrets out of this database.

Stripe currently recommends Checkout Sessions for most integrations. If PaymentIntents are chosen later, the schema already supports them and multiple attempts. Stripe also recommends associating one PaymentIntent with one cart/session, reusing it when appropriate, using idempotency keys, and relying on webhooks for final status.

## Go implementation notes

- Use `pgx` with explicit transactions for checkout, inventory, webhook processing, cancellation, and refunds.
- Use a pooled connection string for normal API traffic and a direct connection for migrations.
- Create separate database roles for migrations and runtime. The runtime role should receive only the required privileges on `olmeware`.
- Store UTC `timestamptz` values and format them in the client timezone.
- Generate typed Go queries with `sqlc` if desired; all primary keys are UUIDs except the append-only audit identity.
- Treat order and order-item financial fields as immutable after placement. Refunds are new rows, not negative edits to the original order.
- Do not expose the private schema through Supabase Data API. If browser-to-database access is introduced, enable RLS on every exposed table and add ownership policies before granting access.

## Deliberately deferred

Promotions/coupons, tax-provider calculations, returns/RMAs, wishlists, product reviews, multi-warehouse inventory, and localized catalog content are not required by the current UI. The core model can add them without changing order/payment history.
