// chat-thread.component.ts
import { Component, inject, signal, computed, effect, ViewChild, ElementRef, OnDestroy,} from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrdersService } from '../shared/services/orders/orders.service';
import { ChatContextService, ReservationPreview } from './chat-context.service';
import { FooterComponent } from '../shared/components/footer/footer';
import { HeaderComponent } from '../shared/components/header/header';
import { UserService, ApiUser } from '../shared/services/user/user.service';
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
  private users = inject(UserService);

  reservationPreview?: ReservationPreview;
  reservationClosed = false;
  chatClosed = false;

  // referencia al final de la lista de mensajes
  @ViewChild('endRef') endRef?: ElementRef<HTMLDivElement>;

  // control de autoscroll
  private lastLen = 0;
  private autoScroll = true;

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

    const me = this.store.currentUser();

    // Si todavía tiene el placeholder, voy a buscarme al backend
    if (!me.id || me.id === 'REEMPLAZA_CON_ID_USUARIO') {
      this.users.me().subscribe({
        next: (u: ApiUser) => {
          const role = u.role === 'admin' ? 'admin' : 'cliente';
          const id = u._id ?? (u as any).id ?? '';

          this.store.setCurrentUser({
            id,
            name: u.name ?? 'Yo',
            role,
          });

          this.initThread();
        },
        error: (e) => {
          console.error('[ChatThread] me() ERROR en thread', e);
          // Igual inicializamos, pero sin markRead correcto
          this.initThread();
        },
      });
    } else {
      // Ya tengo usuario en el store
      this.initThread();
    }
  }

  private initThread() {
    this.store.markChatReadLocal(this.chatId);
    this.store.openThread(this.chatId);

    const ctxPreview = this.chatCtx.get(this.chatId);
    if (ctxPreview) {
      console.log('[ChatThread] preview desde ChatContext:', ctxPreview);
      this.applyPreview(ctxPreview);
    }

    if (!this.reservationPreview) {
      const st = (history as any)?.state ?? {};
      if (st?.reservationPreview) {
        console.log(
          '[ChatThread] preview desde history.state:',
          st.reservationPreview
        );
        this.applyPreview(st.reservationPreview as ReservationPreview);
      }
    }

    if (!this.reservationPreview) {
      this.loadPreviewByChatId();
    }

    if (this.reservationPreview) {
      this.chatCtx.set(this.chatId, this.reservationPreview);
    }

    // efecto para autoscroll solo cuando cambia la cantidad de mensajes
    effect(() => {
      const list = this.msgs();
      const len = list.length;

      const shouldScroll =
        this.autoScroll && len !== this.lastLen && len > 0;

      this.lastLen = len;

      if (shouldScroll) {
        queueMicrotask(() => this.scrollToEnd());
      }
    });

    this.startPolling();
  }

  private startPolling() {
    this.pollSub?.unsubscribe();
    this.pollSub = interval(4000).subscribe(() => {
      this.store.openThread(this.chatId);
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

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
    if (!text || this.chatClosed) {
      if (this.chatClosed) {
        console.warn('[ChatThread] send bloqueado: chat cerrado');
      }
      return;
    }

    this.store.send(this.chatId, text);
    this.draft.set('');

    // después de enviar, forzamos autoscroll al fondo
    this.autoScroll = true;
    queueMicrotask(() => this.scrollToEnd(true));
  }

  onScroll(e: Event) {
    const el = e.target as HTMLElement;

    // si llega arriba, cargamos más mensajes antiguos
    if (el.scrollTop === 0) {
      this.store.loadMore(this.chatId);
    }

    // calculamos qué tan lejos del final está
    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;

    // si está cerca del final (por ejemplo a menos de 80px), mantenemos autoscroll
    this.autoScroll = distanceFromBottom < 80;
  }

  private scrollToEnd(smooth = false) {
    try {
      // usamos el contenedor scrollable (padre del endRef)
      const box = this.endRef?.nativeElement?.parentElement as
        | HTMLElement
        | null;

      if (!box) return;

      const top = box.scrollHeight;

      if (smooth) {
        box.scrollTo({ top, behavior: 'smooth' });
      } else {
        box.scrollTop = top;
      }
    } catch {
      // ignorar errores de scroll
    }
  }

  onEnter(ev: any) {
    if (ev.shiftKey) return;
    ev.preventDefault();
    this.send();
  }
}
