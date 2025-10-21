export interface ApiCategory {
  _id: string;
  name: string;
}

export interface ApiProduct {
  _id: string;
  code: string;
  name: string;
  price: number;
  img_url?: string;
  categories?: (string | ApiCategory)[];
  stock?: string | ApiStock | ApiStock[];
  createdAt?: string;
  updatedAt?: string;
}

// product.api.ts
export interface ApiStock {
  _id: string;
  quantity?: number | string;
  reserved?: number | string;
  available?: number | string;
}


