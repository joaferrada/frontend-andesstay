import { Component, inject, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UNIT_TYPE_LABELS, Unit, UnitType } from '../../../../core/models/unit.model';
import { UnitImageService } from '../../../../core/services/unit-image.service';
import { unitAvailability } from '../../../../core/utils/unit-availability';
import { UnitImageComponent } from '../../../../shared/components/unit-image/unit-image.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

/**
 * Galería de unidades para elegir en la reserva. Son radios nativos (flechas del teclado
 * para moverse) enlazados al control unidadId del formulario.
 */
@Component({
  selector: 'app-unit-picker',
  standalone: true,
  imports: [CurrencyPipe, ReactiveFormsModule, UnitImageComponent, IconComponent],
  templateUrl: './unit-picker.component.html',
  styleUrl: './unit-picker.component.scss'
})
export class UnitPickerComponent {
  private readonly images = inject(UnitImageService);

  readonly units = input.required<Unit[]>();
  readonly control = input.required<FormControl<number | null>>();
  readonly invalid = input(false);
  /** Ids de los mensajes asociados (error, ayuda). */
  readonly describedBy = input<string | null>(null);

  imageFor(unit: Unit): string {
    return this.images.forUnit(unit).src;
  }

  typeLabel(unit: Unit): string {
    return UNIT_TYPE_LABELS[unit.tipo as UnitType] ?? unit.tipo;
  }

  isLow(unit: Unit): boolean {
    return unitAvailability(unit).level === 'low';
  }
}
