export enum ReservationStatus {
  Creada = 'CREADA',
  Confirmada = 'CONFIRMADA',
  CheckinPendiente = 'CHECKIN_PENDIENTE',
  EnEstadia = 'EN_ESTADIA',
  Checkout = 'CHECKOUT',
  Cancelada = 'CANCELADA'
}

export const ALL_STATUSES: ReservationStatus[] = [
  ReservationStatus.Creada,
  ReservationStatus.Confirmada,
  ReservationStatus.CheckinPendiente,
  ReservationStatus.EnEstadia,
  ReservationStatus.Checkout,
  ReservationStatus.Cancelada
];

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  [ReservationStatus.Creada]: 'Creada',
  [ReservationStatus.Confirmada]: 'Confirmada',
  [ReservationStatus.CheckinPendiente]: 'Check-in pendiente',
  [ReservationStatus.EnEstadia]: 'En estadía',
  [ReservationStatus.Checkout]: 'Check-out realizado',
  [ReservationStatus.Cancelada]: 'Cancelada'
};

export interface StatusTransition {
  to: ReservationStatus;
  action: string;
}

// Transiciones válidas desde cada estado. CHECKOUT y CANCELADA son finales.
export const STATUS_TRANSITIONS: Record<ReservationStatus, StatusTransition[]> = {
  [ReservationStatus.Creada]: [
    { to: ReservationStatus.Confirmada, action: 'Confirmar' },
    { to: ReservationStatus.Cancelada, action: 'Cancelar' }
  ],
  [ReservationStatus.Confirmada]: [
    { to: ReservationStatus.CheckinPendiente, action: 'Marcar check-in pendiente' },
    { to: ReservationStatus.Cancelada, action: 'Cancelar' }
  ],
  [ReservationStatus.CheckinPendiente]: [
    { to: ReservationStatus.EnEstadia, action: 'Registrar check-in' },
    { to: ReservationStatus.Cancelada, action: 'Cancelar' }
  ],
  [ReservationStatus.EnEstadia]: [
    { to: ReservationStatus.Checkout, action: 'Registrar check-out' }
  ],
  [ReservationStatus.Checkout]: [],
  [ReservationStatus.Cancelada]: []
};

export function isReservationStatus(value: unknown): value is ReservationStatus {
  return typeof value === 'string' && (ALL_STATUSES as string[]).includes(value);
}
