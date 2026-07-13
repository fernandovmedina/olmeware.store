export type GarmentType = "shirt" | "sweater" | "hoodie" | "cap";

export type Side = "front" | "back";

export type Stack =
  | "languages"
  | "frontend"
  | "backend"
  | "ai-ml"
  | "devops"
  | "databases"
  | "cloud"
  | "tools";

export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL";

export type ProductStatus = "active" | "draft";

export type Product = {
  id: string;
  name: string;
  description: string;
  garment: GarmentType;
  stack: Stack;
  tech: string;
  price: number;
  sizes: Size[];
  color: string;
  logo?: string;
  images: string[];
  collectionId?: string;
  featured?: boolean;
  status: ProductStatus;
  createdAt: string;
};

export type Collection = {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
};

export type CartItem = {
  productId: string;
  size: Size;
  qty: number;
};

export type Role = "admin" | "customer";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  createdAt: string;
};

export type Session = {
  userId: string;
  name: string;
  email: string;
  role: Role;
};

export type DesignDraft = {
  garment: GarmentType;
  color: string;
  images: string[];
};
