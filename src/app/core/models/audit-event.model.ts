export enum AuditEventType {
  ReservaCreada = 'RESERVA_CREADA',
  CambioEstado = 'CAMBIO_ESTADO',
  ReservaEliminada = 'RESERVA_ELIMINADA'
}

export const ALL_AUDIT_EVENT_TYPES: AuditEventType[] = [
  AuditEventType.ReservaCreada,
  AuditEventType.CambioEstado,
  AuditEventType.ReservaEliminada
];

export const AUDIT_EVENT_LABELS: Record<AuditEventType, string> = {
  [AuditEventType.ReservaCreada]: 'Reserva creada',
  [AuditEventType.CambioEstado]: 'Cambio de estado',
  [AuditEventType.ReservaEliminada]: 'Reserva eliminada'
};

export interface AuditEvent {
  id: number | string;
  tipo: AuditEventType | string;
  reservationId: number;
  actor: string;
  estadoAnterior?: string | null;
  estadoNuevo?: string | null;
  detalle?: string | null;
  occurredAt: string;
  registradoEn?: string;
}

export interface AuditFilters {
  actor?: string;
  tipo?: AuditEventType | '';
  reservationId?: number | null;
  /** yyyy-MM-dd */
  desde?: string;
  /** yyyy-MM-dd */
  hasta?: string;
}

/** Página de Spring Data (number es 0-based). */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}
