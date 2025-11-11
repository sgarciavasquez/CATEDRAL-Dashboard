// chat.store.service.ts
import { Injectable, computed, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  ApiChat,
  ApiMessage,
  ChatRow,
  Msg,
} from '../shared/services/chat/chat.types';
import { ChatApiService } from '../shared/services/chat/chat.api.service';
import { MessagesApiService } from '../shared/services/chat/messages.api.service';

@Injectable({ providedIn: 'root' })
export class ChatStoreService {
  // Etiquetas base para “otro” usuario
  private baseNameForCliente = 'Cliente';
  private baseNameForShop = 'Perfumes Catedral';

  // Identidad (engancha luego a /auth/me)
  currentUser = signal<{ id: string; name: string; role: 'cliente' | 'admin' }>(
    {
      id: 'REEMPLAZA_CON_ID_USUARIO',
      name: 'Yo',
      role: 'cliente',
    }
  );

  // ---- Estado ----
  private _chats = signal<ChatRow[]>([]);
  private _msgs = signal<Msg[]>([]);

  chats$ = computed(() => this._chats());
  unreadCount$ = computed(() =>
    this._chats().reduce((a, c) => a + (c.unread || 0), 0)
  );
  messagesByChat(chatId: string) {
    return computed(() => this._msgs().filter((m) => m.chatId === chatId));
  }

  constructor(
    private chatsApi: ChatApiService,
    private msgsApi: MessagesApiService
  ) { }

  // ---- Mapeos (alineados al backend real) ----
  private toRow(api: ApiChat): ChatRow {
    const me = this.currentUser();
    const iAmAdmin = me.role === 'admin';

    const otherId = iAmAdmin ? api.clienteId : api.adminId;
    const otherName = iAmAdmin
      ? `${this.baseNameForCliente} ${otherId.slice(-4)}`
      : this.baseNameForShop;
    const unread = iAmAdmin
      ? api.unreadByAdmin ?? 0
      : api.unreadByCliente ?? 0;

    return {
      id: api._id,
      otherId,
      otherName,
      last: {
        text: api?.lastMessage?.contenido ?? '',
        at: api?.lastMessage?.at ?? api.updatedAt ?? api.createdAt,
      },
      unread,
    };
  }

  private toMsg(api: ApiMessage): Msg {
    // ⚠️ usa los campos REALES del back
    return {
      id: api._id,
      chatId: (api as any).chat,          // <- "chat" (ObjectId string)
      fromId: (api as any).emisor,        // <- "emisor"
      text: (api as any).contenido ?? '', // <- "contenido"
      at: api.createdAt,
      state: (api as any).estado,         // 'enviado' | 'leido' (minúsculas está OK)
    };
  }

  // ---- Acciones ----
  async loadInbox(roleHint?: 'cliente' | 'admin') {
    const res = await firstValueFrom(this.chatsApi.listMine(roleHint));
    this._chats.set((res.data ?? []).map((c: ApiChat) => this.toRow(c)));
  }

  // openThread(...)
  async openThread(chatId: string) {
    console.log('[chat] openThread ->', { chatId, limit: 100 });

    try {
      const rows = await firstValueFrom(this.msgsApi.list(chatId, { limit: 100 })); // 👈 antes 120
      console.log('[chat] messages fetched', { count: rows.length, sample: rows[0] });

      const list = rows
        .map((m) => this.toMsg(m))
        .sort((a, b) => a.at.localeCompare(b.at));

      this._msgs.update(prev => {
        const others = prev.filter(m => m.chatId !== chatId);
        return [...others, ...list];
      });

      await firstValueFrom(this.chatsApi.markRead(chatId, this.currentUser().id));
      this._chats.update(rows => rows.map(r => r.id !== chatId ? r : ({ ...r, unread: 0 })));
    } catch (e) {
      console.error('[chat] openThread error', e);
    }
  }

  // Paginación hacia atrás (cargar mensajes más antiguos)
  // loadMore(...)
  async loadMore(chatId: string) {
    const current = this._msgs()
      .filter(m => m.chatId === chatId)
      .sort((a, b) => a.at.localeCompare(b.at));
    if (!current.length) return;

    const oldest = current[0];
    console.log('[chat] loadMore ->', { chatId, before: oldest.at, limit: 50 });

    try {
      const rowsOlder = await firstValueFrom(this.msgsApi.list(chatId, { before: oldest.at, limit: 50 }));
      console.log('[chat] older fetched', { count: rowsOlder.length, sample: rowsOlder[0] });

      const older = rowsOlder
        .map((m) => this.toMsg(m))
        .sort((a, b) => a.at.localeCompare(b.at));

      if (!older.length) return;

      this._msgs.update(prev => {
        const others = prev.filter(m => m.chatId !== chatId);
        return [...others, ...older, ...current];
      });
    } catch (e) {
      console.error('[chat] loadMore error', e);
    }
  }


  async send(chatId: string, text: string) {
    console.log('[chat] send ->', { chatId, text });
    const real = await firstValueFrom(this.msgsApi.send(chatId, text));
    const sent = this.toMsg(real);
    console.log('[chat] send OK', sent);

    this._msgs.update(v => [...v, sent]);
    this._chats.update(rows =>
      rows.map(r => r.id !== chatId ? r : ({ ...r, last: { text: sent.text, at: sent.at } }))
    );
  }
  // Solo local (cuando entro al hilo)
  markChatReadLocal(chatId: string) {
    this._chats.update((rows) =>
      rows.map((r) => (r.id !== chatId ? r : { ...r, unread: 0 }))
    );
  }

  setCurrentUser(u: {
    id: string;
    name?: string;
    role: 'cliente' | 'admin' | 'customer';
  }) {
    const role = u.role === 'admin' ? 'admin' : 'cliente';
    this.currentUser.set({
      id: u.id,
      name: u.name ?? 'Yo',
      role,
    });
  }



}
