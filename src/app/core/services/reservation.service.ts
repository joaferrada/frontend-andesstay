import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';
import { NewReservation, Reservation } from '../models/reservation.model';
import { ReservationStatus } from '../models/reservation-status.enum';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  // Añadimos /api para que coincida exactamente con el @RequestMapping del BFF
  private apiUrl = `${environment.apiConfig.uri}/api/reservations`;

  constructor(private http: HttpClient) {}

  /** GET /api/reservations[?status=...]. Para Cliente_Dominio el backend devuelve solo sus reservas. */
  listarReservas(status?: ReservationStatus): Observable<Reservation[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<Reservation[]>(this.apiUrl, { params });
  }

  /**
   * GET /api/reservations/{id}. Devuelve null si la reserva no existe. El backend también
   * responde 404 cuando la reserva pertenece a otro cliente, y se trata igual: "no encontrada".
   */
  obtenerReserva(id: number): Observable<Reservation | null> {
    return this.http.get<Reservation>(`${this.apiUrl}/${id}`).pipe(
      catchError((err: unknown) =>
        err instanceof HttpErrorResponse && err.status === 404 ? of(null) : throwError(() => err)
      )
    );
  }

  /** POST /api/reservations. El backend ignora id, estado y clienteUsername; siempre parte en CREADA. */
  crearReserva(reserva: NewReservation): Observable<Reservation> {
    return this.http.post<Reservation>(this.apiUrl, this.toBody(reserva));
  }

  /** PUT /api/reservations/{id}. Actualiza los datos; no cambia el estado. */
  actualizarReserva(id: number, reserva: NewReservation): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/${id}`, this.toBody(reserva));
  }

  /** PUT /api/reservations/{id}/status. El CORS del BFF no permite PATCH. */
  cambiarEstado(id: number, status: ReservationStatus): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/${id}/status`, { status });
  }

  /** DELETE /api/reservations/{id}. Responde 204 sin body. */
  eliminarReserva(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /** Solo los campos que acepta el backend; fechas en formato yyyy-MM-dd. */
  private toBody(reserva: NewReservation): NewReservation {
    return {
      alojamientoNombre: reserva.alojamientoNombre,
      fechaInicio: reserva.fechaInicio.slice(0, 10),
      fechaFin: reserva.fechaFin.slice(0, 10),
      precioTotal: reserva.precioTotal
    };
  }
}
