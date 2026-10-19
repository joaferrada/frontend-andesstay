export type ReportRange = 'last24h' | 'last7d' | 'last30d';

export const REPORT_RANGES: { value: ReportRange; label: string }[] = [
  { value: 'last24h', label: 'Últimas 24 horas' },
  { value: 'last7d', label: 'Últimos 7 días' },
  { value: 'last30d', label: 'Últimos 30 días' }
];

export interface HourlyCount {
  hora: string | number;
  cantidad: number;
}

export interface Kpis {
  reservasPorHora: HourlyCount[];
  reservasPorEstado: Record<string, number>;
  ocupacionActiva: number;
  tiempoCicloPromedioHoras: number | null;
  ingresosConfirmados: number;
  avisos?: string[];
}

export interface TopUnit {
  nombre?: string;
  unidadId?: number;
  cantidad: number;
}
