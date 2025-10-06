import { ApiProduct, ApiCategory, ApiStock } from './product.api';

export type CatKey = 'mujer-dis' | 'hombre-dis' | 'nicho';

export interface UiProduct {
  id: string;
  code: string;
  name: string;
  price: number;
  imageUrl: string;
  rating?: number;
  categoryNames: string[];
  categoryKeys: CatKey[];
  inStock: number;
}

function catKeyFromName(name: string): CatKey | null {
  const n = (name ?? '').trim().toLowerCase();
  if (n === 'nicho') return 'nicho';
  if (n === 'mujer') return 'mujer-dis';
  if (n === 'hombre') return 'hombre-dis';
  return null;
}

// -- helpers seguros para stock --
function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function availableFromItem(s: Partial<ApiStock> | undefined): number {
  if (!s) return 0;
  if (s.hasOwnProperty('available') && s.available !== undefined && s.available !== null) {
    return Math.max(0, toNum(s.available));
  }
  const q = toNum((s as any).quantity);
  const r = toNum((s as any).reserved);
  return Math.max(0, q - r);
}

function totalAvailable(stock: ApiProduct['stock']): number {
  if (!stock) return 0;
  if (Array.isArray(stock)) {
    return stock.reduce((acc, it) => acc + availableFromItem(it as ApiStock), 0);
  }
  return availableFromItem(stock as ApiStock);
}

export function toUiProduct(p: ApiProduct): UiProduct {
  const cats = (p.categories ?? []).map(c =>
    typeof c === 'string' ? ({ _id: c, name: '' } as ApiCategory) : (c as ApiCategory)
  );

  const categoryNames = cats.map(c => (c?.name ?? '').trim()).filter(Boolean);
  const categoryKeys = categoryNames
    .map(catKeyFromName)
    .filter((x): x is CatKey => !!x);

  return {
    id: p._id,
    code: p.code,
    name: p.name,
    price: toNum(p.price),
    imageUrl: (p as any).img_url || 'assets/p1.png',
    rating: 4.7,
    categoryNames,
    categoryKeys,
    inStock: totalAvailable(p.stock), // stock real
  };
}
