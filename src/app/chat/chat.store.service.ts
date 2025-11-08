// chat.store.service.ts
import { Injectable, computed, signal } from '@angular/core';

import { firstValueFrom } from 'rxjs';
import { ApiChat, ApiMessage, ChatRow, Msg } from '../shared/services/chat/chat.types';
import { ChatApiService } from '../shared/services/chat/chat.api.service';
import { MessagesApiService } from '../shared/services/chat/messages.api.service';

@Injectable({ providedIn: 'root' })
export class ChatStoreService {
  // Config/rutinas mínimas
  private baseNameForAdmin = 'Cliente';
  private baseNameForShop  = 'Perfumes Catedral';

  // Identidad (inyecta tu /auth/me si quieres)
  currentUser = signal<{ id: string; name: string; role: 'customer'|'admin' }>({
    id: 'REEMPLAZA_CON_ID_USUARIO', name: 'Yo', role: 'customer'
  });

  // State
  private _chats = signal<ChatRow[]>([]);
  private _msgs  = signal<Msg[]>([]);
  chats$ = computed(() => this._chats());
  unreadCount$ = computed(() => this._chats().reduce((a,c)=>a+(c.unread||0),0));
  messagesByChat(chatId: string) { return computed(() => this._msgs().filter(m => m.chatId === chatId)); }

  constructor(private chatsApi: ChatApiService, private msgsApi: MessagesApiService) {}

  // --- Transformadores ---
  private toRow(api: ApiChat): ChatRow {
    const me = this.currentUser();
    const isAdmin = me.role === 'admin';
    const otherId = isAdmin ? api.clienteId : api.adminId;
    const unread = isAdmin ? api.unreadByAdmin : api.unreadByCliente;
    const otherName = isAdmin ? `${this.baseNameForAdmin} ${otherId.slice(-4)}` : this.baseNameForShop;
    return {
      id: api._id,
      otherId,
      otherName,
      last: { text: api?.lastMessage?.contenido ?? '', at: api?.lastMessage?.at ?? api.updatedAt },
      unread,
    };
  }
  private toMsg(api: ApiMessage): Msg {
    return { id: api._id, chatId: api.chatId, fromId: api.senderId, text: api.text ?? '', at: api.createdAt };
  }

  // --- Cargas ---
  async loadInbox(roleHint?: 'cliente'|'admin') {
    const res = await firstValueFrom(this.chatsApi.listMine(roleHint));
    this._chats.set((res.data ?? []).map(c => this.toRow(c)));
  }

  async openThread(chatId: string) {
    // mensajes recientes
    const rows = await firstValueFrom(this.msgsApi.list(chatId));
    const list = (rows ?? []).map(m => this.toMsg(m));
    // NOTA: el backend probablemente devuelve descendente; tu UI espera ascendente al pintar en orden normal
    list.sort((a,b) => a.at.localeCompare(b.at));
    this._msgs.update(prev => {
      const others = prev.filter(m => m.chatId !== chatId);
      return [...others, ...list];
    });

    // marcar leído server-side
    await firstValueFrom(this.chatsApi.markRead(chatId, this.currentUser().id));
    // limpiar badge local
    this._chats.update(list => list.map(c => c.id !== chatId ? c : ({ ...c, unread: 0 })));
  }

  // paginar hacia atrás
  async loadMore(chatId: string) {
    const current = this._msgs().filter(m => m.chatId === chatId);
    if (!current.length) return;
    const oldest = current[0]; // asumiendo ascendente
    const older = await firstValueFrom(this.msgsApi.list(chatId, oldest.id));
    const mapped = (older ?? []).map(m => this.toMsg(m));
    mapped.sort((a,b) => a.at.localeCompare(b.at));
    this._msgs.update(prev => {
      const before = prev.filter(m => m.chatId !== chatId);
      return [...before, ...mapped, ...current];
    });
  }

  async send(chatId: string, text: string) {
    const sent = await firstValueFrom(this.msgsApi.create({ chatId, type: 'text', text }));
    const msg = this.toMsg(sent);
    this._msgs.update(v => [...v, msg]);
    // refrescar last + poner unread 0 en mi lado (el otro lo verá como unread++)
    this._chats.update(list => list.map(c => c.id !== chatId ? c : ({
      ...c,
      last: { text: msg.text, at: msg.at },
    })));
  }

  markChatReadLocal(chatId: string) {
    this._chats.update(list => list.map(c => c.id !== chatId ? c : ({ ...c, unread: 0 })));
  }
}
