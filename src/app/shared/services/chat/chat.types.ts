// shared/services/chat/chat.types.ts

// Roles que usas en todo el proyecto
export type Role = 'admin' | 'cliente';

/** === Tipos que vienen del BACKEND (Mongoose) === */

export interface ApiChat {
  _id: string;
  clienteId: string;         // ObjectId string
  adminId: string;           // ObjectId string
  unreadByCliente: number;
  unreadByAdmin: number;
  lastMessage?: {
    contenido: string;
    tipo: 'text' | 'image' | 'file' | string;
    at?: string;
    emisor?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type MessageState = 'ENVIADO' | 'ENTREGADO' | 'LEIDO';

export interface ApiMessage {
  _id: string;
  chat: string;              // ObjectId del chat
  emisor: string;            // ObjectId del user que envía
  tipo: 'text' | 'image' | 'file' | string;
  contenido: string;
  meta?: Record<string, any>;
  estado: MessageState;
  createdAt: string;
  deliveredAt?: string;
  readAt?: string;
}

/** === Tipos de la UI (lo que pintas en componentes) === */

export interface ChatRow {
  id: string;                // = _id
  otherId: string;           // id del otro participante
  otherName: string;         // lo resuelves en Store
  last: { text: string; at: string };
  unread: number;            // contador para MI rol
}

export interface Msg {
  id: string;                // = _id
  chatId: string;            // = chat
  fromId: string;            // = emisor
  text: string;              // = contenido
  at: string;                // = createdAt
  state?: MessageState;      // ENVIADO/ENTREGADO/LEIDO
}

/** === Helpers de mapeo/reutilizables === */

export function isParticipant(chat: ApiChat, userId: string): boolean {
  return chat?.clienteId === userId || chat?.adminId === userId;
}

export function getOtherParticipantId(chat: ApiChat, myId: string): string | null {
  if (!chat) return null;
  if (chat.clienteId === myId) return chat.adminId;
  if (chat.adminId === myId) return chat.clienteId;
  return null;
}

export function getUnreadForMe(chat: ApiChat, myRole: Role): number {
  return myRole === 'cliente' ? (chat.unreadByCliente ?? 0) : (chat.unreadByAdmin ?? 0);
}

export function getLastForRow(chat: ApiChat): { text: string; at: string } {
  const lm = chat?.lastMessage;
  return {
    text: lm?.contenido ?? '',
    at: lm?.at ?? chat?.updatedAt ?? chat?.createdAt ?? ''
  };
}

export function mapApiChatToRow(
  chat: ApiChat,
  myId: string,
  myRole: Role,
  otherName: string = ''
): ChatRow {
  return {
    id: chat._id,
    otherId: getOtherParticipantId(chat, myId) ?? '',
    otherName,
    last: getLastForRow(chat),
    unread: getUnreadForMe(chat, myRole),
  };
}

/** Mapeo ApiMessage -> Msg de UI (útil en tu Store) */
export function mapApiMessageToMsg(m: ApiMessage): Msg {
  return {
    id: m._id,
    chatId: m.chat,
    fromId: m.emisor,
    text: m.contenido,
    at: m.createdAt,
    state: m.estado,
  };
}
