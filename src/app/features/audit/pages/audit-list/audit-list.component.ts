import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuditService } from '../../../../core/services/audit.service';
import { friendlyHttpMessage } from '../../../../core/interceptors/http-error.interceptor';
import {
  ALL_AUDIT_EVENT_TYPES,
  AUDIT_EVENT_LABELS,
  AuditEvent,
  AuditEventType,
  AuditFilters
} from '../../../../core/models/audit-event.model';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ReservationTimelineComponent } from '../../components/reservation-timeline/reservation-timeline.component';

const PAGE_SIZE = 20;

/** Eventos de auditoría con filtros y paginación. Solo lectura. */
@Component({
  selector: 'app-audit-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ReservationTimelineComponent
  ],
  templateUrl: './audit-list.component.html',
  styleUrl: './audit-list.component.scss'
})
export class AuditListComponent implements OnInit {
  private readonly auditService = inject(AuditService);
  private readonly route = inject(ActivatedRoute);

  readonly types = ALL_AUDIT_EVENT_TYPES;
  readonly typeLabels = AUDIT_EVENT_LABELS;

  // Valores del formulario de filtros (se aplican al presionar «Buscar»)
  actor = '';
  tipo: AuditEventType | '' = '';
  reservationId: number | null = null;
  desde = '';
  hasta = '';

  private readonly applied = signal<AuditFilters>({});
  readonly page = signal(0);
  readonly events = signal<AuditEvent[]>([]);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly rangeError = signal(false);

  /** Reserva cuya línea de tiempo está abierta. */
  readonly selectedReservation = signal<number | null>(null);

  readonly hasFilters = computed(() => Object.values(this.applied()).some(v => v !== '' && v !== null && v !== undefined));

  ngOnInit(): void {
    // /audit?reservationId=123 llega desde «Ver trazabilidad» en la tabla de reservas
    const id = Number(this.route.snapshot.queryParamMap.get('reservationId'));
    if (Number.isInteger(id) && id > 0) {
      this.reservationId = id;
      this.applied.set({ reservationId: id });
      this.selectedReservation.set(id);
    }
    this.load();
  }

  search(): void {
    this.rangeError.set(!!this.desde && !!this.hasta && this.desde > this.hasta);
    if (this.rangeError()) {
      return;
    }
    this.applied.set({
      actor: this.actor,
      tipo: this.tipo,
      reservationId: this.reservationId,
      desde: this.desde,
      hasta: this.hasta
    });
    this.page.set(0);
    this.load();
  }

  clear(): void {
    this.actor = '';
    this.tipo = '';
    this.reservationId = null;
    this.desde = '';
    this.hasta = '';
    this.rangeError.set(false);
    this.applied.set({});
    this.page.set(0);
    this.load();
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) {
      return;
    }
    this.page.set(page);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.auditService.listarEventos(this.applied(), this.page(), PAGE_SIZE).subscribe({
      next: page => {
        this.events.set(page?.content ?? []);
        this.totalElements.set(page?.totalElements ?? 0);
        this.totalPages.set(page?.totalPages ?? 0);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error al cargar eventos de auditoría:', err);
        this.error.set(friendlyHttpMessage(err, 'No fue posible cargar los eventos de auditoría.'));
        this.loading.set(false);
      }
    });
  }

  openTimeline(reservationId: number): void {
    this.selectedReservation.set(reservationId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  eventLabel(tipo: string): string {
    return AUDIT_EVENT_LABELS[tipo as AuditEventType] ?? tipo;
  }
}
