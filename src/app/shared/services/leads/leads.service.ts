import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface LeadPayload {
  name: string;
  email: string;
  phone: string;
  message?: string;
  cart?: Array<{ productId: string; name: string; qty: number; price: number }>;
  total?: number;
  origin?: string;
}

@Injectable({ providedIn: 'root' })
export class LeadsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/leads`; 
  create(payload: LeadPayload) {
    return this.http.post<{ ok: boolean; id?: string }>(this.base, payload);
  }
}
