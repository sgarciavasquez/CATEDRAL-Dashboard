// shared/services/chat/messages.api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiMessage } from './chat.types';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MessagesApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl; 

  list(chatId: string, opts?: { limit?: number; before?: string }): Observable<ApiMessage[]> {
    const max = 100; 
    const lim = Math.max(1, Math.min(max, opts?.limit ?? 50)); 

    let params = new HttpParams().set('limit', String(lim));
    if (opts?.before) params = params.set('before', opts.before);
    
    return this.http
      .get<{ ok: boolean; data: ApiMessage[] }>(
        `${this.base}/chats/${chatId}/messages`,
        { params }
      )
      .pipe(map(r => r.data ?? []));
  }

  send(chatId: string, texto: string): Observable<ApiMessage> {
    const body = { contenido: texto, tipo: 'text' as const };
    return this.http
      .post<{ ok: boolean; data: ApiMessage }>(
        `${this.base}/chats/${chatId}/messages`,
        body
      )
      .pipe(map(r => r.data));
  }
}
