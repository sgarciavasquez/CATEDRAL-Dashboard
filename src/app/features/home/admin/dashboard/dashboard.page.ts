import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../../shared/components/header/header';
import { FooterComponent } from '../../../../shared/components/footer/footer';
import { StatusDonutComponent } from './charts/status-donut.component';
import { MonthlyBarChartComponent } from './charts/monthly-bar-chart.component';
import { DashboardService } from './services/dashboard.service';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
    StatusDonutComponent,
    MonthlyBarChartComponent,
  ],
  templateUrl: './dashboard.page.html',
})
export class DashboardPage implements OnInit {

  svc = inject(DashboardService);

  loading = true;

  stats = {
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
    amountTotal: 0
  };

  monthly: Record<string, number> = {};

  async ngOnInit() {
    const data = await this.svc.getDashboardData();
    this.stats = data.stats;
    this.monthly = data.monthly;
    this.loading = false;
  }
}
