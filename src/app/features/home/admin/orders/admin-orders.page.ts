import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { OrdersService } from '../../../../shared/services/orders/orders.service';
import { OrderStatus, UiReservation } from '../../../../shared/services/orders/models/orders.models';
import { HeaderComponent } from "../../../../shared/components/header/header";
import { FooterComponent } from "../../../../shared/components/footer/footer";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, FormsModule, RouterLink],
  templateUrl: './admin-orders.page.html',
  styleUrls: ['./admin-orders.page.css'],
})
export class AdminOrdersPage implements OnInit, OnDestroy {
  private orders = inject(OrdersService);
  private router: Router;

  loading = true;
  error = '';
  items: UiReservation[] = [];
  expanded = signal<Record<string, boolean>>({});

  // filtros / orden
  status: OrderStatus | 'all' = 'all';
  orderBy: 'date' | 'amount' = 'date';

  private sub?: Subscription;

  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  constructor() {
    this.orders = inject(OrdersService);
    this.router = inject(Router);
  }

  load() {
    this.loading = true; this.error = '';
    this.sub?.unsubscribe();
    this.sub = this.orders.list(this.status === 'all' ? {} : { status: this.status as OrderStatus })
      .subscribe({
        next: list => {
          this.items = this.sort(list);
          this.loading = false;
        },
        error: err => {
          this.error = err?.error?.message ?? 'No se pudieron cargar las reservas';
          this.loading = false;
        }
      });
  }

  sort(list: UiReservation[]): UiReservation[] {
    if (this.orderBy === 'amount') {
      return [...list].sort((a, b) => b.total - a.total);
    }
    return [...list].sort((a, b) => +b.createdAt - +a.createdAt);
  }

  toggle(id: string) {
    const curr = this.expanded();
    this.expanded.set({ ...curr, [id]: !curr[id] });
  }

  complete(o: UiReservation) {
    const prev = o.status;
    o.status = 'confirmed';
    this.orders.complete(o.id).subscribe({ error: _ => o.status = prev });
  }

  cancel(o: UiReservation) {
    const prev = o.status;
    o.status = 'cancelled';
    this.orders.cancel(o.id).subscribe({ error: _ => o.status = prev });
  }

  badgeClass(st: OrderStatus) {
    return {
      'pending': 'bg-amber-100 text-amber-800',
      'confirmed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-700',
    }[st];
  }

  goToChat(chatId: string | string[]) {
    const id = Array.isArray(chatId) ? chatId[0] : chatId;
    if (!id) return;
    this.router.navigate(['/admin/chat', id]);
  }

}
