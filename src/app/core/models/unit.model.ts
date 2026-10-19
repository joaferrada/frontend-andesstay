export enum UnitType {
  Habitacion = 'HABITACION',
  Cabana = 'CABANA',
  Lodge = 'LODGE',
  Domo = 'DOMO'
}

export const ALL_UNIT_TYPES: UnitType[] = [UnitType.Habitacion, UnitType.Cabana, UnitType.Lodge, UnitType.Domo];

export const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  [UnitType.Habitacion]: 'Habitación',
  [UnitType.Cabana]: 'Cabaña',
  [UnitType.Lodge]: 'Lodge',
  [UnitType.Domo]: 'Domo'
};

export interface Unit {
  id: number;
  nombre: string;
  tipo: UnitType;
  hostal: string;
  ubicacion: string;
  capacidad: number;
  tarifaNoche: number;
  cuposTotales: number;
  cuposDisponibles: number;
  activo: boolean;
}

/** Body de POST/PUT /api/catalog/units. */
export type UnitPayload = Omit<Unit, 'id'>;

export interface UnitFilters {
  tipo?: UnitType | '';
  hostal?: string;
  soloDisponibles?: boolean;
}
