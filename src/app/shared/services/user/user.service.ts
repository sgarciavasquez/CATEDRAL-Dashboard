// shared/services/user/user.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ApiUser {
  _id?: string;
  id?: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  role?: 'admin' | 'customer';
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  me(): Observable<ApiUser> {
    return this.http.get<any>(`${this.base}/auth/me`).pipe(
      map((raw) => ({
        _id: raw?._id ?? raw?.id ?? raw?.userId ?? undefined,
        id:  raw?.id  ?? raw?._id ?? raw?.userId ?? undefined,
        userId: raw?.userId,
        name: raw?.name ?? '',
        email: raw?.email ?? '',
        phone: raw?.phone ?? '',
        role: raw?.role ?? 'customer',
      }))
    );
  }

  update(id: string, payload: Partial<ApiUser>) {
    return this.http.patch<ApiUser>(`${this.base}/users/${id}`, payload);
  }

  delete(id: string) {
    return this.http.delete(`${this.base}/users/${id}`);
  }
}
