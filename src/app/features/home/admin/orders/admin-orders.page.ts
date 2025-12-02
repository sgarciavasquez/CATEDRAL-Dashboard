import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { OrdersService } from '../../../../shared/services/orders/orders.service';
import { OrderStatus, UiReservation } from '../../../../shared/services/orders/models/orders.models';
import { HeaderComponent } from '../../../../shared/components/header/header';
import { FooterComponent } from '../../../../shared/components/footer/footer';
import { FormsModule } from '@angular/forms';
import { AdminSidebarComponent } from '../../../../shared/components/sidebar/admin-sidebar.component';
import { ChatContextService, ReservationPreview   } from '../../../../chat/chat-context.service'; 


@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
    FormsModule,
    AdminSidebarComponent,
  ],
  templateUrl: './admin-orders.page.html',
  styleUrls: ['./admin-orders.page.css']
})
export class AdminOrdersPage implements OnInit, OnDestroy {
  private orders = inject(OrdersService);
  private router = inject(Router);
  private chatCtx = inject(ChatContextService);

  loading = true;
  error = '';

  items: UiReservation[] = [];
  pagedItems: UiReservation[] = [];

  expanded = signal<Record<string, boolean>>({});

  status: OrderStatus | 'all' = 'all';
  orderBy: 'date' | 'amount' = 'date';

  private sub?: Subscription;

  page = 1;
  pageSize = 6;
  totalItems = 0;
  pages: number[] = [];

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.sub?.unsubscribe();

    const params =
      this.status === 'all' ? {} : { status: this.status as OrderStatus };

    this.sub = this.orders.list(params).subscribe({
      next: (list) => {
        this.items = this.sort(list);
        this.totalItems = this.items.length;
        this.page = 1;
        this.buildPages();
        this.applyPaging();
        this.loading = false;
      },
      error: (err) => {
        this.error =
          err?.error?.message ?? 'No se pudieron cargar las reservas';
        this.loading = false;
      }
    });
  }

  sort(list: UiReservation[]): UiReservation[] {
    if (!list) return [];
    if (this.orderBy === 'amount') {
      return [...list].sort((a, b) => b.total - a.total);
    }
    return [...list].sort((a, b) => +b.createdAt - +a.createdAt);
  }

  onOrderChange(): void {
    this.items = this.sort(this.items);
    this.page = 1;
    this.buildPages();
    this.applyPaging();
  }

  private applyPaging(): void {
    if (this.totalItems === 0) {
      this.pagedItems = [];
      return;
    }

    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedItems = this.items.slice(start, end);
  }

  private buildPages(): void {
    const total = this.totalPages;
    this.pages =
      this.totalItems === 0 || total <= 1
        ? []
        : Array.from({ length: total }, (_, i) => i + 1);
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.applyPaging();
  }

  get totalPages(): number {
    if (this.totalItems === 0) return 1;
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get fromItem(): number {
    if (this.totalItems === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  get toItem(): number {
    if (this.totalItems === 0) return 0;
    return Math.min(this.page * this.pageSize, this.totalItems);
  }

  toggle(id: string): void {
    const curr = this.expanded();
    this.expanded.set({ ...curr, [id]: !curr[id] });
  }

  complete(o: UiReservation): void {
    const prev = o.status;
    o.status = 'confirmed';
    this.orders.complete(o.id).subscribe({
      error: () => (o.status = prev)
    });
  }

  cancel(o: UiReservation): void {
    const prev = o.status;
    o.status = 'cancelled';
    this.orders.cancel(o.id).subscribe({
      error: () => (o.status = prev)
    });
  }

  badgeClass(st: OrderStatus): string {
    return {
      pending: 'bg-amber-100 text-amber-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-700'
    }[st];
  }

  goToChat(o: UiReservation): void {
  const chatId = Array.isArray(o.chatId) ? o.chatId[0] : o.chatId;
  if (!chatId) return;

  // Armamos un preview con el estado *actual* del pedido
  const preview: ReservationPreview = {
    reservationId: o.id,
    createdAt: o.createdAt,
    total: o.total,
    status: (o.status ?? 'pending').toUpperCase() as any,
    items: (o.items || []).map(it => ({
      name: it.name,
      qty: it.quantity,
      price: it.price,
      imageUrl: it.imageUrl,
    })),
  };

  // Guardamos en el contexto del chat para que ChatThread lo use
  this.chatCtx.set(chatId, preview);

  // También lo pasamos por state por si acaso
  this.router.navigate(['/admin/chat', chatId], {
    state: { reservationPreview: preview },
  });
}


  reopen(o: UiReservation): void {
    const prev = o.status;
    o.status = 'pending';  

    this.orders.reopen(o.id).subscribe({
      next: () => {
      },
      error: () => {
        o.status = prev; 
      },
    });
  }



}
