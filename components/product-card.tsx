"use client";

import Link from "next/link";
import { GARMENT_LABELS, formatPrice } from "@/lib/constants";
import type { Product } from "@/lib/types";
import ProductVisual from "./product-visual";

const ProductCard = ({ product }: { product: Product }) => (
  <Link
    href={`/product/${product.id}`}
    className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition hover:border-neutral-400 hover:shadow-md"
  >
    <div className="bg-neutral-100 p-4">
      <ProductVisual
        product={product}
        className="aspect-square w-full object-contain transition group-hover:scale-[1.03]"
      />
    </div>
    <div className="flex flex-1 flex-col gap-1 p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">
        {GARMENT_LABELS[product.garment]} · {product.tech}
      </p>
      <h3 className="font-medium text-neutral-900 group-hover:underline">
        {product.name}
      </h3>
      <p className="mt-auto pt-1 font-semibold text-neutral-900">
        {formatPrice(product.price)}
      </p>
    </div>
  </Link>
);

export default ProductCard;
