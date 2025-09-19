export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  stock: number;     
  rating?: number;   
  description?: string;
}
