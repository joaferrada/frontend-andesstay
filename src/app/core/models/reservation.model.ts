import { ReservationStatus } from './reservation-status.enum';

export interface Reservation {
  id: number;
  clienteUsername?: string;
  alojamientoNombre: string;
  fechaInicio: string;
  fechaFin: string;
  precioTotal: number;
  estado?: ReservationStatus | string;
}

export interface NewReservation {
  alojamientoNombre: string;
  fechaInicio: string;
  fechaFin: string;
  precioTotal: number;
}
