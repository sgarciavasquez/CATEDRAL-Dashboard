import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role?: 'admin' | 'customer';
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private base = '/api';

  // user actual (usa auth/me en backend)
  me(): Observable<ApiUser> {
    return this.http.get<ApiUser>(`${this.base}/auth/me`);
  }

  update(id: string, payload: Partial<ApiUser>) {
    return this.http.patch<ApiUser>(`${this.base}/users/${id}`, payload);
  }

  delete(id: string) {
    return this.http.delete(`${this.base}/users/${id}`);
  }
}
