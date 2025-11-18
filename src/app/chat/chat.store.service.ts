// chat.store.service.ts
import { Injectable, computed, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  ApiChat,
  ApiMessage,
  ChatRow,
  Msg,
  Role,
  mapApiMessageToMsg,
  mapApiChatToRow,
} from '../shared/services/chat/chat.types';
import { ChatApiService } from '../shared/services/chat/chat.api.service';
import { MessagesApiService } from '../shared/services/chat/messages.api.service';

@Injectable({ providedIn: 'root' })
export class ChatStoreService {
  private baseNameForCliente = 'Cliente';
  private baseNameForShop = 'Perfumes Catedral';

  currentUser = signal<{ id: string; name: string; role: 'cliente' | 'admin' }>({
    id: 'REEMPLAZA_CON_ID_USUARIO',
    name: 'Yo',
    role: 'cliente',
  });

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

  /** Mapea ApiChat -> ChatRow para la bandeja */
  /** Mapea ApiChat -> ChatRow para la bandeja */
  /** Mapea ApiChat -> ChatRow para la bandeja */
  private toRow(api: ApiChat): ChatRow {
    const me = this.currentUser();
    const role: Role = me.role === 'admin' ? 'admin' : 'cliente';

    // Usamos el helper centralizado que ya sabe manejar
    // clienteId/adminId como string u objeto {_id, name, email}
    const row = mapApiChatToRow(api, me.id, role);

    // Fallbacks por si viene sin nombre del back
    if (!row.otherName) {
      if (role === 'admin') {
        // admin viendo a cliente -> Cliente XXXX
        row.otherName = `${this.baseNameForCliente} ${row.otherId.slice(-4)}`;
      } else {
        // cliente viendo a la tienda
        row.otherName = this.baseNameForShop;
      }
    }

    return row;
  }



  /** Mapea ApiMessage -> Msg (usa tu helper) */
  private toMsg(api: ApiMessage): Msg {
    const msg = mapApiMessageToMsg(api);
    return msg;
  }

  // ----------------- Acciones -----------------

  async loadInbox(roleHint?: 'cliente' | 'admin') {
    console.log('[chat.store] loadInbox', { roleHint });
    const res = await firstValueFrom(this.chatsApi.listMine(roleHint));
    const rows = (res.data ?? []).map((c: ApiChat) => this.toRow(c));
    console.log('[chat.store] inbox rows:', rows);
    this._chats.set(rows);
  }

  async openThread(chatId: string) {
    console.log('[chat.store] openThread ->', { chatId, limit: 100 });

    try {
      const rows = await firstValueFrom(
        this.msgsApi.list(chatId, { limit: 100 })
      );
      console.log('[chat.store] messages fetched', {
        count: rows.length,
        sample: rows[0],
      });

      const list = rows
        .map((m) => this.toMsg(m))
        .sort((a, b) => a.at.localeCompare(b.at));

      this._msgs.update((prev) => {
        const others = prev.filter((m) => m.chatId !== chatId);
        return [...others, ...list];
      });

      await firstValueFrom(
        this.chatsApi.markRead(chatId, this.currentUser().id)
      );

      this._chats.update((rows) =>
        rows.map((r) =>
          r.id !== chatId ? r : { ...r, unread: 0 }
        )
      );
    } catch (e) {
      console.error('[chat.store] openThread error', e);
    }
  }

  async loadMore(chatId: string) {
    const current = this._msgs()
      .filter((m) => m.chatId === chatId)
      .sort((a, b) => a.at.localeCompare(b.at));

    if (!current.length) return;

    const oldest = current[0];
    console.log('[chat.store] loadMore ->', {
      chatId,
      before: oldest.at,
      limit: 50,
    });

    try {
      const rowsOlder = await firstValueFrom(
        this.msgsApi.list(chatId, { before: oldest.at, limit: 50 })
      );
      console.log('[chat.store] older fetched', {
        count: rowsOlder.length,
        sample: rowsOlder[0],
      });

      const older = rowsOlder
        .map((m) => this.toMsg(m))
        .sort((a, b) => a.at.localeCompare(b.at));

      if (!older.length) return;

      this._msgs.update((prev) => {
        const others = prev.filter((m) => m.chatId !== chatId);
        return [...others, ...older, ...current];
      });
    } catch (e) {
      console.error('[chat.store] loadMore error', e);
    }
  }

  async send(chatId: string, text: string) {
    console.log('[chat.store] send ->', { chatId, text });
    const real = await firstValueFrom(this.msgsApi.send(chatId, text));
    const sent = this.toMsg(real);
    console.log('[chat.store] send OK', sent);

    this._msgs.update((v) => [...v, sent]);
    this._chats.update((rows) =>
      rows.map((r) =>
        r.id !== chatId
          ? r
          : { ...r, last: { text: sent.text, at: sent.at } }
      )
    );
  }

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
    console.log('[chat.store] setCurrentUser', { u, role });

    this.currentUser.set({
      id: u.id,
      name: u.name ?? 'Yo',
      role,
    });
  }
}
