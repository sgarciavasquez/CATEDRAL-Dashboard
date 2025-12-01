import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-monthly-bar-chart',
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
export class MonthlyBarChartComponent {

  @Input() set monthly(value: Record<string, number>) {
    this._monthly = value || {};
    this.buildChartData(); // solo cuando cambian los datos
  }

  private _monthly: Record<string, number> = {};

  chartType: ChartType = 'bar';

  // objeto estable, no se recrea en cada CD
  chartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        label: 'Pedidos',
        data: [],
      },
    ],
  };

  private buildChartData() {
    const labels = Object.keys(this._monthly);
    const values = Object.values(this._monthly);

    this.chartData = {
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
