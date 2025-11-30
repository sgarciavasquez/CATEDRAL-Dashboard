// shared/services/chat/chat.api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiChat, ApiMessage, Role } from './chat.types';
import { environment } from '../../../../environments/environment';

type CreateOrGetByPair = { clienteId: string; adminId: string; reservationId?: string };
type CreateOrGetByPartner = { partnerId?: string; reservationId?: string }; // por si tu back soporta esto
type CreateOrGetDto = { clienteId: string; adminId: string; reservationId?: string };

@Injectable({ providedIn: 'root' })
export class ChatApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl; 

  delete(chatId: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/chats/${chatId}`);
  }

  updateMeta(
    chatId: string,
    meta: Record<string, unknown>
  ): Observable<{ ok: boolean; data: ApiChat }> {
    return this.http.patch<{ ok: boolean; data: ApiChat }>(
      `${this.base}/chats/${chatId}/meta`,
      { meta }
    );
  }

  listMessages(
    chatId: string,
    opts?: { limit?: number; before?: string; after?: string }
  ): Observable<{ ok: boolean; data: ApiMessage[] }> {
    let params = new HttpParams();
    if (opts?.limit) params = params.set('limit', String(opts.limit));
    if (opts?.before) params = params.set('before', opts.before);
    if (opts?.after) params = params.set('after', opts.after);
    return this.http.get<{ ok: boolean; data: ApiMessage[] }>(
      `${this.base}/chats/${chatId}/messages`,
      { params }
    );
  }

  sendText(chatId: string, text: string): Observable<{ ok: boolean; data: ApiMessage }> {
    return this.http.post<{ ok: boolean; data: ApiMessage }>(
      `${this.base}/chats/${chatId}/messages`,
      { text, type: 'text' }
    );
  }

  sendFile(
    chatId: string,
    fileUrl: string,
    type: 'image' | 'file' = 'file'
  ): Observable<{ ok: boolean; data: ApiMessage }> {
    return this.http.post<{ ok: boolean; data: ApiMessage }>(
      `${this.base}/chats/${chatId}/messages`,
      { type, fileUrl }
    );
  }

  createOrGet(dto: CreateOrGetByPair): Observable<{ ok: boolean; data: ApiChat }> {
    console.log('[ChatApi] createOrGet dto =>', dto);
    return this.http.post<{ ok: boolean; data: ApiChat }>(
      `${this.base}/chats`,
      dto
    );
  }

  listMine(roleHint?: Role, q?: string): Observable<{ ok: boolean; data: ApiChat[] }> {
    let params = new HttpParams();
    if (roleHint) params = params.set('roleHint', roleHint);
    if (q) params = params.set('q', q);
    return this.http.get<{ ok: boolean; data: ApiChat[] }>(
      `${this.base}/chats`,
      { params }
    );
  }

  getOne(chatId: string): Observable<{ ok: boolean; data: ApiChat }> {
    return this.http.get<{ ok: boolean; data: ApiChat }>(
      `${this.base}/chats/${chatId}`
    );
  }

  markRead(chatId: string, readerUserId?: string): Observable<{ ok: boolean }> {
    const body = readerUserId ? { readerUserId } : {};
    return this.http.post<{ ok: boolean }>(
      `${this.base}/chats/${chatId}/read`,
      body
    );
  }
}
