import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';
import { AuditEvent, AuditFilters, Page } from '../models/audit-event.model';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiConfig.uri}/api/audit`;

  /** GET /api/audit/events?actor=&tipo=&reservationId=&desde=&hasta=&page=&size= */
  listarEventos(filters: AuditFilters, page: number, size: number): Observable<Page<AuditEvent>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (filters.actor?.trim()) {
      params = params.set('actor', filters.actor.trim());
    }
    if (filters.tipo) {
      params = params.set('tipo', filters.tipo);
    }
    if (filters.reservationId) {
      params = params.set('reservationId', filters.reservationId);
    }
    if (filters.desde) {
      params = params.set('desde', filters.desde);
    }
    if (filters.hasta) {
      params = params.set('hasta', filters.hasta);
    }
    return this.http.get<Page<AuditEvent>>(`${this.apiUrl}/events`, { params });
  }

  /** GET /api/audit/reservations/{id}/timeline */
  timeline(reservationId: number): Observable<AuditEvent[]> {
    return this.http.get<AuditEvent[]>(`${this.apiUrl}/reservations/${reservationId}/timeline`);
  }
}
