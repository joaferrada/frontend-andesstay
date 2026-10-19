import { Pipe, PipeTransform } from '@angular/core';
import { STATUS_LABELS, isReservationStatus } from '../../core/models/reservation-status.enum';

/** Convierte un estado de reserva (CHECKIN_PENDIENTE) en texto legible ("Check-in pendiente"). */
@Pipe({
  name: 'statusLabel',
  standalone: true
})
export class StatusLabelPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return 'Sin estado';
    }
    return isReservationStatus(value) ? STATUS_LABELS[value] : value;
  }
}
