export interface ApiProduct {
  _id: string;
  code: string;
  name: string;
  price: number;
  img_url?: string;
  categories?: string[];     
  stock?: string | string[]; 
  createdAt?: string;
  updatedAt?: string;
}
