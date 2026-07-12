"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useHydrated, useSession } from "@/lib/hooks";
import { logout } from "@/lib/store";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin" },
  { label: "Products", href: "/admin/products" },
  { label: "New product", href: "/admin/products/new" },
  { label: "Collections", href: "/admin/collections" },
  { label: "Logo library", href: "/admin/logos" },
  { label: "Mockup editor", href: "/admin/create" },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();
  const hydrated = useHydrated();
  const isAdmin = session?.role === "admin";

  useEffect(() => {
    if (hydrated && !isAdmin) router.replace("/login");
  }, [hydrated, isAdmin, router]);

  if (!hydrated || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 text-sm text-neutral-500">
        {hydrated ? "Redirecting to login…" : "Loading…"}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-100 text-neutral-900">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-56 flex-col bg-neutral-950 text-neutral-300">
        <Link
          href="/admin"
          className="px-5 py-5 text-lg font-black tracking-tight text-white"
        >
          OLMEWARE
          <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-widest text-neutral-500">
            Admin panel
          </span>
        </Link>
        <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href ||
                  (item.href === "/admin/products" &&
                    pathname.startsWith("/admin/products") &&
                    pathname !== "/admin/products/new");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-neutral-800 font-semibold text-white"
                    : "hover:bg-neutral-900 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-neutral-800 p-4 text-sm">
          <p className="truncate text-neutral-400">{session.email}</p>
          <div className="mt-3 flex items-center justify-between">
            <Link href="/" className="text-neutral-400 hover:text-white">
              View store
            </Link>
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="text-neutral-400 hover:text-white"
            >
              Log out
            </button>
          </div>
        </div>
      </aside>
      <div className="ml-56 flex-1">{children}</div>
    </div>
  );
};

export default AdminLayout;
