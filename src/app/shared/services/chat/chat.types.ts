// shared/services/chat/chat.types.ts

// Roles que usas en todo el proyecto
export type Role = 'admin' | 'cliente';

/** === Tipos que vienen del BACKEND (Mongoose) === */

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

function getUserRefId(ref: ApiChatUserRef): string {
  return typeof ref === 'string' ? ref : ref?._id ?? '';
}

export function isParticipant(chat: ApiChat, userId: string): boolean {
  if (!chat) return false;
  const cId = getUserRefId(chat.clienteId);
  const aId = getUserRefId(chat.adminId);
  return cId === userId || aId === userId;
}



export function getOtherParticipantId(chat: ApiChat, myId: string): string | null {
  if (!chat) return null;

  const cId = getUserRefId(chat.clienteId);
  const aId = getUserRefId(chat.adminId);

  if (cId === myId) return aId;
  if (aId === myId) return cId;
  return null;
}


export function getOtherParticipantName(chat: ApiChat, myId: string): string {
  if (!chat) return '';

  const cliente = chat.clienteId as any;
  const admin   = chat.adminId as any;

  console.log('[chat.types] getOtherParticipantName()', { chatId: chat._id, myId, cliente, admin });

  // Caso 1: cliente viene populado y NO soy yo
  if (cliente && typeof cliente === 'object' && cliente._id && cliente._id !== myId) {
    return cliente.name || cliente.email || '';
  }

  // Caso 2: admin viene populado y NO soy yo
  if (admin && typeof admin === 'object' && admin._id && admin._id !== myId) {
    return admin.name || admin.email || '';
  }

  // Si todo falla, sin nombre “bonito”
  return '';
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
  myRole: Role
): ChatRow {
  return {
    id: chat._id,
    otherId: getOtherParticipantId(chat, myId) ?? '',
    otherName: getOtherParticipantName(chat, myId),
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

type ApiChatUserRef =
  | string
  | {
      _id: string;
      name?: string;
      email?: string;
    };


export interface ApiChat {
  _id: string;

  // AHORA pueden ser string o el objeto populado con name/email
  clienteId: ApiChatUserRef;
  adminId: ApiChatUserRef;

  unreadByCliente: number;
  unreadByAdmin: number;
  reservationId?: string;

  lastMessage?: {
    contenido: string;
    tipo: 'text' | 'image' | 'file' | string;
    at?: string;
    emisor?: string;
  };

  meta?: {
    reservationId?: string;
    reservationStatus?: string;
    reservationPreview?: {
      reservationId: string;
      createdAt?: string;
      total?: number;
      status?: string;
      items?: Array<{ name: string; qty: number; price: number; imageUrl?: string }>;
    };
    [key: string]: any;
  };

  createdAt: string;
  updatedAt: string;
}



