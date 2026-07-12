"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, useHydrated, useSession } from "@/lib/hooks";
import { logout } from "@/lib/store";
import ThemeToggle from "@/components/theme-toggle";

const NAV_LINKS = [
  { label: "Shop all", href: "/shop" },
  { label: "Shirts", href: "/shop?type=shirt" },
  { label: "Sweaters", href: "/shop?type=sweater" },
  { label: "Hoodies", href: "/shop?type=hoodie" },
  { label: "Caps", href: "/shop?type=cap" },
];

const Header = () => {
  const router = useRouter();
  const session = useSession();
  const cart = useCart();
  const hydrated = useHydrated();
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-black tracking-tight">
          OLMEWARE
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-neutral-600 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-neutral-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4 text-sm">
          <ThemeToggle />
          {hydrated && session ? (
            <div className="flex items-center gap-3">
              {session.role === "admin" && (
                <Link
                  href="/admin"
                  className="rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700"
                >
                  Admin
                </Link>
              )}
              <span className="hidden text-neutral-500 sm:inline">
                Hi, {session.name.split(" ")[0]}
              </span>
              <button
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="text-neutral-600 hover:text-neutral-900"
              >
                Log out
              </button>
            </div>
          ) : (
            <Link href="/login" className="text-neutral-600 hover:text-neutral-900">
              Log in
            </Link>
          )}
          <Link
            href="/cart"
            className="relative flex items-center gap-1 font-medium text-neutral-900"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="h-5 w-5"
            >
              <path d="M3 3h2l2.4 12.2a1.5 1.5 0 0 0 1.5 1.3h8.6a1.5 1.5 0 0 0 1.5-1.2L21 7H6" />
              <circle cx={10} cy={20} r={1.4} />
              <circle cx={17} cy={20} r={1.4} />
            </svg>
            Cart
            {hydrated && cartCount > 0 && (
              <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-500 px-1 text-xs font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
      <nav className="flex gap-4 overflow-x-auto border-t border-neutral-100 px-4 py-2 text-sm text-neutral-600 md:hidden">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="whitespace-nowrap">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
};

export default Header;
