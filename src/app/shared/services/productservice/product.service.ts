import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ApiProduct } from './product.api';
import { UiProduct, toUiProduct } from './product.ui';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private base = '/api/products'; // tu proxy hace el forward a 3000

  list(): Observable<ApiProduct[]> {
    return this.http.get<ApiProduct[]>(this.base);
  }

  listUi(): Observable<UiProduct[]> {
    return this.list().pipe(map(arr => arr.map(toUiProduct)));
  }

  get(id: string): Observable<ApiProduct> {
    return this.http.get<ApiProduct>(`${this.base}/${id}`);
  }
}
