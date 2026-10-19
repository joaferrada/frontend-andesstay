import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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

  listarReservas(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(this.apiUrl);
  }

  /**
   * Devuelve null si la reserva no existe. El backend también responde 404
   * cuando la reserva pertenece a otro cliente, y se trata igual: "no encontrada".
   */
  obtenerReserva(id: number): Observable<Reservation | null> {
    return this.http.get<Reservation>(`${this.apiUrl}/${id}`).pipe(
      catchError((err: unknown) =>
        err instanceof HttpErrorResponse && err.status === 404 ? of(null) : throwError(() => err)
      )
    );
  }

  eliminarReserva(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  crearReserva(reserva: NewReservation): Observable<Reservation> {
    return this.http.post<Reservation>(this.apiUrl, reserva);
  }

  // El CORS del BFF no permite PATCH; la respuesta es la reserva actualizada
  cambiarEstado(id: number, status: ReservationStatus): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/${id}/status`, { status });
  }
}
