"use client";

import { useMemo, useState } from "react";

type Logo = {
  filename: string;
  name: string;
  category: string;
  src: string;
};

const ALL_CATEGORIES = "All";

const LogoLibrary = ({ logos }: { logos: Logo[] }) => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const categories = useMemo(
    () => [
      ALL_CATEGORIES,
      ...Array.from(new Set(logos.map((logo) => logo.category))).sort((a, b) =>
        a.localeCompare(b),
      ),
    ],
    [logos],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return logos.filter(
      (logo) =>
        (category === ALL_CATEGORIES || logo.category === category) &&
        (q === "" ||
          logo.name.toLowerCase().includes(q) ||
          logo.filename.toLowerCase().includes(q) ||
          logo.category.toLowerCase().includes(q)),
    );
  }, [category, logos, query]);

  return (
    <div className="min-w-0 overflow-x-hidden p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Logo library</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {logos.length} SVG logos available in the merch catalog.
        </p>
      </div>

      <div className="sticky top-0 z-10 -mx-8 mb-6 border-y border-neutral-200 bg-neutral-100/95 px-8 py-4 backdrop-blur">
        <div className="flex flex-wrap gap-3">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search logos…"
            className="min-w-64 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition ${
                category === item
                  ? "bg-neutral-900 text-white"
                  : "border border-neutral-300 bg-white text-neutral-600 hover:border-neutral-500"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between text-sm text-neutral-500">
        <p>
          Showing {filtered.length} of {logos.length}
        </p>
        {(query || category !== ALL_CATEGORIES) && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory(ALL_CATEGORIES);
            }}
            className="font-medium text-neutral-700 hover:text-neutral-950"
          >
            Clear filters
          </button>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {filtered.map((logo) => (
            <article
              key={logo.filename}
              className="group overflow-hidden rounded-xl border border-neutral-200 bg-white transition hover:border-neutral-400 hover:shadow-sm"
            >
              <div className="flex aspect-square items-center justify-center bg-neutral-50 p-7">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo.src}
                  alt={`${logo.name} logo`}
                  loading="lazy"
                  className="h-full w-full object-contain transition group-hover:scale-105"
                />
              </div>
              <div className="border-t border-neutral-100 p-3">
                <h2 className="truncate text-sm font-semibold" title={logo.name}>
                  {logo.name}
                </h2>
                <p className="mt-0.5 truncate text-xs text-neutral-500" title={logo.category}>
                  {logo.category}
                </p>
                <code className="mt-2 block truncate text-[10px] text-neutral-400">
                  {logo.src}
                </code>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white text-center">
          <p className="font-medium">No logos found</p>
          <p className="mt-1 text-sm text-neutral-500">Try another name or category.</p>
        </div>
      )}
    </div>
  );
};

export default LogoLibrary;
