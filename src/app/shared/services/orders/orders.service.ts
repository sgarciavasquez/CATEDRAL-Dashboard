// shared/services/orders/orders.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ApiReservation, OrderStatus, toUiReservation, UiReservation
} from './models/orders.models';
import { ReservationPreview } from '../../../chat/chat-context.service';

type UpperStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

interface ApiPage<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/reservations`;

  list(opts?: { status?: OrderStatus }): Observable<UiReservation[]> {
    let params = new HttpParams();
    if (opts?.status) params = params.set('status', opts.status.toUpperCase());

    return this.http
      .get<ApiReservation[] | ApiPage<ApiReservation>>(this.base, { params })
      .pipe(
        map(resp => {
          const arr = Array.isArray(resp) ? resp : (resp?.items ?? []);
          return arr.map(toUiReservation);
        })
      );
  }

  create(payload: {
    user: string;
    status: UpperStatus;
    total: number;
    reservationDetail: { product: string; quantity: number; subtotal: number }[];
  }): Observable<UiReservation> {
    return this.http.post<ApiReservation>(this.base, payload).pipe(map(toUiReservation));
  }

  update(id: string, payload: {
    user: string;
    status: UpperStatus;
    total: number;
    reservationDetail: { product: string; quantity: number; subtotal: number }[];
  }): Observable<UiReservation> {
    return this.http.patch<ApiReservation>(`${this.base}/${id}`, payload).pipe(map(toUiReservation));
  }

  complete(id: string): Observable<UiReservation> {
    return this.http.put<ApiReservation>(`${this.base}/${id}/complete`, {}).pipe(map(toUiReservation));
  }

  cancel(id: string): Observable<UiReservation> {
    return this.http.put<ApiReservation>(`${this.base}/${id}/cancel`, {}).pipe(map(toUiReservation));
  }

  getPreviewByChat(chatId: string) {
    return this.http
      .get<ReservationPreview | { data: ReservationPreview }>(`/api/reservations/by-chat/${chatId}`)
      .pipe(
        map((resp: any) => resp?.data ?? resp as ReservationPreview)
      );
  }

  reopen(id: string): Observable<UiReservation> {
  return this.http
    .put<ApiReservation>(`${this.base}/${id}/reopen`, {})
    .pipe(map(toUiReservation));
}
}
