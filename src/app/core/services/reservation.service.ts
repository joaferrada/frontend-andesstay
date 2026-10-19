import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  eliminarReserva(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  crearReserva(reserva: NewReservation): Observable<Reservation> {
    return this.http.post<Reservation>(this.apiUrl, reserva);
  }

  cambiarEstado(id: number, estado: ReservationStatus): Observable<Reservation> {
    return this.http.patch<Reservation>(`${this.apiUrl}/${id}/estado`, { estado });
  }
}
