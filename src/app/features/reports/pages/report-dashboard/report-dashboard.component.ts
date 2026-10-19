import { Component, LOCALE_ID, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../../core/services/report.service';
import { friendlyHttpMessage } from '../../../../core/interceptors/http-error.interceptor';
import { HourlyCount, Kpis, REPORT_RANGES, ReportRange, TopUnit } from '../../../../core/models/report.model';
import { ALL_STATUSES } from '../../../../core/models/reservation-status.enum';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { BarChartComponent, BarDatum } from '../../components/bar-chart/bar-chart.component';

@Component({
  selector: 'app-report-dashboard',
  standalone: true,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    FormsModule,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    BarChartComponent
  ],
  templateUrl: './report-dashboard.component.html',
  styleUrl: './report-dashboard.component.scss'
})
export class ReportDashboardComponent implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly locale = inject(LOCALE_ID);

  readonly ranges = REPORT_RANGES;
  readonly range = signal<ReportRange>('last24h');

  readonly kpis = signal<Kpis | null>(null);
  readonly kpisLoading = signal(true);
  readonly kpisError = signal<string | null>(null);

  readonly topUnits = signal<TopUnit[]>([]);
  readonly topLoading = signal(true);
  readonly topError = signal<string | null>(null);

  readonly hourly = computed<BarDatum[]>(() =>
    (this.kpis()?.reservasPorHora ?? []).map(h => ({ label: this.formatHora(h.hora), value: h.cantidad ?? 0 }))
  );
  readonly hasHourlyData = computed(() => this.hourly().some(d => d.value > 0));

  /** Estados conocidos en su orden, más cualquier otro que envíe el backend. */
  readonly byStatus = computed(() => {
    const counts = this.kpis()?.reservasPorEstado ?? {};
    const known = ALL_STATUSES.map(s => ({ status: s as string, count: counts[s] ?? 0 }));
    const extra = Object.keys(counts)
      .filter(k => !(ALL_STATUSES as string[]).includes(k))
      .map(k => ({ status: k, count: counts[k] }));
    return [...known, ...extra];
  });

  readonly topMax = computed(() => Math.max(1, ...this.topUnits().map(u => u.cantidad)));

  ngOnInit(): void {
    this.load();
  }

  setRange(range: ReportRange): void {
    this.range.set(range);
    this.load();
  }

  load(): void {
    this.loadKpis();
    this.loadTopUnits();
  }

  loadKpis(): void {
    this.kpisLoading.set(true);
    this.kpisError.set(null);
    this.reportService.kpis(this.range()).subscribe({
      next: kpis => {
        this.kpis.set(kpis);
        this.kpisLoading.set(false);
      },
      error: err => {
        console.error('Error al cargar KPIs:', err);
        this.kpis.set(null);
        this.kpisError.set(friendlyHttpMessage(err, 'No fue posible cargar los indicadores.'));
        this.kpisLoading.set(false);
      }
    });
  }

  loadTopUnits(): void {
    this.topLoading.set(true);
    this.topError.set(null);
    this.reportService.topUnits(this.range(), 5).subscribe({
      next: units => {
        this.topUnits.set(units ?? []);
        this.topLoading.set(false);
      },
      error: err => {
        console.error('Error al cargar unidades más demandadas:', err);
        this.topError.set(friendlyHttpMessage(err, 'No fue posible cargar las unidades más demandadas.'));
        this.topLoading.set(false);
      }
    });
  }

  unitName(u: TopUnit): string {
    return u.nombre || (u.unidadId != null ? `Unidad #${u.unidadId}` : 'Sin nombre');
  }

  /** "hora" puede venir como número (0-23) o como fecha-hora ISO. */
  private formatHora(hora: HourlyCount['hora']): string {
    if (typeof hora === 'number') {
      return `${String(hora).padStart(2, '0')}:00`;
    }
    if (typeof hora === 'string' && hora.includes('T')) {
      const pattern = this.range() === 'last24h' ? 'HH:mm' : 'dd/MM HH:mm';
      return formatDate(hora, pattern, this.locale);
    }
    return String(hora ?? '');
  }
}
