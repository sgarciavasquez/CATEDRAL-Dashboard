// chat-thread.component.ts
import {
  Component,
  inject,
  signal,
  computed,
  effect,
  ViewChild,
  ElementRef,
  OnDestroy,

} from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { OrdersService } from '../shared/services/orders/orders.service';
import { ChatContextService, ReservationPreview } from './chat-context.service';

import { FooterComponent } from '../shared/components/footer/footer';
import { HeaderComponent } from '../shared/components/header/header';

import { ChatStoreService } from './chat.store.service';

@Component({
  standalone: true,
  selector: 'app-chat-thread',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    FooterComponent,
    HeaderComponent,
    NgIf,
    NgFor,
  ],
  templateUrl: './chat-thread.component.html',
})

export class ChatThreadComponent implements OnDestroy {

  private pollSub?: Subscription; 
  private store = inject(ChatStoreService);
  private route = inject(ActivatedRoute);
  private chatCtx = inject(ChatContextService);
  private orders = inject(OrdersService);
  reservationPreview?: ReservationPreview;
  reservationClosed = false;
  chatClosed = false;

  @ViewChild('endRef') endRef?: ElementRef<HTMLDivElement>;


  me = this.store.currentUser;
  chatId = this.route.snapshot.paramMap.get('id')!;
  isAdmin = !!this.route.snapshot.data?.['admin'];
  base = this.isAdmin ? '/admin/chat' : '/chat';

  msgs = this.store.messagesByChat(this.chatId);
  draft = signal('');

  otherName = computed(() => {
    const c = this.store.chats$().find((x) => x.id === this.chatId);
    return c?.otherName ?? (this.isAdmin ? 'Cliente' : 'Perfumes Catedral');
  });

  constructor() {
    console.log('%c[ChatThread] ctor', 'color:#2563eb', { chatId: this.chatId });


    this.store.markChatReadLocal(this.chatId);
    this.store.openThread(this.chatId); 

    // Limpiar badge local y cargar mensajes
    this.store.markChatReadLocal(this.chatId);
    this.store.openThread(this.chatId);

    // 1) Intentar obtener preview desde ChatContext (cuando vienes desde la reserva)
    const ctxPreview = this.chatCtx.get(this.chatId);
    if (ctxPreview) {
      console.log('[ChatThread] preview desde ChatContext:', ctxPreview);
      this.applyPreview(ctxPreview);
    }

    // 2) Si no hay nada, probar con history.state (navigate con state)
    if (!this.reservationPreview) {
      const st = (history as any)?.state ?? {};
      if (st?.reservationPreview) {
        console.log('[ChatThread] preview desde history.state:', st.reservationPreview);
        this.applyPreview(st.reservationPreview as ReservationPreview);
      }
    }

    // 3) Si aún no tenemos preview, pedirlo al backend por chatId
    if (!this.reservationPreview) {
      this.loadPreviewByChatId();
    }

    // Guardar el último preview en el contexto si ya lo tenemos
    if (this.reservationPreview) {
      this.chatCtx.set(this.chatId, this.reservationPreview);
    }

    // Auto-scroll cuando cambian los mensajes
    effect(() => {
      const _ = this.msgs();
      queueMicrotask(() => this.scrollToEnd());
    });

    this.startPolling();
  }

  private startPolling() {
    // si ya hay un polling viejo, lo cortamos
    this.pollSub?.unsubscribe();

    this.pollSub = interval(4000).subscribe(() => {
      // recarga los mensajes del chat actual
      this.store.openThread(this.chatId);
    });
  }

   ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }


  /** Llama a /reservations/by-chat/:chatId para armar el resumen */
  private loadPreviewByChatId() {
    console.log('[ChatThread] loadPreviewByChatId ->', this.chatId);
    this.orders.getPreviewByChat(this.chatId).subscribe({
      next: (prev) => {
        if (!prev) {
          console.log('[ChatThread] no hay reserva asociada a este chat');
          return;
        }
        console.log('[ChatThread] preview desde backend:', prev);
        this.applyPreview(prev);
        this.chatCtx.set(this.chatId, this.reservationPreview!);
      },
      error: (err) => {
        console.error('[ChatThread] getPreviewByChat error', err);
      },
    });
  }

  /** Normaliza status y deja chatClosed correcto */
  private applyPreview(p: ReservationPreview) {
    const status = (p.status ?? 'PENDING').toUpperCase() as
      | 'PENDING'
      | 'CONFIRMED'
      | 'CANCELLED';

    this.reservationPreview = { ...p, status };

    this.chatClosed = status === 'CONFIRMED' || status === 'CANCELLED';

    console.log('[ChatThread] applyPreview ->', {
      status,
      chatClosed: this.chatClosed,
      preview: this.reservationPreview,
    });
  }

  /* ----------------- Envío de mensajes ----------------- */

  send() {
    const text = this.draft().trim();
    if (!text || this.chatClosed) {   // 👈 respeta el flag
      if (this.chatClosed) {
        console.warn('[ChatThread] send bloqueado: chat cerrado');
      }
      return;
    }

    this.store.send(this.chatId, text);
    this.draft.set('');
    queueMicrotask(() => this.scrollToEnd());
  }

  onScroll(e: Event) {
    const el = e.target as HTMLElement;
    if (el.scrollTop === 0) {
      this.store.loadMore(this.chatId);
    }
  }

  private scrollToEnd() {
    try {
      this.endRef?.nativeElement?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    } catch { }
  }
}
