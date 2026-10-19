import { ReservationStatus } from './reservation-status.enum';

export interface Reservation {
  id: number;
  clienteUsername?: string;
  huespedNombre?: string;
  huespedEmail?: string;
  /** Unidad del catálogo; las reservas antiguas solo tienen alojamientoNombre. */
  unidadId?: number | null;
  alojamientoNombre: string;
  fechaInicio: string;
  fechaFin: string;
  precioTotal: number;
  estado?: ReservationStatus | string;
}

export interface NewReservation {
  unidadId?: number;
  /** Nombre de la unidad elegida, por compatibilidad con el backend actual. */
  alojamientoNombre: string;
  fechaInicio: string;
  fechaFin: string;
  precioTotal: number;
  huespedNombre?: string;
  huespedEmail?: string;
}
