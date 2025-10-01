export interface Product {
  id: string;
  name: string;
  code?: string;
  price: number;
  imageUrl: string;
  rating?: number;
  inStock?: boolean;
  stock?: number;
}
