import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, switchMap, forkJoin } from 'rxjs';
import { ApiProduct } from './product.api';
import { UiProduct, toUiProduct } from './product.ui';

export interface SaveProductPayload {
  code: string;
  name: string;
  price: number;
  img_url?: string;
  categories?: string[];      // IDs de categorías
  initialQuantity?: number;   // SOLO en create (tu back lo usa para crear el stock)
}


@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private base = '/api/products';

  list(): Observable<ApiProduct[]> {
    return this.http.get<ApiProduct[]>(this.base);
  }

  get(id: string): Observable<ApiProduct> {
    return this.http.get<ApiProduct>(`${this.base}/${id}`);
  }

  /** Devuelve UiProduct con categorías y stock reales aunque /products no venga populado */
  listUi(): Observable<UiProduct[]> {
    return this.list().pipe(
      switchMap(arr => {
        if (!arr?.length) return of<UiProduct[]>([]);
        const toFull$: Observable<ApiProduct>[] = arr.map(p => {
          const cats = Array.isArray(p.categories) ? p.categories : [];
          const stock = Array.isArray(p.stock) ? p.stock : [];
          const catsAreIds = cats.length > 0 && typeof cats[0] === 'string';
          const stockAreIds = stock.length > 0 && typeof stock[0] === 'string';
          return (catsAreIds || stockAreIds) ? this.get(p._id) : of(p);
        });
        return forkJoin(toFull$).pipe(map(full => full.map(toUiProduct)));
      })
    );
  }

  // ========= CRUD =========
  create(payload: SaveProductPayload): Observable<ApiProduct> {
    return this.http.post<ApiProduct>(this.base, payload);
  }

  update(id: string, payload: Partial<SaveProductPayload>): Observable<ApiProduct> {
    // en update el back ignora initialQuantity (lo usó solo en create)
    const { initialQuantity, ...rest } = payload;
    return this.http.patch<ApiProduct>(`${this.base}/${id}`, rest);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
