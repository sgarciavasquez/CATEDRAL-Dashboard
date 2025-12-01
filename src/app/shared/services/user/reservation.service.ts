// shared/services/user/reservation.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, tap, catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ReservationItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  imageUrl?: string;
  rating?: number;
  myRating?: number;
}

export interface Reservation {
  _id?: string;
  userId: string;
  createdAt?: string;
  status?: string;
  total?: number;
  items: ReservationItem[];
  chatId?: string;
}

interface ApiReservation {
  _id: string;
  user?: string | { _id?: string; id?: string };
  total?: number;
  status?: string;
  createdAt?: string;
  reservationDetail?: ApiReservationItem[];
  items?: Array<{
    productId: string;
    code?: string;
    name: string;
    imageUrl?: string;
    price: number;
    quantity: number;
  }>;
  chatId?: string;
}

interface ApiReservationItem {
  _id: string;
  product: string | { _id?: string; id?: string; code?: string; name?: string; imageUrl?: string; price?: number; };
  quantity: number;
  subtotal?: number;
}

export interface CreateReservationPayload {
  user: string;  // id del usuario logeado
  reservationDetail: Array<{
    product: string;
    quantity: number;
  }>;
}

export interface CreateGuestReservationPayload {
  name: string;
  email: string;
  phone: string;
  reservationDetail: Array<{
    product: string;
    quantity: number;
  }>;
}

type UpperStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/reservations`;

  listByUser(userId: string, status?: UpperStatus): Observable<Reservation[]> {
    console.log('%c[ReservationsSvc] listByUser()', 'color:#9333ea', { userId, status });
    let params = new HttpParams();
    if (status) params = params.set('status', status);

    return this.http
      .get<ApiReservation[]>(`${this.base}/user/${userId}`, { params })
      .pipe(
        tap((raw) => console.log('[ReservationsSvc] raw response:', raw)),
        map(arr => (arr ?? []).map(this.toReservation)),
        tap((mapped) => console.log('%c[ReservationsSvc] mapped:', 'color:#16a34a', mapped)),
        catchError((e) => {
          console.error('[ReservationsSvc] HTTP ERROR:', e);
          return of<Reservation[]>([]);
        })
      );
  }

  create(payload: CreateReservationPayload): Observable<Reservation> {
    console.log('%c[ReservationsSvc] create()', 'color:#0ea5e9', payload);

    return this.http
      .post<ApiReservation>(this.base, payload)
      .pipe(
        map(this.toReservation),
        tap((res) => console.log('%c[ReservationsSvc] created:', 'color:#16a34a', res))
      );
  }

  createGuestReservation(payload: CreateGuestReservationPayload): Observable<Reservation> {
    console.log('%c[ReservationsSvc] createGuestReservation()', 'color:#0ea5e9', payload);

    return this.http
      .post<ApiReservation>(`${this.base}/guest`, payload)
      .pipe(
        map(this.toReservation),
        tap((res) => console.log('%c[ReservationsSvc] guest created:', 'color:#16a34a', res))
      );
  }


  private toReservation = (a: ApiReservation): Reservation => {
    const userObj = typeof a.user === 'object' ? a.user : undefined;
    const userId =
      (typeof a.user === 'string' ? a.user : '') ||
      userObj?._id ||
      userObj?.id ||
      '';

    let items: ReservationItem[] = [];
    if (Array.isArray(a.items) && a.items.length) {
      items = a.items.map(it => ({
        productId: it.productId,
        name: it.name,
        imageUrl: it.imageUrl || 'assets/p1.png',
        qty: Number(it.quantity ?? 0),
        price: Number(it.price ?? 0),
      }));
    } else if (Array.isArray(a.reservationDetail)) {
      items = a.reservationDetail.map(rd => {
        const p = typeof rd.product === 'object' ? rd.product : undefined;
        const quantity = Number(rd.quantity ?? 0);
        const priceFromProduct = Number(p?.price ?? 0);
        const priceFromSubtotal =
          rd.subtotal != null && quantity > 0 ? Number(rd.subtotal) / quantity : 0;
        const price = priceFromProduct || priceFromSubtotal || 0;

        return {
          productId: (typeof rd.product === 'string' ? rd.product : (p?._id || p?.id)) || '',
          name: p?.name ?? '(sin nombre)',
          imageUrl: p?.imageUrl || 'assets/p1.png',
          qty: quantity,
          price,
        };
      });
    }

    const computedTotal = items.reduce((s, x) => s + x.qty * x.price, 0);

    const out: Reservation = {
      _id: a._id,
      userId,
      createdAt: a.createdAt ?? new Date().toISOString(),
      status: a.status ?? 'PENDING',
      total: typeof a.total === 'number' ? a.total : computedTotal,
      items,
      chatId: a.chatId,
    };
    return out;
  };
}
