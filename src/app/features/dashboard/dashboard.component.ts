import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthRoleService } from '../../core/auth/auth-role.service';
import { ReservationService } from '../../core/services/reservation.service';
import { ReportService } from '../../core/services/report.service';
import { friendlyHttpMessage } from '../../core/interceptors/http-error.interceptor';
import { Reservation } from '../../core/models/reservation.model';
import { ALL_STATUSES } from '../../core/models/reservation-status.enum';
import { UserRole } from '../../core/models/user-role.enum';
import { Unit, UnitType } from '../../core/models/unit.model';
import { CatalogService } from '../../core/services/catalog.service';
import { UnitImageService } from '../../core/services/unit-image.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { UnitImageComponent } from '../../shared/components/unit-image/unit-image.component';
import { UnitCardComponent } from '../../shared/components/unit-card/unit-card.component';
import { IconComponent, IconName } from '../../shared/components/icon/icon.component';

interface QuickLink {
  title: string;
  description: string;
  route: string;
  icon: IconName;
}

const FEATURED_COUNT = 4;

/** Una unidad por tipo (la con más cupos libres) y, si faltan, las siguientes con más cupos. */
function pickFeatured(units: Unit[]): Unit[] {
  const available = units
    .filter(u => u.activo !== false && u.cuposDisponibles > 0)
    .sort((a, b) => b.cuposDisponibles - a.cuposDisponibles || a.id - b.id);
  const byType = new Map<UnitType | string, Unit>();
  for (const unit of available) {
    if (!byType.has(unit.tipo)) {
      byType.set(unit.tipo, unit);
    }
  }
  const picked = [...byType.values()].slice(0, FEATURED_COUNT);
  for (const unit of available) {
    if (picked.length >= FEATURED_COUNT) break;
    if (!picked.includes(unit)) picked.push(unit);
  }
  return picked;
}

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
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    UnitImageComponent,
    UnitCardComponent,
    IconComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly reservationService = inject(ReservationService);
  private readonly reportService = inject(ReportService);
  private readonly catalogService = inject(CatalogService);
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

  /** Ocupación activa para el acceso rápido a Reportería; null si el servicio no respondió. */
  readonly occupancy = signal<number | null>(null);

  readonly hero = inject(UnitImageService).hero(2);
  /** Unidades con foto para «Alojamientos destacados»; vacío si el catálogo no respondió. */
  readonly featured = signal<Unit[]>([]);

  readonly greeting = computed(() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
  });

  readonly firstName = computed(() => {
    const name = this.authRoles.userName().trim();
    // Si solo hay correo, se muestra la parte antes de la @
    return (name.includes('@') ? name.split('@')[0] : name.split(/\s+/)[0]) || 'bienvenido';
  });

  /** Accesos según los permisos del usuario (los mismos que exigen las rutas). */
  readonly quickLinks = computed<QuickLink[]>(() => {
    const links: QuickLink[] = [];
    const roles = this.authRoles;
    if (roles.canCreate()) {
      links.push({ title: 'Nueva reserva', description: 'Elige alojamiento y fechas', route: '/reservations/new', icon: 'calendar-plus' });
    }
    if (roles.canView()) {
      links.push({
        title: this.isCliente() && !this.isAdmin() && !this.isOperador() ? 'Mis reservas' : 'Reservas',
        description: roles.isReadOnly() ? 'Consulta en modo solo lectura' : 'Estados, check-in y check-out',
        route: '/reservations',
        icon: 'calendar'
      });
    }
    links.push({
      title: 'Catálogo',
      description: roles.canManageCatalog() ? 'Crea y edita unidades' : 'Habitaciones, cabañas, lodges y domos',
      route: '/catalog',
      icon: 'cabin'
    });
    if (roles.canViewReports()) {
      links.push({ title: 'Reportería', description: 'Reservas por hora y unidades más demandadas', route: '/reports', icon: 'chart' });
    }
    if (roles.canViewAudit()) {
      links.push({ title: 'Auditoría', description: 'Trazabilidad de cada reserva', route: '/audit', icon: 'shield' });
    }
    return links;
  });

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
    this.loadFeatured();
    if (this.authRoles.canViewReports()) {
      this.loadOccupancy();
    }
  }

  /** Opcional: si el catálogo falla, simplemente no se muestran destacados. */
  private loadFeatured(): void {
    this.catalogService.listarUnidades({ soloDisponibles: true }, { silent: true }).subscribe({
      next: units => this.featured.set(pickFeatured(units ?? [])),
      error: err => console.warn('Catálogo no disponible para el panel:', err)
    });
  }

  /** Opcional: si el servicio de reportes falla, el panel sigue funcionando sin la cifra. */
  private loadOccupancy(): void {
    this.reportService.kpis('last24h', { silent: true }).subscribe({
      next: kpis => this.occupancy.set(typeof kpis?.ocupacionActiva === 'number' ? kpis.ocupacionActiva : null),
      error: err => console.warn('Reportería no disponible para el panel:', err)
    });
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
