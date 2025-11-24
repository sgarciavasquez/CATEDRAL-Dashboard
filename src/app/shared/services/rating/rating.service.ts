// src/app/shared/services/rating/rating.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

export interface RatePayload {
  // 👈 nombres alineados con el DTO del back
  product: string;      // MongoId del perfume
  reservation: string;  // MongoId de la reserva
  value: number;        // 1..5
}

@Injectable({ providedIn: 'root' })
export class RatingService {
  private http = inject(HttpClient);
  private base = '/api';

  rate(payload: RatePayload) {
    console.log('%c[RatingSvc] rate() payload', 'color:#eab308', payload);

    return this.http.post(`${this.base}/ratings`, payload).pipe(
      tap({
        next: (res) =>
          console.log('%c[RatingSvc] OK', 'color:#22c55e', res),
        error: (err) =>
          console.error('%c[RatingSvc] ERROR', 'color:#ef4444', err),
      })
    );
  }
}
