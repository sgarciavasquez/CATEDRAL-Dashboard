// shared/services/chat/messages.api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiMessage } from './chat.types';

@Injectable({ providedIn: 'root' })
export class MessagesApiService {
  private http = inject(HttpClient);
  private base = '/api';

  /** Lista mensajes de un chat.
   *  - Puedes pasar limit / before / after para paginar.
   *  - Devuelve { ok, data } para mantener consistencia con el resto de tu API.
   */
  list(
    chatId: string,
    opts?: { limit?: number; before?: string; after?: string }
  ): Observable<{ ok: boolean; data: ApiMessage[] }> {
    let params = new HttpParams();
    if (opts?.limit)  params = params.set('limit', String(opts.limit));
    if (opts?.before) params = params.set('before', opts.before);
    if (opts?.after)  params = params.set('after', opts.after);
    return this.http.get<{ ok: boolean; data: ApiMessage[] }>(
      `${this.base}/chats/${chatId}/messages`,
      { params }
    );
  }

  /** Envía un mensaje de texto */
  send(chatId: string, text: string): Observable<{ ok: boolean; data: ApiMessage }> {
    return this.http.post<{ ok: boolean; data: ApiMessage }>(
      `${this.base}/chats/${chatId}/messages`,
      { type: 'text', text }
    );
  }


  create(dto: { chatId: string; type: 'text'|'image'|'file'; text?: string; fileUrl?: string }) {
    return this.http.post<ApiMessage>(`${this.base}/messages`, dto);
  }
}
