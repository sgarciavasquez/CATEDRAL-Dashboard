// src/app/features/home/admin/dashboard/dashboard.page.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { HeaderComponent } from '../../../../shared/components/header/header';
import { FooterComponent } from '../../../../shared/components/footer/footer';
import { StatusDonutComponent } from './charts/status-donut.component';
import { MonthlyBarChartComponent } from './charts/monthly-bar-chart.component';
import { DashboardService } from './services/dashboard.service';
import { AdminSidebarComponent } from '../../../../shared/components/sidebar/admin-sidebar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,               
    HeaderComponent,
    FooterComponent,
    StatusDonutComponent,
    MonthlyBarChartComponent,
    AdminSidebarComponent,
  ],
  templateUrl: './dashboard.page.html',
})
export class DashboardPage implements OnInit {

  svc = inject(DashboardService);

  loading = true;

  // Resumen global
  stats = {
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
    amountTotal: 0,
  };

  // Pedidos por mes (para el gráfico de barras)
  monthly: Record<string, number> = {};

  // Monto por mes para el selector
  amountByMonth: Record<string, number> = {};

  // Selector de mes
  availableMonths: string[] = [];
  selectedMonth = '';

  async ngOnInit() {
    const data = await this.svc.getDashboardData();

    this.stats = data.stats;
    this.monthly = data.monthly ?? {};
    this.amountByMonth = data.amountByMonth ?? {};

    // Meses disponibles ordenados (último al final)
    this.availableMonths = Object.keys(this.monthly).sort();

    // Por defecto toma el último mes disponible
    this.selectedMonth = this.availableMonths[this.availableMonths.length - 1] ?? '';

    // Ajusta la ganancia del mes inicial
    if (this.selectedMonth) {
      this.stats.amountTotal = this.amountByMonth[this.selectedMonth] ?? 0;
    }

    this.loading = false;
  }

  // Cambia la ganancia cuando se cambia el mes del combo
  filterMonth() {
    if (!this.selectedMonth) return;
    this.stats.amountTotal = this.amountByMonth[this.selectedMonth] ?? 0;
  }
}
