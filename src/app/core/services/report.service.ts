import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { SILENT_HTTP_ERRORS } from '../interceptors/http-error.interceptor';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';
import { Kpis, ReportRange, TopUnit } from '../models/report.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiConfig.uri}/api/report`;

  /** GET /api/report/kpis?range=. Con silent, un error no muestra aviso global. */
  kpis(range: ReportRange, options: { silent?: boolean } = {}): Observable<Kpis> {
    return this.http.get<Kpis>(`${this.apiUrl}/kpis`, {
      params: new HttpParams().set('range', range),
      context: new HttpContext().set(SILENT_HTTP_ERRORS, !!options.silent)
    });
  }

  /** GET /api/report/top-units?range=&limit= */
  topUnits(range: ReportRange, limit = 5): Observable<TopUnit[]> {
    const params = new HttpParams().set('range', range).set('limit', limit);
    return this.http.get<TopUnit[]>(`${this.apiUrl}/top-units`, { params });
  }
}
