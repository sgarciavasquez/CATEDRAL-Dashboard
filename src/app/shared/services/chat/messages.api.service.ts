// shared/services/chat/messages.api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiMessage } from './chat.types';

@Injectable({ providedIn: 'root' })
export class MessagesApiService {
  private http = inject(HttpClient);
  private base = '/api';

 
  // shared/services/chat/messages.api.service.ts
  list(chatId: string, opts?: { limit?: number; before?: string }): Observable<ApiMessage[]> {
    const max = 100; // coincide con @Max(100) del back
    const lim = Math.max(1, Math.min(max, opts?.limit ?? 50)); // clamp 1..100

    let params = new HttpParams().set('limit', String(lim));
    if (opts?.before) params = params.set('before', opts.before);

    console.log('[chat] API list ->', { chatId, limit: lim, before: opts?.before });

    return this.http
      .get<{ ok: boolean; data: ApiMessage[] }>(`${this.base}/chats/${chatId}/messages`, { params })
      .pipe(map(r => r.data ?? []));
  }


  /** Envía un mensaje de texto (se mantiene igual) */
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
