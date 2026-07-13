"use client";

import Link from "next/link";
import ProductVisual from "@/components/product-visual";
import {
  GARMENT_LABELS,
  STACK_LABELS,
  formatPrice,
} from "@/lib/constants";
import { useCollections, useProducts } from "@/lib/hooks";
import type { GarmentType } from "@/lib/types";

const StatCard = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) => (
  <div className="rounded-xl border border-neutral-200 bg-white p-5">
    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
      {label}
    </p>
    <p className="mt-2 text-2xl font-bold">{value}</p>
    {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
  </div>
);

const AdminDashboard = () => {
  const products = useProducts();
  const collections = useCollections();

  const active = products.filter((p) => p.status === "active");
  const drafts = products.filter((p) => p.status === "draft");
  const recent = [...products]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);
  const maxGarmentCount = Math.max(
    1,
    ...(Object.keys(GARMENT_LABELS) as GarmentType[]).map(
      (g) => products.filter((p) => p.garment === g).length,
    ),
  );

  return (
    <div className="p-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-neutral-500">
            Catalog overview for Olmeware Store.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700"
        >
          + New product
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Products"
          value={String(products.length)}
          hint={`${active.length} active · ${products.length - active.length} draft`}
        />
        <StatCard
          label="Active products"
          value={String(active.length)}
          hint="Visible on the storefront"
        />
        <StatCard
          label="Draft products"
          value={String(drafts.length)}
          hint="Hidden from customers"
        />
        <StatCard
          label="Collections"
          value={String(collections.length)}
          hint="Grouping shown on the storefront"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 font-semibold">Products by garment</h2>
          <div className="flex flex-col gap-3">
            {(Object.keys(GARMENT_LABELS) as GarmentType[]).map((g) => {
              const count = products.filter((p) => p.garment === g).length;
              return (
                <div key={g}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{GARMENT_LABELS[g]}s</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-100">
                    <div
                      className="h-2 rounded-full bg-neutral-900"
                      style={{ width: `${(count / maxGarmentCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recently added</h2>
            <Link
              href="/admin/products"
              className="text-sm text-neutral-500 hover:text-neutral-900"
            >
              View all →
            </Link>
          </div>
          <ul className="divide-y divide-neutral-100">
            {recent.map((p) => (
              <li key={p.id} className="flex items-center gap-4 py-3">
                <div className="w-12 shrink-0 rounded-lg bg-neutral-100 p-1">
                  <ProductVisual product={p} className="aspect-square w-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="text-xs text-neutral-500">
                    {GARMENT_LABELS[p.garment]} · {STACK_LABELS[p.stack]}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    p.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-neutral-200 text-neutral-600"
                  }`}
                >
                  {p.status}
                </span>
                <span className="w-24 text-right text-sm font-semibold">
                  {formatPrice(p.price)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
