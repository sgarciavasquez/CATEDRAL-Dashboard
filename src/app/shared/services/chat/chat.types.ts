// chat.types.ts

// Importante: en toda tu app usas 'admin' | 'cliente' (no 'customer').
// Lo alineo para que coincida con ChatInbox, ChatStore y endpoints.
export type Role = 'admin' | 'cliente';

export interface ApiChat {
  _id: string;
  clienteId: string;
  adminId: string;
  unreadByCliente: number; // mensajes que el cliente NO ha leído
  unreadByAdmin: number;   // mensajes que el admin NO ha leído
  lastMessage?: { contenido: string; tipo: string; at?: string; emisor?: string };
  createdAt: string;
  updatedAt: string;
}

export interface ApiMessage {
  _id: string;
  chatId: string;
  senderId: string;
  type: 'text' | 'image' | 'file';
  text?: string;     // si type === 'text'
  fileUrl?: string;  // si type === 'image' | 'file'
  createdAt: string;
  readBy?: string[];
}

/** Estructuras de la UI */
export interface ChatRow {
  id: string;             // = _id
  otherId: string;        // = adminId | clienteId (el contrario a mi userId)
  otherName: string;      // nombre resuelto por tu store/servicio (placeholder aquí)
  last: { text: string; at: string };
  unread: number;         // contador para MI rol
}

export interface Msg {
  id: string;             // = _id
  chatId: string;
  fromId: string;         // = senderId
  text: string;           // = message.text
  at: string;             // = createdAt
}

/* ===========================
   Utilidades (reusables)
   =========================== */

/** true si el usuario pertenece al par del chat */
export function isParticipant(chat: ApiChat, userId: string): boolean {
  return chat?.clienteId === userId || chat?.adminId === userId;
}

/** devuelve el otro participante respecto de myId (o null si no calza) */
export function getOtherParticipantId(chat: ApiChat, myId: string): string | null {
  if (!chat) return null;
  if (chat.clienteId === myId) return chat.adminId;
  if (chat.adminId === myId) return chat.clienteId;
  return null;
}

/** contador de no leídos según MI rol */
export function getUnreadForMe(chat: ApiChat, myRole: Role): number {
  return myRole === 'cliente' ? (chat.unreadByCliente ?? 0) : (chat.unreadByAdmin ?? 0);
}

/** texto/fecha del último mensaje en formato que tu UI ya usaba */
export function getLastForRow(chat: ApiChat): { text: string; at: string } {
  const lm = chat?.lastMessage;
  return {
    text: lm?.contenido ?? '',
    at: lm?.at ?? chat?.updatedAt ?? chat?.createdAt ?? ''
  };
}

/**
 * Mapea ApiChat a ChatRow con valores mínimos.
 * - otherName es string porque normalmente lo resuelves en el Store
 *   (puedes pasarlo cuando lo tengas).
 */
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
