import { Component, Input } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-monthly-bar-chart',
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
export class MonthlyBarChartComponent {

  @Input() monthly: Record<string, number> = {};

  chartType: ChartType = 'bar';

  get chartData(): ChartData<'bar'> {
    const labels = Object.keys(this.monthly);
    const values = Object.values(this.monthly);

    return {
      labels,
      datasets: [
        {
          label: 'Pedidos',
          data: values,
        },
      ],
    };
  }
}
