import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';
import { Unit, UnitFilters, UnitPayload } from '../models/unit.model';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiConfig.uri}/api/catalog/units`;

  /** GET /api/catalog/units?tipo=&hostal=&soloDisponibles= */
  listarUnidades(filters: UnitFilters = {}): Observable<Unit[]> {
    let params = new HttpParams();
    if (filters.tipo) {
      params = params.set('tipo', filters.tipo);
    }
    if (filters.hostal) {
      params = params.set('hostal', filters.hostal);
    }
    if (filters.soloDisponibles) {
      params = params.set('soloDisponibles', 'true');
    }
    return this.http.get<Unit[]>(this.apiUrl, { params });
  }

  obtenerUnidad(id: number): Observable<Unit> {
    return this.http.get<Unit>(`${this.apiUrl}/${id}`);
  }

  crearUnidad(unit: UnitPayload): Observable<Unit> {
    return this.http.post<Unit>(this.apiUrl, unit);
  }

  actualizarUnidad(id: number, unit: UnitPayload): Observable<Unit> {
    return this.http.put<Unit>(`${this.apiUrl}/${id}`, unit);
  }

  /** Baja lógica (la unidad queda con activo = false). */
  darDeBaja(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
