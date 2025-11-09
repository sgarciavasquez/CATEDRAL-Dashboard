// shared/services/chat/chat.api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiChat, ApiMessage, Role } from './chat.types';

type CreateOrGetByPair = { clienteId: string; adminId: string };
type CreateOrGetByPartner = { partnerId?: string; reservationId?: string }; // por si tu backend también soporta este formato

@Injectable({ providedIn: 'root' })
export class ChatApiService {
  private http = inject(HttpClient);
  private base = '/api';

  /** Crea un nuevo chat o devuelve el existente según los parámetros */
  createOrGet(
    dto: CreateOrGetByPair | CreateOrGetByPartner
  ): Observable<{ ok: boolean; data: ApiChat }> {
    return this.http.post<{ ok: boolean; data: ApiChat }>(`${this.base}/chats`, dto);
  }

  /** Lista mis chats (cliente o admin) */
  listMine(roleHint?: Role, q?: string): Observable<{ ok: boolean; data: ApiChat[] }> {
    let params = new HttpParams();
    if (roleHint) params = params.set('roleHint', roleHint);
    if (q) params = params.set('q', q);
    return this.http.get<{ ok: boolean; data: ApiChat[] }>(`${this.base}/chats`, { params });
  }

  /** Obtiene un chat */
  getOne(chatId: string): Observable<{ ok: boolean; data: ApiChat }> {
    return this.http.get<{ ok: boolean; data: ApiChat }>(`${this.base}/chats/${chatId}`);
  }

  /** Borra un chat (si tu backend lo permite) */
  delete(chatId: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/chats/${chatId}`);
  }

  /** Actualiza meta del chat (p.ej. reservationId u otros) si tu backend lo soporta */
  updateMeta(chatId: string, meta: Record<string, unknown>): Observable<{ ok: boolean; data: ApiChat }> {
    return this.http.patch<{ ok: boolean; data: ApiChat }>(`${this.base}/chats/${chatId}/meta`, { meta });
  }

  /** Marca como leído. Puedes pasar readerUserId si tu endpoint lo requiere. */
  markRead(chatId: string, readerUserId?: string): Observable<{ ok: boolean }> {
    const body = readerUserId ? { readerUserId } : {};
    return this.http.post<{ ok: boolean }>(`${this.base}/chats/${chatId}/read`, body);
  }

  /** Lista mensajes del chat. Soporta limit y paginación por before/after si tu backend lo expone. */
  listMessages(
    chatId: string,
    opts?: { limit?: number; before?: string; after?: string }
  ): Observable<{ ok: boolean; data: ApiMessage[] }> {
    let params = new HttpParams();
    if (opts?.limit) params = params.set('limit', String(opts.limit));
    if (opts?.before) params = params.set('before', opts.before);
    if (opts?.after) params = params.set('after', opts.after);
    return this.http.get<{ ok: boolean; data: ApiMessage[] }>(`${this.base}/chats/${chatId}/messages`, { params });
  }

  /** Envía mensaje de texto */
  sendText(chatId: string, text: string): Observable<{ ok: boolean; data: ApiMessage }> {
    return this.http.post<{ ok: boolean; data: ApiMessage }>(`${this.base}/chats/${chatId}/messages`, { text, type: 'text' });
  }

  /** Envía mensaje con archivo/imagen (si tu backend lo soporta). body minimalista. */
  sendFile(chatId: string, fileUrl: string, type: 'image' | 'file' = 'file'): Observable<{ ok: boolean; data: ApiMessage }> {
    return this.http.post<{ ok: boolean; data: ApiMessage }>(`${this.base}/chats/${chatId}/messages`, { type, fileUrl });
  }
}
