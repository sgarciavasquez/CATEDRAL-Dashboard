import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ApiCategory {
  _id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/categories`;

  list(): Observable<ApiCategory[]> {
    return this.http.get<ApiCategory[]>(this.base);
  }

  create(name: string): Observable<ApiCategory> {
    return this.http.post<ApiCategory>(this.base, { name });
  }

  update(id: string, name: string): Observable<ApiCategory> {
    return this.http.patch<ApiCategory>(`${this.base}/${id}`, { name });
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
