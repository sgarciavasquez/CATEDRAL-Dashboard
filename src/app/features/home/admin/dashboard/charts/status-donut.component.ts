import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-status-donut',
  standalone: true,
  imports: [BaseChartDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <canvas
      baseChart
      [data]="chartData"
      [type]="chartType">
    </canvas>
  `,
})
export class StatusDonutComponent {
  // stats viene del padre (dashboard)
  @Input() set stats(value: any) {
    this._stats = value || {};
    this.buildChartData(); // solo recalculamos cuando cambia el input
  }

  private _stats: any = {};

  chartType: ChartType = 'doughnut';

  // este objeto se mantiene estable entre ciclos
  chartData: ChartData<'doughnut'> = {
    labels: ['Pendientes', 'Completados', 'Cancelados'],
    datasets: [
      { data: [0, 0, 0] },
    ],
  };

  private buildChartData() {
    const s = this._stats || {};
    const pending   = s.pending   ?? 0;
    const completed = s.completed ?? 0;
    const cancelled = s.cancelled ?? 0;
    this.chartData = {
      labels: ['Pendientes', 'Completados', 'Cancelados'],
      datasets: [
        {
          data: [pending, completed, cancelled],
        },
      ],
    };
  }
}
