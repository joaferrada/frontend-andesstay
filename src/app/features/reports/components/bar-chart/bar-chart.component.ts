import { Component, computed, input } from '@angular/core';

export interface BarDatum {
  label: string;
  value: number;
}

/** Gráfico de barras verticales en CSS, con tabla oculta para lectores de pantalla. */
@Component({
  selector: 'app-bar-chart',
  standalone: true,
  templateUrl: './bar-chart.component.html',
  styleUrl: './bar-chart.component.scss'
})
export class BarChartComponent {
  readonly data = input.required<BarDatum[]>();
  /** Descripción del gráfico (caption de la tabla accesible). */
  readonly caption = input('Gráfico de barras');
  readonly valueLabel = input('Cantidad');

  readonly max = computed(() => Math.max(1, ...this.data().map(d => d.value)));

  /** Con muchas barras se muestra solo una de cada N etiquetas del eje. */
  readonly labelEvery = computed(() => Math.max(1, Math.ceil(this.data().length / 12)));

  height(value: number): number {
    return value > 0 ? Math.max(2, (value / this.max()) * 100) : 0;
  }
}
