// chat-context.service.ts
import { Injectable, signal } from '@angular/core';


export interface ReservationPreview {
  reservationId: string;
  createdAt: string | Date;  
  total?: number;
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | string;
  items?: {
    name: string;
    qty: number;
    price: number;
    imageUrl?: string;
  }[];
}

@Injectable({ providedIn: 'root' })
export class ChatContextService {
  private _map = new Map<string, ReservationPreview>();
  lastPreview = signal<ReservationPreview | null>(null);

  set(chatId: string, preview: ReservationPreview) {
    this._map.set(chatId, preview);
    this.lastPreview.set(preview);
  }

  get(chatId: string): ReservationPreview | undefined {
    return this._map.get(chatId);
  }

  clear(chatId?: string) {
    if (chatId) this._map.delete(chatId);
    else this._map.clear();
    this.lastPreview.set(null);
  }
}
