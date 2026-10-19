import { Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuditService } from '../../../../core/services/audit.service';
import { friendlyHttpMessage } from '../../../../core/interceptors/http-error.interceptor';
import { AUDIT_EVENT_LABELS, AuditEvent, AuditEventType } from '../../../../core/models/audit-event.model';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

/** Línea de tiempo de una reserva (GET /api/audit/reservations/{id}/timeline). Solo lectura. */
@Component({
  selector: 'app-reservation-timeline',
  standalone: true,
  imports: [DatePipe, StatusBadgeComponent, LoadingSpinnerComponent, EmptyStateComponent],
  templateUrl: './reservation-timeline.component.html',
  styleUrl: './reservation-timeline.component.scss'
})
export class ReservationTimelineComponent {
  private readonly auditService = inject(AuditService);

  readonly reservationId = input.required<number>();
  readonly closed = output<void>();

  readonly events = signal<AuditEvent[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = this.reservationId();
      untracked(() => this.load(id));
    });
  }

  load(id = this.reservationId()): void {
    this.loading.set(true);
    this.error.set(null);

    this.auditService.timeline(id).subscribe({
      next: events => {
        // Orden cronológico por si el backend no lo garantiza
        const sorted = [...(events ?? [])].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
        this.events.set(sorted);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error al cargar la trazabilidad:', err);
        this.error.set(friendlyHttpMessage(err, 'No fue posible cargar la trazabilidad de la reserva.'));
        this.loading.set(false);
      }
    });
  }

  eventLabel(tipo: string): string {
    return AUDIT_EVENT_LABELS[tipo as AuditEventType] ?? tipo;
  }
}
