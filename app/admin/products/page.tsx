"use client";

import { useState } from "react";
import Link from "next/link";
import ProductVisual from "@/components/product-visual";
import { GARMENT_LABELS, STACK_LABELS, formatPrice } from "@/lib/constants";
import { useCollections, useProducts } from "@/lib/hooks";
import { deleteProduct, saveProduct } from "@/lib/store";

const AdminProductsPage = () => {
  const products = useProducts();
  const collections = useCollections();
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = products.filter(
    (p) =>
      q === "" ||
      p.name.toLowerCase().includes(q) ||
      p.tech.toLowerCase().includes(q) ||
      STACK_LABELS[p.stack].toLowerCase().includes(q),
  );

  const collectionName = (id?: string) =>
    collections.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-neutral-500">
            {products.length} products in the catalog.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="w-64 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
          <Link
            href="/admin/products/new"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700"
          >
            + New product
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full min-w-[840px] text-left text-sm">
          <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Garment</th>
              <th className="px-4 py-3">Stack</th>
              <th className="px-4 py-3">Collection</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 shrink-0 rounded-lg bg-neutral-100 p-1">
                      <ProductVisual
                        product={p}
                        className="aspect-square w-full"
                      />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/product/${p.id}`}
                        className="block max-w-52 truncate font-medium hover:underline"
                      >
                        {p.name}
                      </Link>
                      <p className="text-xs text-neutral-500">{p.tech}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{GARMENT_LABELS[p.garment]}</td>
                <td className="px-4 py-3">{STACK_LABELS[p.stack]}</td>
                <td className="px-4 py-3">{collectionName(p.collectionId)}</td>
                <td className="px-4 py-3 font-medium">{formatPrice(p.price)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() =>
                      saveProduct({
                        ...p,
                        status: p.status === "active" ? "draft" : "active",
                      })
                    }
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      p.status === "active"
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
                    }`}
                    title="Toggle active / draft"
                  >
                    {p.status}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3 text-xs">
                    <Link
                      href={`/admin/products/new?id=${p.id}`}
                      className="font-medium text-neutral-600 hover:text-neutral-900"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${p.name}"?`)) deleteProduct(p.id);
                      }}
                      className="font-medium text-neutral-400 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-neutral-500">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProductsPage;
