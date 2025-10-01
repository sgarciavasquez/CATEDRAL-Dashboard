import { ApiProduct } from './product.api';

export type CatKey = 'mujer-dis' | 'hombre-dis' | 'nicho';

// Mapea los ObjectId de categorías del backend → claves legibles para el front
export const CAT_BY_ID: Record<string, CatKey> = {
  '68d89bcf1fb7bd7c9c77d2b6': 'nicho',
  '68d895eec2c6516fef123d59': 'hombre-dis',
  // 'xxxxxxxxxxxxxxxxxxxxxxx': 'mujer-dis',
};

export interface UiProduct {
  id: string;
  code: string;
  name: string;
  price: number;
  imageUrl: string;
  rating?: number;
  categoryKeys: CatKey[];
  stockId?: string;
  stock?: number;
}

export function toUiProduct(p: ApiProduct): UiProduct {
  const categoryKeys = (p.categories ?? [])
    .map(id => CAT_BY_ID[id])
    .filter(Boolean) as CatKey[];

  const stockId = Array.isArray(p.stock) ? p.stock[0] : (p.stock as string | undefined);

  return {
    id: p._id,
    code: p.code,
    name: p.name,
    price: p.price,
    imageUrl: p.img_url || 'assets/p1.png',
    rating: 4.7,       // placeholder
    categoryKeys,
    stockId,
    stock: undefined,  
  };
}
