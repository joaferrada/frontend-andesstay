import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthRoleService } from '../../core/auth/auth-role.service';
import { ReservationService } from '../../core/services/reservation.service';
import { friendlyHttpMessage } from '../../core/interceptors/http-error.interceptor';
import { Reservation } from '../../core/models/reservation.model';
import { ALL_STATUSES } from '../../core/models/reservation-status.enum';
import { UserRole } from '../../core/models/user-role.enum';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

/** Fecha local en formato YYYY-MM-DD, comparable con fechaInicio/fechaFin del backend. */
function todayKey(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const dateKey = (value: string | undefined) => (value ?? '').slice(0, 10);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, RouterLink, StatusBadgeComponent, LoadingSpinnerComponent, EmptyStateComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly reservationService = inject(ReservationService);
  readonly authRoles = inject(AuthRoleService);

  readonly reservations = signal<Reservation[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly today = todayKey();

  readonly isAdmin = computed(() => this.authRoles.hasRole(UserRole.Admin));
  readonly isOperador = computed(() => this.authRoles.hasRole(UserRole.Operador));
  readonly isCliente = computed(() => this.authRoles.hasRole(UserRole.Cliente));
  readonly isAuditor = computed(() => this.authRoles.hasRole(UserRole.Auditor));
  readonly hasNoRole = computed(() => this.authRoles.roles().length === 0);

  readonly statusCounts = computed(() =>
    ALL_STATUSES.map(status => ({
      status,
      count: this.reservations().filter(r => r.estado === status).length
    }))
  );

  readonly arrivalsToday = computed(() =>
    this.reservations().filter(r => dateKey(r.fechaInicio) === this.today)
  );

  readonly departuresToday = computed(() =>
    this.reservations().filter(r => dateKey(r.fechaFin) === this.today)
  );

  readonly myReservations = computed(() =>
    [...this.reservations()].sort((a, b) => dateKey(a.fechaInicio).localeCompare(dateKey(b.fechaInicio)))
  );

  readonly latestReservations = computed(() =>
    [...this.reservations()].sort((a, b) => b.id - a.id).slice(0, 5)
  );

  ngOnInit(): void {
    if (this.hasNoRole()) {
      this.loading.set(false);
      return;
    }
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
        console.error('Error al cargar reservas para el panel:', err);
        this.error.set(friendlyHttpMessage(err, 'No fue posible cargar la información del panel.'));
        this.loading.set(false);
      }
    });
  }
}
