import { Component, computed, inject, input } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { UNIT_TYPE_LABELS, Unit, UnitType } from '../../../../core/models/unit.model';
import { UnitImageService } from '../../../../core/services/unit-image.service';
import { UnitImageComponent } from '../../../../shared/components/unit-image/unit-image.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

/** Resumen de la reserva en curso: foto grande, fechas, noches y tarifa x noches = total. */
@Component({
  selector: 'app-reservation-summary',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, UnitImageComponent, IconComponent],
  templateUrl: './reservation-summary.component.html',
  styleUrl: './reservation-summary.component.scss'
})
export class ReservationSummaryComponent {
  private readonly images = inject(UnitImageService);

  readonly unit = input<Unit | null>(null);
  readonly nights = input(0);
  /** yyyy-MM-dd */
  readonly fechaInicio = input('');
  /** yyyy-MM-dd */
  readonly fechaFin = input('');
  /** Precio total del formulario (el Admin puede ajustarlo). */
  readonly total = input<number | null>(null);

  readonly image = computed(() => {
    const unit = this.unit();
    return unit ? this.images.forUnit(unit) : this.images.hero(2);
  });

  readonly typeLabel = computed(() => {
    const tipo = this.unit()?.tipo;
    return tipo ? UNIT_TYPE_LABELS[tipo as UnitType] ?? tipo : '';
  });

  readonly subtotal = computed(() => (this.unit()?.tarifaNoche ?? 0) * this.nights());

  /** El total difiere del cálculo (ajuste manual del Admin). */
  readonly adjusted = computed(() => {
    const total = Number(this.total());
    return this.nights() > 0 && total > 0 && total !== this.subtotal();
  });
}
