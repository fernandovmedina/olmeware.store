import fs from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import LogoLibrary from "./logo-library";

export const metadata: Metadata = {
  title: "Logo library — OLMEWARE Admin",
  description: "Browse and filter the tech logos available for merchandise",
};

type CatalogEntry = {
  name: string;
  category: string;
};

const FILE_ALIASES: Record<string, string> = {
  "c#": "csharp",
  "c++": "cplusplus",
  "tailwind css": "tailwindcss",
  "sass / scss": "sass",
  "styled-components": "styled-components",
  "anthropic / claude": "anthropic",
  "google cloud platform": "gcp",
  "github actions": "githubactions",
  "gitlab ci": "gitlabci",
  "new relic": "newrelic",
  "vault (hashicorp)": "vault",
  "testing library": "testing-library",
  "react native": "reactnative",
  "web3.js": "web3js",
  "ethers.js": "ethersjs",
  "arch linux": "archlinux",
  "kali linux": "kalilinux",
  "vs code": "vscode",
  "intellij idea": "intellij",
  "linux foundation": "linuxfoundation",
  ".net / asp.net": "dotnet",
  "rails (ruby on rails)": "rails",
  "phoenix (elixir)": "phoenix",
  "actix (rust)": "actix",
  "gin (go)": "gin",
  "fiber (go)": "fiber",
  "axum (rust)": "axum",
  "bun (runtime + package manager)": "bun",
  "make / makefile": "make",
  "cargo (rust)": "cargo",
  "swift (ios)": "swift",
  "kotlin (android)": "kotlin",
  "scikit-learn": "scikitlearn",
  "hugging face": "huggingface",
  "stable diffusion": "stablediffusion",
  "weights & biases": "wandb",
  "fly.io": "flyio",
  "shadcn/ui": "shadcnui",
  "radix ui": "radixui",
  "sql server": "sqlserver",
};

const normalize = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "");

const parseCatalog = (markdown: string): CatalogEntry[] => {
  const entries: CatalogEntry[] = [];
  let category = "Uncatalogued";

  for (const line of markdown.split("\n")) {
    if (line.startsWith("## ")) {
      category = line.slice(3).trim();
    } else if (line.startsWith("- ")) {
      entries.push({ name: line.slice(2).trim(), category });
    }
  }

  return entries;
};

const AdminLogosPage = async () => {
  const root = process.cwd();
  const [files, markdown] = await Promise.all([
    fs.readdir(path.join(root, "public", "logos")),
    fs.readFile(path.join(root, "devicons.md"), "utf8"),
  ]);
  const catalog = parseCatalog(markdown);
  const byFilename = new Map<string, CatalogEntry>();

  for (const entry of catalog) {
    const alias = FILE_ALIASES[entry.name.toLowerCase()];
    byFilename.set(alias ?? normalize(entry.name), entry);
  }

  const logos = files
    .filter((file) => file.toLowerCase().endsWith(".svg"))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => {
      const filename = file.slice(0, -4);
      const entry = byFilename.get(filename) ?? byFilename.get(normalize(filename));

      return {
        filename,
        name: entry?.name ?? filename,
        category: entry?.category ?? "Uncatalogued",
        src: `/logos/${file}`,
      };
    });

  return <LogoLibrary logos={logos} />;
};

export default AdminLogosPage;
