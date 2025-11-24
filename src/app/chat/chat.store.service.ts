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

  currentUser = signal<{ id: string; name: string; role: 'cliente' | 'admin' }>(
    {
      id: 'REEMPLAZA_CON_ID_USUARIO',
      name: 'Yo',
      role: 'cliente',
    }
  );

  private _chats = signal<ChatRow[]>([]);
  private _msgs = signal<Msg[]>([]);

  chats$ = computed(() => this._chats());
  unreadCount$ = computed(() =>
    this._chats().reduce((a, c) => a + (c.unread || 0), 0)
  );

  messagesByChat(chatId: string) {
    return computed(() => this._msgs().filter((m) => m.chatId === chatId));
  }

  // ---- Polling de inbox ----
  private inboxPollingTimer: any = null;
  private inboxPollingRole: Role | null = null;

  constructor(
    private chatsApi: ChatApiService,
    private msgsApi: MessagesApiService
  ) {}

  /** Mapea ApiChat -> ChatRow usando tus helpers y rellenando nombres por defecto */
  private toRow(api: ApiChat): ChatRow {
    const me = this.currentUser();
    const role: Role = me.role === 'admin' ? 'admin' : 'cliente';

    const row = mapApiChatToRow(api, me.id, role);

    // Si no hay nombre “bonito”, usamos los fallback
    if (!row.otherName) {
      if (role === 'admin') {
        row.otherName = `${this.baseNameForCliente} ${row.otherId.slice(-4)}`;
      } else {
        row.otherName = this.baseNameForShop;
      }
    }

    return row;
  }

  /** Mapea ApiMessage -> Msg */
  private toMsg(api: ApiMessage): Msg {
    return mapApiMessageToMsg(api);
  }


  async loadInbox(roleHint?: 'cliente' | 'admin') {
    console.log('[chat.store] loadInbox', { roleHint });
    const res = await firstValueFrom(this.chatsApi.listMine(roleHint));
    const rows = (res.data ?? []).map((c: ApiChat) => this.toRow(c));
    console.log('[chat.store] inbox rows:', rows);
    this._chats.set(rows);
  }

  /** Arranca polling periódico de la bandeja (notificaciones + preview) */
  startInboxPolling(role: Role, intervalMs = 5000) {
    if (this.inboxPollingTimer) {
      // Ya está corriendo
      return;
    }
    this.inboxPollingRole = role;
    console.log('[chat.store] startInboxPolling', { role, intervalMs });

    // Primera carga inmediata
    this.loadInbox(role).catch((e) =>
      console.error('[chat.store] first loadInbox error', e)
    );

    this.inboxPollingTimer = setInterval(() => {
      console.log('[chat.store] polling tick');
      const r = this.inboxPollingRole || role;
      this.loadInbox(r).catch((e) =>
        console.error('[chat.store] polling loadInbox error', e)
      );
    }, intervalMs);
  }

  stopInboxPolling() {
    if (this.inboxPollingTimer) {
      console.log('[chat.store] stopInboxPolling');
      clearInterval(this.inboxPollingTimer);
      this.inboxPollingTimer = null;
      this.inboxPollingRole = null;
    }
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
        rows.map((r) => (r.id !== chatId ? r : { ...r, unread: 0 }))
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

  // ================== FLAGS / HELPERS ==================

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
    const role: Role = u.role === 'admin' ? 'admin' : 'cliente';
    console.log('[chat.store] setCurrentUser', { u, role });

    this.currentUser.set({
      id: u.id,
      name: u.name ?? 'Yo',
      role,
    });
  }

  /** Elimina un chat (back + store) – para el basurero del admin */
  async deleteChat(chatId: string) {
    console.log('[chat.store] deleteChat ->', chatId);
    try {
      await firstValueFrom(this.chatsApi.delete(chatId));
      this._chats.update((rows) => rows.filter((r) => r.id !== chatId));
      this._msgs.update((msgs) => msgs.filter((m) => m.chatId !== chatId));
    } catch (e) {
      console.error('[chat.store] deleteChat error', e);
    }
  }

  /** Solo elimina localmente (si lo necesitas en algún flujo) */
  removeChat(chatId: string) {
    this._chats.update((rows) => rows.filter((r) => r.id !== chatId));
    this._msgs.update((msgs) => msgs.filter((m) => m.chatId !== chatId));
  }

  /** Para futuro socket.io: actualizar bandeja cuando llega un mensaje nuevo */
  pushIncomingMessage(api: ApiMessage) {
    const msg = this.toMsg(api);

    // 1) agregar mensaje a la lista
    this._msgs.update((prev) => [...prev, msg]);

    // 2) actualizar la fila del chat (last + unread)
    this._chats.update((rows) =>
      rows.map((r) => {
        if (r.id !== msg.chatId) return r;
        return {
          ...r,
          last: { text: msg.text, at: msg.at },
          unread: r.unread + 1,
        };
      })
    );
  }
}
