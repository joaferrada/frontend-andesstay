import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthRoleService } from '../../../../core/auth/auth-role.service';
import { ReservationService } from '../../../../core/services/reservation.service';
import { friendlyHttpMessage } from '../../../../core/interceptors/http-error.interceptor';
import { Reservation } from '../../../../core/models/reservation.model';
import { ALL_STATUSES, ReservationStatus } from '../../../../core/models/reservation-status.enum';
import { UserRole } from '../../../../core/models/user-role.enum';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { StatusLabelPipe } from '../../../../shared/pipes/status-label.pipe';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ReservationFormComponent } from '../../components/reservation-form/reservation-form.component';
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
    StatusLabelPipe,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ConfirmDialogComponent,
    ReservationFormComponent,
    ReservationTableComponent
  ],
  templateUrl: './reservation-list.component.html',
  styleUrl: './reservation-list.component.scss'
})
export class ReservationListComponent implements OnInit {
  private readonly reservationService = inject(ReservationService);
  private readonly authRoles = inject(AuthRoleService);
  private readonly toast = inject(ToastService);

  readonly statuses = ALL_STATUSES;

  readonly reservations = signal<Reservation[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly statusFilter = signal<ReservationStatus | ''>('');
  readonly showForm = signal(false);
  readonly busyId = signal<number | null>(null);
  readonly pending = signal<PendingAction | null>(null);

  // Permisos por rol (Auditor solo lista y filtra)
  readonly canCreate = computed(() =>
    this.authRoles.hasAnyRole([UserRole.Admin, UserRole.Operador, UserRole.Cliente])
  );
  readonly canChangeStatus = computed(() =>
    this.authRoles.hasAnyRole([UserRole.Admin, UserRole.Operador])
  );
  readonly canDelete = computed(() => this.authRoles.hasRole(UserRole.Admin));
  readonly readOnly = computed(() => !this.canCreate() && !this.canChangeStatus() && !this.canDelete());

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

  onCreated(): void {
    this.showForm.set(false);
    this.load();
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

  /** 401/403/5xx ya los notifica el interceptor; aquí se cubre el resto. */
  private notifyActionError(err: unknown, fallback: string): void {
    const status = (err as { status?: number })?.status ?? -1;
    const handledByInterceptor = status === 0 || status === 401 || status === 403 || status >= 500;
    if (!handledByInterceptor) {
      this.toast.error(friendlyHttpMessage(err, fallback));
    }
  }
}
