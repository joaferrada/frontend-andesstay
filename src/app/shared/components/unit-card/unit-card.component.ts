import { Component, computed, inject, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { UNIT_TYPE_LABELS, Unit, UnitType } from '../../../core/models/unit.model';
import { UnitImageService } from '../../../core/services/unit-image.service';
import { UNIT_TYPE_ICONS, unitAvailability } from '../../../core/utils/unit-availability';
import { UnitImageComponent } from '../unit-image/unit-image.component';
import { IconComponent } from '../icon/icon.component';

/**
 * Tarjeta visual de una unidad del catálogo. Las acciones (Reservar, Editar...) se proyectan
 * con el atributo cardActions para que cada vista aplique sus propias reglas de rol.
 */
@Component({
  selector: 'app-unit-card',
  standalone: true,
  imports: [CurrencyPipe, UnitImageComponent, IconComponent],
  templateUrl: './unit-card.component.html',
  styleUrl: './unit-card.component.scss'
})
export class UnitCardComponent {
  private readonly images = inject(UnitImageService);

  readonly unit = input.required<Unit>();
  /** Nivel del título según la jerarquía de la página (h2 en el catálogo, h3 dentro de secciones). */
  readonly headingLevel = input<2 | 3>(2);

  readonly image = computed(() => this.images.forUnit(this.unit()));
  readonly availability = computed(() => unitAvailability(this.unit()));
  readonly typeLabel = computed(() => UNIT_TYPE_LABELS[this.unit().tipo as UnitType] ?? this.unit().tipo);
  readonly typeIcon = computed(() => UNIT_TYPE_ICONS[this.unit().tipo as UnitType] ?? 'mountain');
}
