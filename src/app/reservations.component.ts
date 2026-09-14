import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../services/reservation.service';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="font-family: sans-serif; padding: 20px; max-width: 1000px; margin: 0 auto;">

      <h2 style="color: #2b579a;">AndesStay - Mis Reservas</h2>

      <!-- NUEVA RESERVASSS -->
      <div style="
        border: 1px solid #ccc;
        padding: 20px;
        margin-bottom: 25px;
        border-radius: 8px;
        background: #f8f9fa;
      ">
        <h3>Registrar Nueva Reservass</h3>

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
              placeholder="Ej: Hotel Valparaíso"
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
         style="padding: 10px; background: #e8f5e9; border-radius: 5px;">
        {{ mensaje }}
      </p>

      <!-- LISTADO -->
      <h3>Mis reservas</h3>

      <p *ngIf="!cargado">Cargando reservas...</p>

      <p *ngIf="cargado && reservas.length === 0"
         style="color: #666;">
        No hay reservas registradas.
      </p>

      <table
        *ngIf="cargado && reservas.length > 0"
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
            <th style="padding: 10px;">Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr *ngFor="let r of reservas">

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
              <button
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
                Cancelar
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

  nuevaReserva = {
    alojamientoNombre: '',
    fechaInicio: '',
    fechaFin: '',
    precioTotal: null
  };

  constructor(
    private reservationService: ReservationService
  ) {}

  ngOnInit(): void {
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

    this.reservationService.crearReserva(payload).subscribe({
      next: () => {

        this.mensaje = 'Reserva creada correctamente.';

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
        this.mensaje = 'No fue posible crear la reserva.';
      }
    });
  }

  eliminarReserva(id: number): void {

    if (!confirm('¿Seguro que deseas cancelar esta reserva?')) {
      return;
    }

    this.reservationService.eliminarReserva(id).subscribe({
  next: () => {
    this.mensaje = 'Reserva cancelada correctamente.';
    this.cargarReservas();
  },
  error: (err: any) => {
    console.error('Error al eliminar reserva:', err);
    this.mensaje = 'No fue posible cancelar la reserva.';
  }
    });
  }
}