// src/utils/dataTransformers.ts
export interface DbProduct {
  id: string;
  productName: string;
  productDescription?: string;
  productImage?: string;
  last_updated?: string;
}

export interface UiProduct {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  categoryName?: string; // Added this property
  stock: number;
  lastUpdated: string;
}

export function dbToUiProduct(product: DbProduct): UiProduct {
  return {
    id: product.id,
    name: product.productName,
    description: product.productDescription,
    imageUrl: product.productImage,
    categoryName: "N/A", // Set a default value
    stock: 0, // Replace with actual stock when available
    lastUpdated: product.last_updated || "Not available",
  };
}