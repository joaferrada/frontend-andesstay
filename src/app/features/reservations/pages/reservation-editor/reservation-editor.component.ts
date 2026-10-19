import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReservationService } from '../../../../core/services/reservation.service';
import { friendlyHttpMessage } from '../../../../core/interceptors/http-error.interceptor';
import { Reservation } from '../../../../core/models/reservation.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ReservationFormComponent } from '../../components/reservation-form/reservation-form.component';

/** Crear (/reservations/new) o editar (/reservations/:id/edit) una reserva. */
@Component({
  selector: 'app-reservation-editor',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, EmptyStateComponent, StatusBadgeComponent, ReservationFormComponent],
  templateUrl: './reservation-editor.component.html',
  styleUrl: './reservation-editor.component.scss'
})
export class ReservationEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reservationService = inject(ReservationService);

  readonly id = signal<number | null>(null);
  readonly reservation = signal<Reservation | null>(null);
  readonly loading = signal(false);
  readonly notFound = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const param = this.route.snapshot.paramMap.get('id');
    if (param === null) {
      return; // modo creación
    }

    const id = Number(param);
    this.id.set(id);
    if (!Number.isInteger(id) || id <= 0) {
      this.notFound.set(true);
      return;
    }
    this.load(id);
  }

  load(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.notFound.set(false);

    this.reservationService.obtenerReserva(id).subscribe({
      next: reservation => {
        // 404: no existe o es de otro cliente
        this.reservation.set(reservation);
        this.notFound.set(reservation === null);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error al cargar la reserva:', err);
        this.error.set(friendlyHttpMessage(err, 'No fue posible cargar la reserva.'));
        this.loading.set(false);
      }
    });
  }

  goToList(): void {
    this.router.navigate(['/reservations']);
  }
}
