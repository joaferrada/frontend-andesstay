import { Component, input, output } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Reservation } from '../../../../core/models/reservation.model';
import { ReservationStatus } from '../../../../core/models/reservation-status.enum';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { StatusActionsComponent } from '../status-actions/status-actions.component';

export interface StatusChangeEvent {
  reservation: Reservation;
  to: ReservationStatus;
}

@Component({
  selector: 'app-reservation-table',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, StatusBadgeComponent, StatusActionsComponent],
  templateUrl: './reservation-table.component.html',
  styleUrl: './reservation-table.component.scss'
})
export class ReservationTableComponent {
  readonly reservations = input.required<Reservation[]>();
  readonly canEdit = input(false);
  /** Admin y Auditor: enlace a la trazabilidad de la reserva. */
  readonly canViewAudit = input(false);
  readonly canChangeStatus = input(false);
  readonly canDelete = input(false);
  /** Id de la reserva con una operación en curso, para deshabilitar sus botones. */
  readonly busyId = input<number | null>(null);

  readonly statusChange = output<StatusChangeEvent>();
  readonly remove = output<Reservation>();

  hasActions(): boolean {
    return this.canEdit() || this.canChangeStatus() || this.canDelete() || this.canViewAudit();
  }
}
