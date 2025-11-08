// chat.api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiChat } from './chat.types';

@Injectable({ providedIn: 'root' })
export class ChatApiService {
  private http = inject(HttpClient);
  private base = '/api';

  // Usa tu endpoint actual: POST /chats con { clienteId, adminId }
  createOrGet(dto: { clienteId: string; adminId: string }): Observable<{ ok: boolean; data: ApiChat }> {
    return this.http.post<{ ok: boolean; data: ApiChat }>(`${this.base}/chats`, dto);
  }

  listMine(roleHint?: 'cliente'|'admin'): Observable<{ ok: boolean; data: ApiChat[] }> {
    let params = new HttpParams();
    if (roleHint) params = params.set('roleHint', roleHint);
    return this.http.get<{ ok: boolean; data: ApiChat[] }>(`${this.base}/chats`, { params });
  }

  getOne(chatId: string): Observable<{ ok: boolean; data: ApiChat }> {
    return this.http.get<{ ok: boolean; data: ApiChat }>(`${this.base}/chats/${chatId}`);
  }

  markRead(chatId: string, readerUserId?: string) {
    return this.http.post<{ ok: boolean }>(`${this.base}/chats/${chatId}/read`, readerUserId ? { readerUserId } : {});
  }
}
