// First, update your dataTransformers.ts file:

export interface DbProduct {
  id: string | number;
  productName: string;
  productDescription?: string;
  productImage?: string | null;
  created_at: string;
  lastUpdated?: string | null;
  // Add any other fields from your database
}

export interface UiProduct {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  categoryName?: string;
  created_at: string;
  lastUpdated: string;
  // Add any other UI fields
}

export function dbToUiProduct(dbProduct: DbProduct): UiProduct {
  return {
    id: String(dbProduct.id),
    name: dbProduct.productName || '',
    description: dbProduct.productDescription || '',
    imageUrl: dbProduct.productImage || null,
    categoryName: '',
    created_at: dbProduct.created_at || '',
    // Check for lastUpdated first, then fall back to created_at
    lastUpdated: dbProduct.lastUpdated || dbProduct.created_at || '',
  };
}