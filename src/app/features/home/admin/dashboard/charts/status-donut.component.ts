import { Component, Input } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-status-donut',
  standalone: true,
  imports: [BaseChartDirective],        
  template: `
    <canvas
      baseChart
      [data]="chartData"
      [type]="chartType">
    </canvas>
  `,
})
export class StatusDonutComponent {
  @Input() stats: any = {};

  chartType: ChartType = 'doughnut';

  get chartData(): ChartData<'doughnut'> {
    return {
      labels: ['Pendientes', 'Completados', 'Cancelados'],
      datasets: [
        {
          data: [
            this.stats.pending ?? 0,
            this.stats.completed ?? 0,
            this.stats.cancelled ?? 0,
          ],
        },
      ],
    };
  }
}
