import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiReservation, OrderStatus, toUiReservation, UiReservation } from './models/orders.models';


@Injectable({ providedIn: 'root' })
export class OrdersService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/reservations`;

  list(opts?: { status?: OrderStatus }): Observable<UiReservation[]> {
    let params = new HttpParams();
    if (opts?.status) params = params.set('status', opts.status);
    return this.http.get<ApiReservation[]>(this.base, { params }).pipe(
      map(arr => (arr ?? []).map(toUiReservation))
    );
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
