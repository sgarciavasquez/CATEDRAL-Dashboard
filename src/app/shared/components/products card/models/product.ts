export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  inStock: number;
  rating?: number;
  code?: string;
  categoryNames?: string[];
}
