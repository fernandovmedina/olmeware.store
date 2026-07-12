"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductVisual from "@/components/product-visual";
import {
  ALL_SIZES,
  GARMENT_COLORS,
  GARMENT_LABELS,
  STACK_LABELS,
} from "@/lib/constants";
import { useCollections, useHydrated } from "@/lib/hooks";
import {
  clearDesignDraft,
  getDesignDraft,
  getProduct,
  saveProduct,
} from "@/lib/store";
import type { GarmentType, Product, Size, Stack } from "@/lib/types";
import { LOGO_SLUGS } from "@/lib/logos";

const LOGO_OPTIONS = LOGO_SLUGS;

const emptyForm = (): Product => ({
  id: crypto.randomUUID(),
  name: "",
  description: "",
  garment: "shirt",
  stack: "languages",
  tech: "",
  price: 449,
  sizes: ["S", "M", "L", "XL"],
  color: "#1a1a1a",
  logo: undefined,
  images: [],
  collectionId: undefined,
  featured: false,
  status: "active",
  stock: 10,
  createdAt: new Date().toISOString(),
});

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <label className="flex flex-col gap-1.5 text-sm font-medium">
    {label}
    {children}
  </label>
);

const inputClass =
  "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-neutral-500";

const ProductForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const collections = useCollections();
  const hydrated = useHydrated();
  const editId = searchParams.get("id");
  const fromEditor = searchParams.get("from") === "editor";

  const initial = useMemo(() => {
    if (!hydrated) return null;
    if (editId) {
      const existing = getProduct(editId);
      if (existing) return { form: existing, notice: "" };
      return { form: emptyForm(), notice: "Product not found — creating a new one instead." };
    }
    if (fromEditor) {
      const draft = getDesignDraft();
      if (draft) {
        return {
          form: {
            ...emptyForm(),
            garment: draft.garment,
            color: draft.color,
            images: draft.images,
          },
          notice: "Design loaded from the mockup editor.",
        };
      }
    }
    return { form: emptyForm(), notice: "" };
  }, [hydrated, editId, fromEditor]);

  const [edits, setEdits] = useState<Partial<Product>>({});
  const [error, setError] = useState("");

  if (!initial) {
    return <div className="p-8 text-sm text-neutral-500">Loading…</div>;
  }

  const form: Product = { ...initial.form, ...edits };
  const notice = initial.notice;

  const update = (patch: Partial<Product>) =>
    setEdits((e) => ({ ...e, ...patch }));

  const toggleSize = (size: Size) =>
    update({
      sizes: form.sizes.includes(size)
        ? form.sizes.filter((s) => s !== size)
        : [...ALL_SIZES.filter((s) => form.sizes.includes(s) || s === size)],
    });

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files)
      .filter((f) => f.type === "image/webp" || f.type === "image/svg+xml")
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = () =>
          setEdits((e) => ({
            ...e,
            images: [...(e.images ?? initial.form.images), reader.result as string],
          }));
        reader.readAsDataURL(file);
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Give the product a name.");
      return;
    }
    if (form.sizes.length === 0) {
      setError("Pick at least one size.");
      return;
    }
    if (form.price <= 0) {
      setError("Price must be greater than zero.");
      return;
    }
    saveProduct({ ...form, name: form.name.trim(), tech: form.tech.trim() });
    if (fromEditor) clearDesignDraft();
    router.push("/admin/products");
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {editId ? "Edit product" : "New product"}
        </h1>
        <p className="text-sm text-neutral-500">
          {editId
            ? "Update the product and save your changes."
            : "Add new merch to the catalog. Clients see it as soon as it's active."}
        </p>
      </div>

      {notice && (
        <p className="mb-6 w-fit rounded-lg bg-sky-50 px-4 py-2 text-sm text-sky-700">
          {notice}
        </p>
      )}

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-5 rounded-xl border border-neutral-200 bg-white p-6 lg:col-span-2">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name">
              <input
                type="text"
                value={form.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="Rust Fearless Hoodie"
                className={inputClass}
              />
            </Field>
            <Field label="Tech / theme">
              <input
                type="text"
                value={form.tech}
                onChange={(e) => update({ tech: e.target.value })}
                placeholder="Rust"
                list="tech-options"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              rows={3}
              placeholder="Memory-safe warmth with zero-cost abstractions."
              className={inputClass}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Garment type">
              <select
                value={form.garment}
                onChange={(e) =>
                  update({ garment: e.target.value as GarmentType })
                }
                className={inputClass}
              >
                {(Object.keys(GARMENT_LABELS) as GarmentType[]).map((g) => (
                  <option key={g} value={g}>
                    {GARMENT_LABELS[g]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Stack">
              <select
                value={form.stack}
                onChange={(e) => update({ stack: e.target.value as Stack })}
                className={inputClass}
              >
                {(Object.keys(STACK_LABELS) as Stack[]).map((s) => (
                  <option key={s} value={s}>
                    {STACK_LABELS[s]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Price (MXN)">
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => update({ price: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
            <Field label="Stock">
              <input
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => update({ stock: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Sizes</p>
            <div className="flex flex-wrap gap-2">
              {ALL_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSize(s)}
                  className={`min-w-12 rounded-lg border px-3 py-2 text-sm font-medium ${
                    form.sizes.includes(s)
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
            <p className="mb-2 text-sm font-medium">Garment color</p>
            <div className="flex flex-wrap gap-2">
              {GARMENT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => update({ color: c })}
                  aria-label={`Color ${c}`}
                  className={`h-9 w-9 rounded-lg border-2 ${
                    form.color === c ? "border-sky-500" : "border-neutral-200"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Collection">
              <select
                value={form.collectionId ?? ""}
                onChange={(e) =>
                  update({ collectionId: e.target.value || undefined })
                }
                className={inputClass}
              >
                <option value="">No collection</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) =>
                  update({ status: e.target.value as Product["status"] })
                }
                className={inputClass}
              >
                <option value="active">Active (visible to clients)</option>
                <option value="draft">Draft (hidden)</option>
              </select>
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.featured ?? false}
              onChange={(e) => update({ featured: e.target.checked })}
            />
            Featured on the home page
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex gap-3 border-t border-neutral-100 pt-5">
            <button
              type="submit"
              className="rounded-lg bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700"
            >
              {editId ? "Save changes" : "Create product"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="rounded-lg border border-neutral-300 px-6 py-2.5 text-sm font-medium hover:border-neutral-500"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="flex h-fit flex-col gap-5">
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <p className="mb-3 text-sm font-medium">Preview</p>
            <div className="rounded-lg bg-neutral-100 p-4">
              <ProductVisual
                product={form}
                className="aspect-square w-full object-contain"
              />
            </div>
            {form.images.length === 0 && (
              <p className="mt-2 text-xs text-neutral-400">
                Live mockup from garment, color, and logo. Uploaded images
                replace it.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <Field label="Tech logo (for the mockup)">
              <select
                value={form.logo ?? ""}
                onChange={(e) => update({ logo: e.target.value || undefined })}
                className={inputClass}
              >
                <option value="">No logo</option>
                {LOGO_OPTIONS.map((logo) => (
                  <option key={logo} value={`/logos/${logo}.svg`}>
                    {logo}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <p className="mb-2 text-sm font-medium">Images</p>
            <label className="block cursor-pointer rounded-lg border-2 border-dashed border-neutral-300 px-3 py-5 text-center text-sm text-neutral-500 hover:border-neutral-400">
              Upload .webp or .svg
              <input
                type="file"
                accept="image/webp,image/svg+xml"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            {form.images.length > 0 && (
              <ul className="mt-3 grid grid-cols-3 gap-2">
                {form.images.map((src, i) => (
                  <li key={i} className="group relative rounded-lg bg-neutral-100 p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Image ${i + 1}`}
                      className="aspect-square w-full rounded object-contain"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        update({ images: form.images.filter((_, j) => j !== i) })
                      }
                      className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-xs text-white group-hover:flex"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </form>

      <datalist id="tech-options">
        {LOGO_OPTIONS.map((logo) => (
          <option key={logo} value={logo} />
        ))}
      </datalist>
    </div>
  );
};

const NewProductPage = () => (
  <Suspense>
    <ProductForm />
  </Suspense>
);

export default NewProductPage;
