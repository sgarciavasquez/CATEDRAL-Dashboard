// shared/services/orders/orders.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ApiReservation, OrderStatus, toUiReservation, UiReservation
} from './models/orders.models';

type UpperStatus = 'PENDING'|'CONFIRMED'|'CANCELLED';

interface CreateReservationDetailDto {
  product: string;   // ObjectId
  quantity: number;  // >=1
  subtotal: number;  // >=0
}
interface CreateReservationDto {
  user: string; // ObjectId
  status: UpperStatus;
  total: number;
  reservationDetail: CreateReservationDetailDto[];
}

interface UpdateReservationDetailDto {
  product: string;
  quantity: number;
  subtotal: number;
}
interface UpdateReservationDto {
  user: string; // ObjectId
  status: UpperStatus;
  total: number;
  reservationDetail: UpdateReservationDetailDto[];
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/reservations`;

  list(opts?: { status?: OrderStatus }): Observable<UiReservation[]> {
  let params = new HttpParams();
  if (opts?.status) {
    params = params.set('status', String(opts.status).toUpperCase());
  }
  return this.http.get<ApiReservation[]>(this.base, { params }).pipe(
    map(arr => (arr ?? []).map(toUiReservation))
  );
}

  // Crear reserva 
  create(payload: CreateReservationDto): Observable<UiReservation> {
    return this.http.post<ApiReservation>(this.base, payload)
      .pipe(map(toUiReservation));
  }

  // Editar reserva 
  update(id: string, payload: UpdateReservationDto): Observable<UiReservation> {
    return this.http.patch<ApiReservation>(`${this.base}/${id}`, payload)
      .pipe(map(toUiReservation));
  }

  complete(id: string): Observable<UiReservation> {
    return this.http.put<ApiReservation>(`${this.base}/${id}/complete`, {})
      .pipe(map(toUiReservation));
  }

  cancel(id: string): Observable<UiReservation> {
    return this.http.put<ApiReservation>(`${this.base}/${id}/cancel`, {})
      .pipe(map(toUiReservation));
  }

}
