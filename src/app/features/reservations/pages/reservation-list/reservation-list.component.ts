import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthRoleService } from '../../../../core/auth/auth-role.service';
import { ReservationService } from '../../../../core/services/reservation.service';
import { friendlyHttpMessage } from '../../../../core/interceptors/http-error.interceptor';
import { Reservation } from '../../../../core/models/reservation.model';
import { ALL_STATUSES, ReservationStatus } from '../../../../core/models/reservation-status.enum';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { StatusLabelPipe } from '../../../../shared/pipes/status-label.pipe';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  ReservationTableComponent,
  StatusChangeEvent
} from '../../components/reservation-table/reservation-table.component';

type PendingAction =
  | { kind: 'delete'; reservation: Reservation }
  | { kind: 'status'; reservation: Reservation; to: ReservationStatus };

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    StatusLabelPipe,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ConfirmDialogComponent,
    ReservationTableComponent
  ],
  templateUrl: './reservation-list.component.html',
  styleUrl: './reservation-list.component.scss'
})
export class ReservationListComponent implements OnInit {
  private readonly reservationService = inject(ReservationService);
  // Permisos centralizados en AuthRoleService (Auditor: solo lectura)
  readonly authRoles = inject(AuthRoleService);
  private readonly toast = inject(ToastService);

  readonly statuses = ALL_STATUSES;

  readonly reservations = signal<Reservation[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly statusFilter = signal<ReservationStatus | ''>('');
  readonly busyId = signal<number | null>(null);
  readonly pending = signal<PendingAction | null>(null);

  readonly filtered = computed(() => {
    const status = this.statusFilter();
    const list = this.reservations();
    return status ? list.filter(r => r.estado === status) : list;
  });

  readonly dialogTitle = computed(() => {
    const p = this.pending();
    if (!p) return '';
    return p.kind === 'delete' ? 'Eliminar reserva' : 'Cancelar reserva';
  });

  readonly dialogMessage = computed(() => {
    const p = this.pending();
    if (!p) return '';
    const r = p.reservation;
    return p.kind === 'delete'
      ? `Se eliminará la reserva #${r.id} de ${r.alojamientoNombre}. Esta acción no se puede deshacer.`
      : `La reserva #${r.id} de ${r.alojamientoNombre} quedará cancelada.`;
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.reservationService.listarReservas().subscribe({
      next: data => {
        this.reservations.set(data ?? []);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error al cargar reservas:', err);
        this.error.set(friendlyHttpMessage(err, 'No fue posible cargar las reservas.'));
        this.loading.set(false);
      }
    });
  }

  onStatusChange(event: StatusChangeEvent): void {
    // Cancelar es irreversible: se pide confirmación
    if (event.to === ReservationStatus.Cancelada) {
      this.pending.set({ kind: 'status', reservation: event.reservation, to: event.to });
      return;
    }
    this.applyStatus(event.reservation, event.to);
  }

  onRemove(reservation: Reservation): void {
    this.pending.set({ kind: 'delete', reservation });
  }

  confirmPending(): void {
    const p = this.pending();
    this.pending.set(null);
    if (!p) return;

    if (p.kind === 'delete') {
      this.delete(p.reservation);
    } else {
      this.applyStatus(p.reservation, p.to);
    }
  }

  private applyStatus(reservation: Reservation, to: ReservationStatus): void {
    this.busyId.set(reservation.id);

    this.reservationService.cambiarEstado(reservation.id, to).subscribe({
      next: updated => {
        this.reservations.update(list =>
          list.map(r => (r.id === reservation.id ? { ...r, ...updated, estado: updated?.estado ?? to } : r))
        );
        this.busyId.set(null);
        this.toast.success(`Reserva #${reservation.id} actualizada.`);
      },
      error: err => {
        console.error('Error al cambiar estado:', err);
        this.busyId.set(null);
        this.notifyActionError(err, 'No fue posible cambiar el estado de la reserva.');
      }
    });
  }

  private delete(reservation: Reservation): void {
    this.busyId.set(reservation.id);

    this.reservationService.eliminarReserva(reservation.id).subscribe({
      next: () => {
        this.reservations.update(list => list.filter(r => r.id !== reservation.id));
        this.busyId.set(null);
        this.toast.success(`Reserva #${reservation.id} eliminada.`);
      },
      error: err => {
        console.error('Error al eliminar reserva:', err);
        this.busyId.set(null);
        this.notifyActionError(err, 'No fue posible eliminar la reserva.');
      }
    });
  }

  /**
   * 0/401/403/5xx ya los notifica el interceptor; aquí se cubre el resto (400, 404, 409...).
   * El backend responde { timestamp, status, error, message }; si trae "message" se muestra tal cual
   * (en un 409 incluye las transiciones posibles).
   */
  private notifyActionError(err: unknown, fallback: string): void {
    const status = err instanceof HttpErrorResponse ? err.status : -1;
    const handledByInterceptor = status === 0 || status === 401 || status === 403 || status >= 500;
    if (handledByInterceptor) {
      return;
    }

    const backendMessage = err instanceof HttpErrorResponse ? err.error?.message : undefined;
    if (typeof backendMessage === 'string' && backendMessage.trim()) {
      this.toast.error(backendMessage);
    } else if (status === 404) {
      this.toast.error('La reserva no fue encontrada.');
    } else {
      this.toast.error(friendlyHttpMessage(err, fallback));
    }
  }
}
