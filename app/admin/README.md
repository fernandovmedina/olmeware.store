# app/admin

Admin panel. `layout.tsx` renders the sidebar shell and guards every page: without an
admin session (log in as `admin@olmeware.store` / `admin123`) you are redirected to
`/login`. Auth is client-side only until the real backend exists.

| Route | Purpose |
| --- | --- |
| `/admin` | Dashboard: product and collection stats, garment breakdown, recently added. |
| `/admin/products` | Product table: search, toggle active/draft, edit, delete. |
| `/admin/products/new` | Create a made-to-order product (also edits via `?id=`). Garment type, stack, sizes, color, price, collection, logo, `.webp`/`.svg` image uploads, live mockup preview. Picks up designs sent from the mockup editor (`?from=editor`). |
| `/admin/collections` | Create/delete collections that group merch on the storefront. |
| `/admin/create` | Mockup editor: drag logos onto an SVG garment, export a PNG, or send the design straight to the new-product form. |
