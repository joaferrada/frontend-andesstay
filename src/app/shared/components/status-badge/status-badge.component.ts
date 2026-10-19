import { Component, computed, input } from '@angular/core';
import { StatusLabelPipe } from '../../pipes/status-label.pipe';
import { isReservationStatus } from '../../../core/models/reservation-status.enum';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [StatusLabelPipe],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss'
})
export class StatusBadgeComponent {
  readonly status = input<string | null | undefined>();

  readonly cssClass = computed(() => {
    const value = this.status();
    return isReservationStatus(value) ? `badge--${value.toLowerCase()}` : 'badge--unknown';
  });
}
