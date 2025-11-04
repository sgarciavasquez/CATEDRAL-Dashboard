import { Injectable, computed, signal } from '@angular/core';

export type Role = 'admin' | 'customer';
export interface CurrentUser { id: string; name: string; role: Role; }
export interface ChatRow {
  id: string;
  otherId: string;
  otherName: string;
  last: { text: string; at: string };
  unread: number;
}
export interface Msg { id: string; chatId: string; fromId: string; text: string; at: string; }

@Injectable({ providedIn: 'root' })
export class ChatMockService {
  // Cambia aquí para probar admin/cliente:
  currentUser = signal<CurrentUser>({ id: 'U100', name: 'Sebas', role: 'customer' });
  // currentUser = signal<CurrentUser>({ id: 'A1', name: 'Admin', role: 'admin' });

  private _chats = signal<ChatRow[]>([
    { id: 'C1', otherId: 'A1', otherName: 'Perfumes Catedral', last: { text: '¿Puedes mañana?', at: '2025-11-01T13:10:00' }, unread: 1 },
    { id: 'C2', otherId: 'A1', otherName: 'Perfumes Catedral', last: { text: 'Listo, entregado 👍', at: '2025-10-28T19:21:00' }, unread: 0 },
  ]);
  private _msgs = signal<Msg[]>([
    { id: 'M1', chatId: 'C1', fromId: 'U100', text: 'Hola, ¿coordinamos?', at: '2025-11-01T13:00:00' },
    { id: 'M2', chatId: 'C1', fromId: 'A1',   text: '¿Puedes mañana?',   at: '2025-11-01T13:10:00' },
  ]);

  chats$ = computed(() => this._chats());
  unreadCount$ = computed(() => this._chats().reduce((a,c)=>a+(c.unread||0),0));
  messagesByChat(chatId: string) { return computed(() => this._msgs().filter(m => m.chatId === chatId)); }

  markChatRead(chatId: string) {
    this._chats.update(list => list.map(c => c.id !== chatId ? c : ({ ...c, unread: 0 })));
  }

  send(chatId: string, fromId: string, text: string) {
    const at = new Date().toISOString();
    const msg: Msg = { id: 'tmp-'+crypto.randomUUID(), chatId, fromId, text, at };
    this._msgs.update(v => [...v, msg]);
    this._chats.update(list => list.map(c => c.id !== chatId ? c : ({ ...c, last: { text, at } })));
  }
}
