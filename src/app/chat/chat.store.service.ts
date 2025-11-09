// chat.store.service.ts
import { Injectable, computed, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiChat, ApiMessage, ChatRow, Msg } from '../shared/services/chat/chat.types';
import { ChatApiService } from '../shared/services/chat/chat.api.service';
import { MessagesApiService } from '../shared/services/chat/messages.api.service';

@Injectable({ providedIn: 'root' })
export class ChatStoreService {
  // Etiquetas base para “otro” usuario
  private baseNameForCliente = 'Cliente';
  private baseNameForShop    = 'Perfumes Catedral';

  // Identidad (engancha luego a /auth/me)
  currentUser = signal<{ id: string; name: string; role: 'cliente' | 'admin' }>({
    id: 'REEMPLAZA_CON_ID_USUARIO',
    name: 'Yo',
    role: 'cliente',
  });

  // ---- Estado ----
  private _chats = signal<ChatRow[]>([]);
  private _msgs  = signal<Msg[]>([]);

  chats$ = computed(() => this._chats());
  unreadCount$ = computed(() => this._chats().reduce((a, c) => a + (c.unread || 0), 0));
  messagesByChat(chatId: string) {
    return computed(() => this._msgs().filter(m => m.chatId === chatId));
  }

  constructor(
    private chatsApi: ChatApiService,
    private msgsApi:  MessagesApiService
  ) {}

  // ---- Mapeos ----
  private toRow(api: ApiChat): ChatRow {
    const me = this.currentUser();
    const iAmAdmin = me.role === 'admin';

    const otherId   = iAmAdmin ? api.clienteId : api.adminId;
    const otherName = iAmAdmin ? `${this.baseNameForCliente} ${otherId.slice(-4)}` : this.baseNameForShop;
    const unread    = iAmAdmin ? (api.unreadByAdmin ?? 0) : (api.unreadByCliente ?? 0);

    return {
      id: api._id,
      otherId,
      otherName,
      last: { text: api?.lastMessage?.contenido ?? '', at: api?.lastMessage?.at ?? api.updatedAt ?? api.createdAt },
      unread,
    };
  }

  private toMsg(api: ApiMessage): Msg {
    return {
      id: api._id,
      chatId: api.chatId,
      fromId: api.senderId,
      text: api.text ?? '',
      at: api.createdAt,
    };
    // si tu backend devuelve 'type' distinto a 'text', puedes mapearlo acá
  }

  // ---- Acciones ----
  async loadInbox(roleHint?: 'cliente' | 'admin') {
    const res = await firstValueFrom(this.chatsApi.listMine(roleHint));
    this._chats.set((res.data ?? []).map(c => this.toRow(c)));
  }

  async openThread(chatId: string) {
    // 1) Cargar últimos N
    const res = await firstValueFrom(this.msgsApi.list(chatId, { limit: 120 }));
    const list = (res.data ?? []).map(m => this.toMsg(m));

    // Orden ascendente por fecha (para pintar de arriba a abajo)
    list.sort((a, b) => a.at.localeCompare(b.at));

    // 2) Guardar en estado
    this._msgs.update(prev => {
      const others = prev.filter(m => m.chatId !== chatId);
      return [...others, ...list];
    });

    // 3) Marcar leído en server y limpiar badge local
    await firstValueFrom(this.chatsApi.markRead(chatId, this.currentUser().id));
    this._chats.update(rows => rows.map(r => r.id !== chatId ? r : ({ ...r, unread: 0 })));
  }

  // Paginación hacia atrás (cargar mensajes más antiguos)
  async loadMore(chatId: string) {
    const current = this._msgs().filter(m => m.chatId === chatId).sort((a,b)=>a.at.localeCompare(b.at));
    if (!current.length) return;

    const oldest = current[0]; // el más antiguo en pantalla
    const res = await firstValueFrom(this.msgsApi.list(chatId, { before: oldest.at, limit: 50 }));
    const older = (res.data ?? []).map(m => this.toMsg(m)).sort((a,b)=>a.at.localeCompare(b.at));

    if (!older.length) return;

    this._msgs.update(prev => {
      const others = prev.filter(m => m.chatId !== chatId);
      return [...others, ...older, ...current];
    });
  }

  async send(chatId: string, text: string) {
    const res = await firstValueFrom(this.msgsApi.send(chatId, text));
    const sent = this.toMsg(res.data);

    // append local
    this._msgs.update(v => [...v, sent]);

    // refrescar last en la fila de ese chat
    this._chats.update(rows =>
      rows.map(r => r.id !== chatId ? r : ({ ...r, last: { text: sent.text, at: sent.at } }))
    );
  }

  // Solo local (cuando entro al hilo)
  markChatReadLocal(chatId: string) {
    this._chats.update(rows => rows.map(r => r.id !== chatId ? r : ({ ...r, unread: 0 })));
  }

  setCurrentUser(u: { id: string; name?: string; role: 'cliente' | 'admin' | 'customer' }) {
  const role = (u.role === 'admin') ? 'admin' : 'cliente';
  this.currentUser.set({
    id: u.id,
    name: u.name ?? 'Yo',
    role
  });
}

}
