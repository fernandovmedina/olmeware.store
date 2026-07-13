"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ProductCard from "@/components/product-card";
import ProductVisual from "@/components/product-visual";
import {
  GARMENT_LABELS,
  SIDE_LABELS,
  STACK_LABELS,
  formatPrice,
} from "@/lib/constants";
import { useHydrated, useProducts } from "@/lib/hooks";
import { addToCart } from "@/lib/store";
import type { Side, Size } from "@/lib/types";

type View = { kind: "svg"; side: Side } | { kind: "image"; src: string };

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const products = useProducts();
  const hydrated = useHydrated();
  const product = products.find((p) => p.id === id);

  const views = useMemo<View[]>(() => {
    if (!product) return [];
    if (product.images.length > 0) {
      return product.images.map((src) => ({ kind: "image", src }));
    }
    return [
      { kind: "svg", side: "front" },
      { kind: "svg", side: "back" },
    ];
  }, [product]);

  const [viewIndex, setViewIndex] = useState(0);
  const [size, setSize] = useState<Size | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!hydrated) return <div className="min-h-[60vh]" />;

  if (!product) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-7xl flex-col items-center justify-center gap-3 px-4">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Link href="/shop" className="text-sm underline">
          Back to the catalog
        </Link>
      </div>
    );
  }

  const related = products
    .filter(
      (p) => p.status === "active" && p.id !== product.id && p.stack === product.stack,
    )
    .slice(0, 4);
  const view = views[Math.min(viewIndex, views.length - 1)];

  const handleAdd = () => {
    if (!size) return;
    addToCart(product.id, size, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-neutral-500">
        <Link href="/" className="hover:text-neutral-900">Home</Link>
        {" / "}
        <Link href="/shop" className="hover:text-neutral-900">Catalog</Link>
        {" / "}
        <span className="text-neutral-900">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-100 p-6">
            {view.kind === "svg" ? (
              <ProductVisual
                product={product}
                side={view.side}
                className="aspect-square w-full object-contain"
              />
            ) : (
              <ProductVisual
                product={product}
                image={view.src}
                className="aspect-square w-full object-contain"
              />
            )}
          </div>
          <div className="mt-4 flex gap-3">
            {views.map((v, i) => (
              <button
                key={i}
                onClick={() => setViewIndex(i)}
                className={`w-20 rounded-lg border bg-neutral-100 p-2 ${
                  i === viewIndex
                    ? "border-neutral-900"
                    : "border-neutral-200 hover:border-neutral-400"
                }`}
              >
                {v.kind === "svg" ? (
                  <ProductVisual
                    product={product}
                    side={v.side}
                    className="aspect-square w-full"
                  />
                ) : (
                  <ProductVisual
                    product={product}
                    image={v.src}
                    className="aspect-square w-full object-contain"
                  />
                )}
                <span className="mt-1 block text-center text-xs text-neutral-500">
                  {v.kind === "svg" ? SIDE_LABELS[v.side] : `View ${i + 1}`}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2 text-xs font-medium uppercase tracking-wide">
            <span className="rounded-full bg-neutral-900 px-3 py-1 text-white">
              {GARMENT_LABELS[product.garment]}
            </span>
            <span className="rounded-full bg-neutral-200 px-3 py-1 text-neutral-700">
              {STACK_LABELS[product.stack]}
            </span>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-700">
              {product.tech}
            </span>
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <p className="mt-2 text-2xl font-semibold">
              {formatPrice(product.price)}
            </p>
          </div>

          <p className="text-neutral-600">{product.description}</p>

          <div>
            <p className="mb-2 text-sm font-semibold">Size</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`min-w-12 rounded-lg border px-3 py-2 text-sm font-medium ${
                    size === s
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 hover:border-neutral-500"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">Quantity</p>
            <div className="flex w-fit items-center rounded-lg border border-neutral-300">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-4 py-2 text-lg hover:bg-neutral-100"
              >
                −
              </button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(99, q + 1))}
                className="px-4 py-2 text-lg hover:bg-neutral-100"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={!size}
            className="rounded-lg bg-neutral-900 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {added
              ? "Added to cart ✓"
              : size
                ? "Add to cart"
                : "Select a size"}
          </button>

          <p className="text-sm text-neutral-500">
            Made to order. Production begins after your order is confirmed.
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-bold tracking-tight">
            More from {STACK_LABELS[product.stack]}
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductPage;
