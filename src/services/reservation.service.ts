import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  // Añadimos /api para que coincida exactamente con el @RequestMapping del BFF
  private apiUrl = `${environment.apiConfig.uri}/api/reservations`;

  constructor(private http: HttpClient) {}

  listarReservas(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  eliminarReserva(id: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  crearReserva(reserva: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, reserva);
  }
}