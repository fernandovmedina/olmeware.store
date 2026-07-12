"use client";

const setTheme = (t: "light" | "dark") => {
  document.documentElement.dataset.theme = t;
  try {
    localStorage.setItem("theme", t);
  } catch {}
};

const ThemeToggle = ({ className = "" }: { className?: string }) => (
  <button
    type="button"
    aria-label="Toggle light/dark theme"
    title="Toggle theme"
    onClick={() =>
      setTheme(
        document.documentElement.dataset.theme === "dark" ? "light" : "dark",
      )
    }
    className={`flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition hover:text-neutral-900 ${className}`}
  >
    {/* Moon — shown in light mode (click to go dark) */}
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 dark:hidden"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
    {/* Sun — shown in dark mode (click to go light) */}
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="hidden h-4 w-4 dark:block"
    >
      <circle cx={12} cy={12} r={4} />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  </button>
);

export default ThemeToggle;
