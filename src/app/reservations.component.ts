import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ReservationService } from './core/services/reservation.service';
import { AuthRoleService } from './core/auth/auth-role.service';
import { UserRole } from './core/models/user-role.enum';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="font-family: sans-serif; padding: 20px; max-width: 1000px; margin: 0 auto;">

      <h2 style="color: #2b579a;">AndesStay - Mis Reservas</h2>

      <!-- NUEVA RESERVA -->
      <div *ngIf="puedeCrear" style="
        border: 1px solid #ccc;
        padding: 20px;
        margin-bottom: 25px;
        border-radius: 8px;
        background: #f8f9fa;
      ">
        <h3>Registrar Nueva Reserva</h3>

        <div style="
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: end;
        ">

          <div>
            <label>Alojamiento</label><br>
            <input
              type="text"
              [(ngModel)]="nuevaReserva.alojamientoNombre"
              placeholder="Ej: Hotel ValparaÃƒÂ­so"
              style="padding: 9px;"
            >
          </div>

          <div>
            <label>Fecha inicio</label><br>
            <input
              type="date"
              [(ngModel)]="nuevaReserva.fechaInicio"
              style="padding: 9px;"
            >
          </div>

          <div>
            <label>Fecha fin</label><br>
            <input
              type="date"
              [(ngModel)]="nuevaReserva.fechaFin"
              style="padding: 9px;"
            >
          </div>

          <div>
            <label>Precio total</label><br>
            <input
              type="number"
              [(ngModel)]="nuevaReserva.precioTotal"
              placeholder="$"
              style="padding: 9px; width: 120px;"
            >
          </div>

          <button
            (click)="guardarReserva()"
            [disabled]="!formularioValido()"
            style="
              padding: 10px 18px;
              background: #0078D4;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
            "
          >
            Guardar reserva
          </button>

        </div>
      </div>

      <!-- MENSAJE -->
      <p *ngIf="mensaje"
         [style.background]="esError ? '#fdecea' : '#e8f5e9'"
         [style.color]="esError ? '#a94442' : 'inherit'"
         style="padding: 10px; border-radius: 5px;">
        {{ mensaje }}
      </p>

      <!-- LISTADO -->
      <h3>Mis reservas</h3>

      <!-- FILTRO -->
      <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 15px;">
        <input
          type="text"
          [(ngModel)]="filtroTexto"
          placeholder="Buscar por cliente o alojamiento"
          style="padding: 9px; min-width: 260px;"
        >

        <select [(ngModel)]="filtroEstado" style="padding: 9px;">
          <option value="">Todos los estados</option>
          <option *ngFor="let e of estados" [value]="e">{{ e }}</option>
        </select>
      </div>

      <p *ngIf="!cargado">Cargando reservas...</p>

      <p *ngIf="cargado && reservasFiltradas.length === 0"
         style="color: #666;">
        No hay reservas registradas.
      </p>

      <table
        *ngIf="cargado && reservasFiltradas.length > 0"
        border="1"
        style="
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        "
      >
        <thead>
          <tr style="background: #f2f2f2;">
            <th style="padding: 10px;">ID</th>
            <th style="padding: 10px;">Cliente</th>
            <th style="padding: 10px;">Alojamiento</th>
            <th style="padding: 10px;">Inicio</th>
            <th style="padding: 10px;">Fin</th>
            <th style="padding: 10px;">Precio</th>
            <th style="padding: 10px;">Estado</th>
            <th *ngIf="puedeCambiarEstado || puedeEliminar" style="padding: 10px;">Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr *ngFor="let r of reservasFiltradas">

            <td style="padding: 10px;">
              {{ r.id }}
            </td>

            <td style="padding: 10px;">
              {{ r.clienteUsername }}
            </td>

            <td style="padding: 10px;">
              {{ r.alojamientoNombre }}
            </td>

            <td style="padding: 10px;">
              {{ r.fechaInicio }}
            </td>

            <td style="padding: 10px;">
              {{ r.fechaFin }}
            </td>

            <td style="padding: 10px;">
              $ {{ r.precioTotal }}
            </td>

            <td style="padding: 10px;">
              <select
                *ngIf="puedeCambiarEstado; else soloEstado"
                [ngModel]="r.estado"
                (ngModelChange)="cambiarEstado(r, $event)"
                style="padding: 6px;"
              >
                <option *ngFor="let e of estados" [value]="e">{{ e }}</option>
              </select>
              <ng-template #soloEstado>{{ r.estado || '-' }}</ng-template>
            </td>

            <td *ngIf="puedeCambiarEstado || puedeEliminar" style="padding: 10px;">
              <button
                *ngIf="puedeEliminar"
                (click)="eliminarReserva(r.id)"
                style="
                  padding: 7px 12px;
                  background: #d9534f;
                  color: white;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
                "
              >
                Eliminar
              </button>
            </td>

          </tr>
        </tbody>
      </table>

    </div>
  `
})
export class ReservationsComponent implements OnInit {

  reservas: any[] = [];
  cargado = false;
  mensaje = '';
  esError = false;

  filtroTexto = '';
  filtroEstado = '';

  readonly estados = ['PENDIENTE', 'CONFIRMADA', 'CANCELADA'];

  nuevaReserva = {
    alojamientoNombre: '',
    fechaInicio: '',
    fechaFin: '',
    precioTotal: null
  };

  constructor(
    private reservationService: ReservationService,
    private authRoles: AuthRoleService
  ) {}

  // Permisos por rol (Auditor solo lista y filtra)
  get puedeCrear(): boolean {
    return this.authRoles.hasAnyRole([UserRole.Admin, UserRole.Operador, UserRole.Cliente]);
  }

  get puedeCambiarEstado(): boolean {
    return this.authRoles.hasAnyRole([UserRole.Admin, UserRole.Operador]);
  }

  get puedeEliminar(): boolean {
    return this.authRoles.hasRole(UserRole.Admin);
  }

  get reservasFiltradas(): any[] {
    const texto = this.filtroTexto.trim().toLowerCase();

    return this.reservas.filter(r => {
      const coincideTexto = !texto ||
        `${r.clienteUsername ?? ''} ${r.alojamientoNombre ?? ''}`
          .toLowerCase()
          .includes(texto);

      const coincideEstado = !this.filtroEstado || r.estado === this.filtroEstado;

      return coincideTexto && coincideEstado;
    });
  }

  ngOnInit(): void {
    this.authRoles.refresh();
    this.cargarReservas();
  }

  cargarReservas(): void {
    this.cargado = false;

    this.reservationService.listarReservas().subscribe({
      next: (data) => {
        this.reservas = data;
        this.cargado = true;
      },
      error: (err) => {
        console.error('Error al cargar reservas:', err);
        this.mostrarError(err, 'No fue posible cargar las reservas.');
        this.cargado = true;
      }
    });
  }

  formularioValido(): boolean {
    return !!(
      this.nuevaReserva.alojamientoNombre &&
      this.nuevaReserva.fechaInicio &&
      this.nuevaReserva.fechaFin &&
      this.nuevaReserva.precioTotal &&
      this.nuevaReserva.precioTotal > 0
    );
  }

  guardarReserva(): void {

    const payload = {
      alojamientoNombre: this.nuevaReserva.alojamientoNombre,
      fechaInicio: this.nuevaReserva.fechaInicio,
      fechaFin: this.nuevaReserva.fechaFin,
      precioTotal: this.nuevaReserva.precioTotal
    };

    this.reservationService.crearReserva(payload as any).subscribe({
      next: () => {

        this.mostrarExito('Reserva creada correctamente.');

        this.nuevaReserva = {
          alojamientoNombre: '',
          fechaInicio: '',
          fechaFin: '',
          precioTotal: null
        };

        this.cargarReservas();

      },
      error: (err) => {
        console.error('Error al guardar la reserva:', err);
        this.mostrarError(err, 'No fue posible crear la reserva.');
      }
    });
  }

  cambiarEstado(reserva: any, estado: string): void {

    const estadoAnterior = reserva.estado;
    reserva.estado = estado;

    this.reservationService.cambiarEstado(reserva.id, estado as any).subscribe({
      next: () => {
        this.mostrarExito(`Estado de la reserva ${reserva.id} actualizado a ${estado}.`);
      },
      error: (err) => {
        console.error('Error al cambiar estado:', err);
        reserva.estado = estadoAnterior;
        this.mostrarError(err, 'No fue posible cambiar el estado de la reserva.');
      }
    });
  }

  eliminarReserva(id: number): void {

    if (!confirm('Ã‚Â¿Seguro que deseas eliminar esta reserva?')) {
      return;
    }

    this.reservationService.eliminarReserva(id).subscribe({
      next: () => {
        this.mostrarExito('Reserva eliminada correctamente.');
        this.cargarReservas();
      },
      error: (err: any) => {
        console.error('Error al eliminar reserva:', err);
        this.mostrarError(err, 'No fue posible eliminar la reserva.');
      }
    });
  }

  private mostrarExito(texto: string): void {
    this.esError = false;
    this.mensaje = texto;
  }

  private mostrarError(err: unknown, porDefecto: string): void {
    this.esError = true;
    this.mensaje =
      err instanceof HttpErrorResponse && err.status === 403
        ? 'No tienes permisos para esta acciÃƒÂ³n.'
        : porDefecto;
  }
}
