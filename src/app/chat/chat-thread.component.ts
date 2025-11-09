// chat-thread.component.ts
import { Component, inject, signal, computed, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FooterComponent } from "../shared/components/footer/footer";
import { HeaderComponent } from "../shared/components/header/header";
import { ChatStoreService } from './chat.store.service';
import { ChatContextService, ReservationPreview } from './chat-context.service';
import { NgIf, NgFor } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-chat-thread',
  imports: [CommonModule, RouterModule, FormsModule, FooterComponent, HeaderComponent, NgIf, NgFor],
  templateUrl: './chat-thread.component.html',
})
export class ChatThreadComponent {
  store = inject(ChatStoreService);
  route = inject(ActivatedRoute);
  private chatCtx = inject(ChatContextService);

  @ViewChild('endRef') endRef?: ElementRef<HTMLDivElement>;

  reservationPreview?: ReservationPreview;

  me = this.store.currentUser;
  chatId = this.route.snapshot.paramMap.get('id')!;
  isAdmin = !!this.route.snapshot.data?.['admin'];
  base = this.isAdmin ? '/admin/chat' : '/chat';

  msgs = this.store.messagesByChat(this.chatId);
  draft = signal('');

  otherName = computed(() => {
    const c = this.store.chats$().find(x => x.id === this.chatId);
    return c?.otherName ?? 'Tienda';
  });

  constructor() {
    this.store.markChatReadLocal(this.chatId);
    this.store.openThread(this.chatId);

    // 1) primero intenta desde el servicio
    this.reservationPreview = this.chatCtx.get(this.chatId);

    // 2) fallback: history.state (si entraron directo desde un link)
    if (!this.reservationPreview) {
      const st = (history?.state ?? {}) as any;
      if (st?.reservationPreview) {
        this.reservationPreview = st.reservationPreview as ReservationPreview;

        // ✅ FIX DE TIPOS: aseguramos que no sea undefined antes de set()
        if (this.reservationPreview) {
          this.chatCtx.set(this.chatId, this.reservationPreview); // <- ya no marca error
          // Alternativa equivalente:
          // this.chatCtx.set(this.chatId, this.reservationPreview!);
        }
      }
    }

    // autoscroll cuando cambian mensajes
    effect(() => {
      const _ = this.msgs();
      queueMicrotask(() => this.scrollToEnd());
    });
  }

  send() {
    const text = this.draft().trim();
    if (!text) return;
    this.store.send(this.chatId, text);
    this.draft.set('');
    queueMicrotask(() => this.scrollToEnd());
  }

  private scrollToEnd() {
    try {
      this.endRef?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } catch {}
  }
}
