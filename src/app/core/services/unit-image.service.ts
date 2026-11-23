import { Injectable } from '@angular/core';
import { UNIT_TYPE_LABELS, Unit, UnitType } from '../models/unit.model';
import { Reservation } from '../models/reservation.model';

const BASE = 'assets/images';

/** Fotos locales por tipo de unidad (créditos en src/assets/images/CREDITOS.md). */
const UNIT_IMAGES: Record<UnitType, readonly string[]> = {
  [UnitType.Habitacion]: [1, 2, 3, 4].map(n => `${BASE}/units/habitacion/habitacion-${n}.webp`),
  [UnitType.Cabana]: [1, 2, 3, 4].map(n => `${BASE}/units/cabana/cabana-${n}.webp`),
  [UnitType.Lodge]: [1, 2, 3, 4].map(n => `${BASE}/units/lodge/lodge-${n}.webp`),
  [UnitType.Domo]: [1, 2, 3, 4].map(n => `${BASE}/units/domo/domo-${n}.webp`)
};

/** Paisajes de montaña para portadas y para alojamientos de tipo desconocido. */
const HERO_IMAGES: readonly string[] = [1, 2, 3].map(n => `${BASE}/hero/hero-${n}.webp`);

/** Palabras del nombre que delatan el tipo (reservas antiguas sin unidad asociada). */
const NAME_HINTS: { type: UnitType; pattern: RegExp }[] = [
  { type: UnitType.Cabana, pattern: /caba[nñ]a|cabin|chalet|refugio/ },
  { type: UnitType.Domo, pattern: /domo|dome|glamping/ },
  { type: UnitType.Lodge, pattern: /lodge|hoster[ií]a/ },
  { type: UnitType.Habitacion, pattern: /habitaci[oó]n|suite|dormitorio|hostal|hostel/ }
];

export interface UnitImage {
  src: string;
  alt: string;
}

/** Hash FNV-1a: estable entre sesiones, para que una unidad siempre muestre la misma foto. */
function hash(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function pick(list: readonly string[], seed: string): string {
  return list[hash(seed) % list.length];
}

function isUnitType(value: unknown): value is UnitType {
  return typeof value === 'string' && value in UNIT_IMAGES;
}

/**
 * Asigna fotos a las unidades del catálogo solo en el frontend (el backend no maneja imágenes).
 * La elección es determinista según tipo + id.
 */
@Injectable({
  providedIn: 'root'
})
export class UnitImageService {

  /** Foto y texto alternativo de una unidad del catálogo. */
  forUnit(unit: Pick<Unit, 'id' | 'tipo' | 'nombre'> & Partial<Pick<Unit, 'hostal' | 'ubicacion'>>): UnitImage {
    const src = isUnitType(unit.tipo)
      ? pick(UNIT_IMAGES[unit.tipo], `${unit.tipo}-${unit.id}`)
      : this.forName(unit.nombre).src;
    return { src, alt: this.altFor(unit) };
  }

  /**
   * Para reservas: usa la unidad si se conoce; si no (reservas antiguas que solo tienen
   * alojamientoNombre), deduce el tipo por el nombre o usa un paisaje.
   */
  forReservation(reservation: Pick<Reservation, 'alojamientoNombre' | 'unidadId'>, unit?: Unit | null): UnitImage {
    if (unit) {
      return this.forUnit(unit);
    }
    return this.forName(reservation.alojamientoNombre, reservation.unidadId ?? undefined);
  }

  /** Imagen a partir solo del nombre del alojamiento. */
  forName(name: string | null | undefined, seed?: number | string): UnitImage {
    const clean = (name ?? '').trim();
    const type = this.typeFromName(clean);
    const key = `${type ?? 'paisaje'}-${seed ?? clean}`;
    return {
      src: type ? pick(UNIT_IMAGES[type], key) : pick(HERO_IMAGES, key),
      alt: clean
        ? `${type ? UNIT_TYPE_LABELS[type] : 'Alojamiento'} ${this.stripType(clean, type)}`.trim()
        : 'Paisaje de montaña en la cordillera'
    };
  }

  /** Paisaje de portada; con semilla siempre devuelve el mismo. */
  hero(seed: number | string = 0): UnitImage {
    const src = typeof seed === 'number'
      ? HERO_IMAGES[Math.abs(seed) % HERO_IMAGES.length]
      : pick(HERO_IMAGES, seed);
    return { src, alt: 'Paisaje de montaña en la cordillera de los Andes' };
  }

  typeFromName(name: string): UnitType | null {
    const normalized = name.toLowerCase();
    return NAME_HINTS.find(h => h.pattern.test(normalized))?.type ?? null;
  }

  private altFor(unit: Pick<Unit, 'tipo' | 'nombre'> & Partial<Pick<Unit, 'hostal' | 'ubicacion'>>): string {
    const label = isUnitType(unit.tipo) ? UNIT_TYPE_LABELS[unit.tipo] : 'Alojamiento';
    const where = [unit.hostal, unit.ubicacion].filter(Boolean).join(', ');
    const name = this.stripType(unit.nombre ?? '', isUnitType(unit.tipo) ? unit.tipo : null);
    return `${label} ${name}${where ? ` en ${where}` : ''}`.replace(/\s+/g, ' ').trim();
  }

  /** Evita textos como «Cabaña Cabaña Lenga» cuando el nombre ya incluye el tipo. */
  private stripType(name: string, type: UnitType | null): string {
    if (!type) {
      return name;
    }
    const hint = NAME_HINTS.find(h => h.type === type)!;
    return hint.pattern.test(name.split(/\s+/)[0]?.toLowerCase() ?? '')
      ? name.split(/\s+/).slice(1).join(' ')
      : name;
  }
}
