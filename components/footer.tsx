import Link from "next/link";

const Footer = () => (
  <footer className="mt-16 border-t border-neutral-200 bg-white text-neutral-600">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
      <div>
        <p className="text-lg font-black tracking-tight text-neutral-900">OLMEWARE</p>
        <p className="mt-2 max-w-xs text-sm text-neutral-500">
          Tech clothing for people who ship. Shirts, sweaters, hoodies, and caps
          themed around the stacks you love.
        </p>
      </div>
      <div className="text-sm">
        <p className="mb-3 font-semibold text-neutral-900">Shop</p>
        <ul className="flex flex-col gap-2 text-neutral-500">
          <li><Link href="/shop" className="hover:text-neutral-900">All products</Link></li>
          <li><Link href="/shop?type=shirt" className="hover:text-neutral-900">Shirts</Link></li>
          <li><Link href="/shop?type=hoodie" className="hover:text-neutral-900">Hoodies</Link></li>
          <li><Link href="/shop?type=cap" className="hover:text-neutral-900">Caps</Link></li>
        </ul>
      </div>
      <div className="text-sm">
        <p className="mb-3 font-semibold text-neutral-900">Account</p>
        <ul className="flex flex-col gap-2 text-neutral-500">
          <li><Link href="/login" className="hover:text-neutral-900">Log in</Link></li>
          <li><Link href="/register" className="hover:text-neutral-900">Create account</Link></li>
          <li><Link href="/cart" className="hover:text-neutral-900">Cart</Link></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-neutral-100 py-4 text-center text-xs text-neutral-500">
      © {new Date().getFullYear()} Olmeware Store. Wear your stack.
    </div>
  </footer>
);

export default Footer;
