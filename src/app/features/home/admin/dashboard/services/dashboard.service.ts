import { Injectable, inject } from '@angular/core';
import { OrdersService } from '../../../../../shared/services/orders/orders.service';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {

  orders = inject(OrdersService);

  async getDashboardData() {

    const list = await firstValueFrom(this.orders.list({}));

    const stats = {
      total: list.length,
      pending: list.filter(o => o.status === 'pending').length,
      completed: list.filter(o => o.status === 'confirmed').length,
      cancelled: list.filter(o => o.status === 'cancelled').length,
      amountTotal: list.reduce((a,b) => a + b.total, 0),
    };

    // Agrupación por mes
    const monthly = list.reduce((acc, o) => {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()+1}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { stats, monthly };
  }
}
