import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OLMEWARE STORE",
  description: "Tech Clothing & More",
  icons: {
    icon: "/logos/react.svg",
  },
};

const themeInit = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();`;

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <html
    lang="en"
    suppressHydrationWarning
    className={`${roboto.variable} h-full antialiased`}
  >
    <head>
      <script dangerouslySetInnerHTML={{ __html: themeInit }} />
    </head>
    <body className="min-h-full flex flex-col">{children}</body>
  </html>
);

export default RootLayout;
