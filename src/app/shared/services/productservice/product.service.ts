import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, switchMap, forkJoin } from 'rxjs';
import { ApiProduct } from './product.api';
import { UiProduct, toUiProduct } from './product.ui';
import { CategoryService } from './category.service';

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
  private categoryService = inject(CategoryService);

  list(): Observable<ApiProduct[]> {
    return this.http.get<ApiProduct[]>(this.base);
  }

  get(id: string): Observable<ApiProduct> {
    return this.http.get<ApiProduct>(`${this.base}/${id}`);
  }




  listUi(): Observable<UiProduct[]> {
    // normaliza texto para búsquedas o comparaciones
    const norm = (s: string) =>
      (s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    return this.list().pipe(
      switchMap((products: ApiProduct[]) => {
        if (!products?.length) return of<UiProduct[]>([]);

        // ✅ usamos CategoryService para traer categorías reales
        return this.categoryService.list().pipe(
          map((categories) => {
            const catMap = new Map(categories.map(c => [c._id, c.name]));

            return products.map((p) => {
              const ui = toUiProduct(p);

              // reemplazamos IDs por nombres reales desde la API
              const catNames = (Array.isArray(p.categories) ? p.categories : [])
                .map((id: any) => catMap.get(id) || '')
                .filter(Boolean);

              // normalizamos solo para mantener consistencia visual
              const categoryNames = catNames.map(norm);

              return { ...ui, categoryNames } as UiProduct;
            });
          })
        );
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
