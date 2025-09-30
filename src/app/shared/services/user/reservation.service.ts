import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReservationItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  imageUrl?: string;
}

export interface Reservation {
  _id?: string;
  userId: string;
  createdAt?: string;
  status?: string;
  total?: number;
  items: ReservationItem[];
  // cualquiera otra propiedad que uses
}

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private http = inject(HttpClient);
  private base = '/api';

  // obtener reservas por userId
  listByUser(userId: string): Observable<Reservation[]> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<Reservation[]>(`${this.base}/reservations`, { params });
  }
}
