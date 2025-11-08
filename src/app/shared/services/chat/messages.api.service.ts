// messages.api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiMessage } from './chat.types';

@Injectable({ providedIn: 'root' })
export class MessagesApiService {
  private http = inject(HttpClient);
  private base = '/api';

  list(chatId: string, beforeId?: string, limit = 30): Observable<ApiMessage[]> {
    let params = new HttpParams().set('chatId', chatId).set('limit', limit);
    if (beforeId) params = params.set('beforeId', beforeId);
    return this.http.get<ApiMessage[]>(`${this.base}/messages`, { params });
  }

  create(dto: { chatId: string; type: 'text'|'image'|'file'; text?: string; fileUrl?: string }) {
    return this.http.post<ApiMessage>(`${this.base}/messages`, dto);
  }
}
