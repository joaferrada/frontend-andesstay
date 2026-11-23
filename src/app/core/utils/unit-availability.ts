import { Unit, UnitType } from '../models/unit.model';

export type AvailabilityLevel = 'ok' | 'low' | 'none' | 'inactive';

export interface Availability {
  level: AvailabilityLevel;
  label: string;
  /** Porcentaje de cupos libres (0–100), para la barra. */
  percent: number;
}

/** Con este porcentaje de cupos libres o menos (o 2 cupos o menos) se avisa «Últimos cupos». */
const LOW_THRESHOLD = 0.25;

/** Disponibilidad de una unidad según cuposDisponibles / cuposTotales. */
export function unitAvailability(unit: Pick<Unit, 'activo' | 'cuposDisponibles' | 'cuposTotales'>): Availability {
  const total = Math.max(unit.cuposTotales ?? 0, 0);
  const free = Math.max(unit.cuposDisponibles ?? 0, 0);
  const percent = total > 0 ? Math.min(100, Math.round((free / total) * 100)) : 0;

  if (unit.activo === false) {
    return { level: 'inactive', label: 'Inactiva', percent: 0 };
  }
  if (free <= 0) {
    return { level: 'none', label: 'Sin cupos', percent: 0 };
  }
  if (free <= 2 || (total > 0 && free / total <= LOW_THRESHOLD)) {
    return { level: 'low', label: 'Últimos cupos', percent };
  }
  return { level: 'ok', label: 'Disponible', percent };
}

/** Ícono asociado a cada tipo de unidad. */
export const UNIT_TYPE_ICONS: Record<UnitType, 'bed' | 'cabin' | 'lodge' | 'dome'> = {
  [UnitType.Habitacion]: 'bed',
  [UnitType.Cabana]: 'cabin',
  [UnitType.Lodge]: 'lodge',
  [UnitType.Domo]: 'dome'
};
