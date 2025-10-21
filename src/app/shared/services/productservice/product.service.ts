import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap, forkJoin, map } from 'rxjs';
import { ApiProduct } from './product.api';
import { UiProduct, toUiProduct } from './product.ui';
import { CategoryService } from './category.service';

export interface SaveProductPayload {
  code: string;
  name: string;
  price: number;
  img_url?: string;
  categories?: string[];       // IDs
  initialQuantity?: number;    // SOLO al crear
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private base = '/api/products';
  private categoryService = inject(CategoryService);

  // ====== Productos ======
  list(): Observable<ApiProduct[]> {
    return this.http.get<ApiProduct[]>(this.base);
  }

  get(id: string): Observable<ApiProduct> {
    return this.http.get<ApiProduct>(`${this.base}/${id}`);
  }

  // UI list (enriquece con categorías y completa stock cuando falte)
  listUi(): Observable<UiProduct[]> {
    const norm = (s: string) =>
      (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    return this.list().pipe(
      switchMap((products: ApiProduct[] = []) => {
        if (!products.length) return of<UiProduct[]>([]);

        const idsNeedingDetail = products
          .filter(p => {
            const s: any = Array.isArray(p.stock) ? p.stock?.[0] : (p as any).stock;
            return !(s && (s.available != null || s.quantity != null || s.reserved != null));
          })
          .map(p => p._id);

        const details$ = idsNeedingDetail.length
          ? forkJoin(idsNeedingDetail.map(id => this.get(id)))
          : of<ApiProduct[]>([]);

        return details$.pipe(
          switchMap(details => {
            const byId = new Map(details.map(d => [d._id, d]));

            return this.categoryService.list().pipe(
              map(categories => {
                const catMap = new Map(categories.map(c => [c._id, c.name]));

                return products.map(orig => {
                  const enriched = byId.get(orig._id) ?? orig;
                  const base = toUiProduct(enriched);

                  const rawNames = (Array.isArray(enriched.categories) ? enriched.categories : [])
                    .map((c: any) => {
                      if (typeof c === 'string') return catMap.get(c) || '';
                      if (c && typeof c === 'object') return c.name || catMap.get(c._id) || '';
                      return '';
                    })
                    .filter(Boolean);

                  const categoryNames = (rawNames.length ? rawNames : base.categoryNames || []).map(norm);
                  return { ...base, categoryNames } as UiProduct;
                });
              })
            );
          })
        );
      })
    );
  }

  // ====== Stock (única función, acorde a tu API) ======
  increaseStockByStockId(stockId: string, amount: number) {
    return this.http.post<ApiProduct>(`/api/stock/${stockId}/add`, { amount });
  }

  // ====== CRUD ======
  create(payload: SaveProductPayload): Observable<ApiProduct> {
    return this.http.post<ApiProduct>(this.base, payload);
  }

  update(id: string, payload: Partial<SaveProductPayload>): Observable<ApiProduct> {
    const { initialQuantity, ...rest } = payload; // el back ignora initialQuantity en update
    return this.http.patch<ApiProduct>(`${this.base}/${id}`, rest);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
