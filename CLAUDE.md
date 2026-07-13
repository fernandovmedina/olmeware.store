# Olmeware Store — CLAUDE.md

## What is this project

Tech-culture clothing brand and e-commerce store: shirts, sweaters, hoodies, and caps themed around programming languages, frameworks, dev tools, and AI. Future lines may include other apparel, but that's the current scope.

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · pnpm · ESLint (eslint-config-next)

## Project structure

```
app/
  layout.tsx      — root layout + pre-paint theme init script
  globals.css     — Tailwind import, dark-mode variant + color-variable remap
  (store)/        — storefront: home, shop (filtered catalog), product/[id], cart, login, register
  admin/          — admin panel: dashboard, products, collections, logo library, mockup editor (see app/admin/README.md)
components/       — shared UI: garment SVGs, product visual/card, header, footer, theme toggle
lib/              — localStorage data layer: types, constants, seed, store, hooks (see lib/README.md)
public/logos/     — devicon SVG logos used on merch mockups
devicons.md       — full catalog of tech themes for product designs, organized by category
```

## Key commands

```bash
pnpm dev      # dev server (localhost:3000)
pnpm build    # production build
pnpm start    # serve production build
pnpm lint     # ESLint
```

## Theming (light/dark)

- Theme is a `data-theme="light" | "dark"` attribute on `<html>`, set before paint by an inline script in `app/layout.tsx` (reads localStorage `theme`, falls back to OS preference). `components/theme-toggle.tsx` switches and persists it; it's mounted in the storefront header and admin sidebar.
- `app/globals.css` defines a `@custom-variant dark` and remaps Tailwind's `--color-*` variables under `:root[data-theme="dark"]`. Since Tailwind v4 compiles color utilities to `var(--color-*)`, the whole site flips without `dark:` classes — **don't add `dark:` color classes**; if you use a color utility not yet remapped, add its dark value to globals.css instead.
- Side effect of the inversion: surfaces that are dark in light mode (home hero) become light in dark mode. Accepted design.
- Opt-out: the `theme-lock` class (globals.css) restores the original palette within a subtree so it looks the same in both themes. The admin sidebar uses it — it stays dark always.
- Product/garment mockup colors are literal hex values and intentionally not themed.

## Admin panel

- Guarded client-side: non-admin sessions are redirected to `/login` from `app/admin/layout.tsx`.
- Sidebar is retractable: an edge chevron button slides it off-canvas; collapsed state persists in localStorage `admin-sidebar`.

## Product catalog

All tech themes for merch designs live in `devicons.md`. When adding products or design themes, check it first and keep it updated.

## Conventions

- App Router only; co-locate components close to where they're used.
- Tailwind utility classes only — no custom CSS unless Tailwind can't handle it.
- No comments unless the reason is non-obvious.
- Keep components small and focused.

## Notes

- Very early stage (v0.1.0). Frontends are built; data lives in a localStorage layer (`lib/store.ts`) seeded from `lib/seed.ts` until the API exists. No backend, payments, or real auth yet.
- Demo login: `admin@olmeware.store` / `admin123`; customers register client-side.
- Supabase is available via MCP tools for when a database/auth layer is needed.
- Dev gotcha: a stale `pnpm dev` holding port 3000 serves stale CSS — kill it (`lsof -nP -iTCP:3000`) before verifying style changes.
