import { Component, computed, input, output } from '@angular/core';
import {
  ReservationStatus,
  STATUS_TRANSITIONS,
  isReservationStatus
} from '../../../../core/models/reservation-status.enum';

@Component({
  selector: 'app-status-actions',
  standalone: true,
  templateUrl: './status-actions.component.html',
  styleUrl: './status-actions.component.scss'
})
export class StatusActionsComponent {
  readonly status = input<string | null | undefined>();
  readonly disabled = input(false);
  readonly transition = output<ReservationStatus>();

  /** Solo las transiciones válidas desde el estado actual. */
  readonly transitions = computed(() => {
    const current = this.status();
    return isReservationStatus(current) ? STATUS_TRANSITIONS[current] : [];
  });

  isCancel(to: ReservationStatus): boolean {
    return to === ReservationStatus.Cancelada;
  }
}
