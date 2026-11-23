import { Component, inject, input, output } from '@angular/core';
import { CurrencyPipe, DatePipe, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Reservation } from '../../../../core/models/reservation.model';
import { ReservationStatus } from '../../../../core/models/reservation-status.enum';
import { Unit } from '../../../../core/models/unit.model';
import { UnitImage, UnitImageService } from '../../../../core/services/unit-image.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { UnitImageComponent } from '../../../../shared/components/unit-image/unit-image.component';
import { StatusActionsComponent } from '../status-actions/status-actions.component';

export interface StatusChangeEvent {
  reservation: Reservation;
  to: ReservationStatus;
}

@Component({
  selector: 'app-reservation-table',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    NgTemplateOutlet,
    RouterLink,
    StatusBadgeComponent,
    StatusActionsComponent,
    UnitImageComponent
  ],
  templateUrl: './reservation-table.component.html',
  styleUrl: './reservation-table.component.scss'
})
export class ReservationTableComponent {
  private readonly images = inject(UnitImageService);

  readonly reservations = input.required<Reservation[]>();
  /** Unidades del catálogo por id, para la miniatura (opcional: sin ellas se deduce por el nombre). */
  readonly units = input<ReadonlyMap<number, Unit>>(new Map());
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

  thumb(reservation: Reservation): UnitImage {
    const unit = reservation.unidadId ? this.units().get(reservation.unidadId) : undefined;
    return this.images.forReservation(reservation, unit);
  }
}
