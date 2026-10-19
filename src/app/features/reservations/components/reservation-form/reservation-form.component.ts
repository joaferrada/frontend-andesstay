import { Component, DestroyRef, OnInit, inject, input, output, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { ReservationService } from '../../../../core/services/reservation.service';
import { AuthRoleService } from '../../../../core/auth/auth-role.service';
import { CatalogService } from '../../../../core/services/catalog.service';
import { UNIT_TYPE_LABELS, Unit } from '../../../../core/models/unit.model';
import { Reservation } from '../../../../core/models/reservation.model';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { friendlyHttpMessage } from '../../../../core/interceptors/http-error.interceptor';

const positiveNumber: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (value === null || value === '' || value === undefined) {
    return null;
  }
  return Number(value) > 0 ? null : { positive: true };
};

const dateRange: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const inicio = group.get('fechaInicio')?.value;
  const fin = group.get('fechaFin')?.value;
  if (!inicio || !fin) {
    return null;
  }
  return fin > inicio ? null : { dateRange: true };
};

// Validators.email acepta "a@b"; se exige además un dominio con punto
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Noches entre dos fechas yyyy-MM-dd (0 si faltan o el rango no es válido). */
function nightsBetween(inicio: string, fin: string): number {
  if (!inicio || !fin) {
    return 0;
  }
  const toUtc = (d: string) => {
    const [y, m, day] = d.slice(0, 10).split('-').map(Number);
    return Date.UTC(y, m - 1, day);
  };
  const nights = Math.round((toUtc(fin) - toUtc(inicio)) / 86_400_000);
  return nights > 0 ? nights : 0;
}

type FormField = 'unidadId' |'fechaInicio' | 'fechaFin' | 'precioTotal' | 'huespedNombre' | 'huespedEmail';

@Component({
  selector: 'app-reservation-form',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './reservation-form.component.html',
  styleUrl: './reservation-form.component.scss'
})
export class ReservationFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly reservationService = inject(ReservationService);
  private readonly toast = inject(ToastService);
  private readonly catalogService = inject(CatalogService);
  private readonly destroyRef = inject(DestroyRef);
  readonly authRoles = inject(AuthRoleService);

  /** Admin/Operador ingresan los datos del huésped; el Cliente reserva a su nombre. */
  readonly registersGuest = this.authRoles.canRegisterGuest;

  /** Reserva a editar; si es null el formulario crea una nueva. */
  readonly reservation = input<Reservation | null>(null);

  readonly saved = output<Reservation>();
  readonly dismissed = output<void>();

  readonly saving = signal(false);
  readonly submitted = signal(false);
  readonly serverError = signal<string | null>(null);

  // Unidades activas con cupos (GET /api/catalog/units?soloDisponibles=true)
  readonly units = signal<Unit[]>([]);
  readonly unitsLoading = signal(true);
  readonly unitsError = signal<string | null>(null);
  readonly typeLabels = UNIT_TYPE_LABELS;

  /** Unidad elegida y noches según las fechas; se actualizan con cada cambio del formulario. */
  readonly selectedUnit = signal<Unit | null>(null);
  readonly nights = signal(0);

  // Clave unidad|llegada|salida usada para recalcular el precio solo cuando cambian esos campos
  private priceKey = '';

  readonly form = this.fb.nonNullable.group(
    {
      unidadId: [null as number | null, Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      precioTotal: [null as number | null, [Validators.required, positiveNumber]],
      huespedNombre: [''],
      huespedEmail: ['']
    },
    { validators: dateRange }
  );

  ngOnInit(): void {
    // Los campos del huésped solo son obligatorios cuando se muestran
    if (this.registersGuest()) {
      const { huespedNombre, huespedEmail } = this.form.controls;
      huespedNombre.setValidators([Validators.required, Validators.maxLength(120)]);
      huespedEmail.setValidators([
        Validators.required,
        Validators.email,
        Validators.pattern(EMAIL_PATTERN),
        Validators.maxLength(254)
      ]);
      huespedNombre.updateValueAndValidity();
      huespedEmail.updateValueAndValidity();
    }

    // Solo el Admin ajusta el precio; para el resto es noches x tarifa
    if (!this.authRoles.canEditPrice()) {
      this.form.controls.precioTotal.disable({ emitEvent: false });
    }

    const r = this.reservation();
    if (r) {
      // Sin emitir eventos: al editar se conserva el precio guardado hasta que cambie unidad o fechas
      this.form.setValue({
        unidadId: r.unidadId ?? null,
        fechaInicio: (r.fechaInicio ?? '').slice(0, 10),
        fechaFin: (r.fechaFin ?? '').slice(0, 10),
        precioTotal: r.precioTotal ?? null,
        huespedNombre: r.huespedNombre ?? '',
        huespedEmail: r.huespedEmail ?? ''
      }, { emitEvent: false });
    }
    this.priceKey = this.currentPriceKey();

    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.onFormChange());
    this.loadUnits();
  }

  loadUnits(): void {
    this.unitsLoading.set(true);
    this.unitsError.set(null);

    this.catalogService.listarUnidades({ soloDisponibles: true }).subscribe({
      next: units => {
        const available = (units ?? []).filter(u => u.activo !== false && u.cuposDisponibles > 0);
        this.units.set(available);
        this.unitsLoading.set(false);
        this.includeCurrentUnit();
        this.syncDerived();
      },
      error: err => {
        console.error('Error al cargar las unidades del catálogo:', err);
        this.unitsError.set(friendlyHttpMessage(err, 'No fue posible cargar las unidades del catálogo.'));
        this.unitsLoading.set(false);
      }
    });
  }

  /** Al editar, la unidad actual puede no tener cupos: se agrega para poder mantenerla. */
  private includeCurrentUnit(): void {
    const id = this.reservation()?.unidadId;
    if (!id || this.units().some(u => u.id === id)) {
      return;
    }
    this.catalogService.obtenerUnidad(id).subscribe({
      next: unit => {
        this.units.update(list => [unit, ...list]);
        this.syncDerived();
      },
      error: err => console.error('No fue posible cargar la unidad de la reserva:', err)
    });
  }

  private onFormChange(): void {
    this.syncDerived();

    const key = this.currentPriceKey();
    if (key === this.priceKey) {
      return;
    }
    this.priceKey = key;

    const unit = this.selectedUnit();
    const nights = this.nights();
    if (unit && nights > 0) {
      this.form.controls.precioTotal.setValue(nights * unit.tarifaNoche, { emitEvent: false });
    }
  }

  private syncDerived(): void {
    const { unidadId, fechaInicio, fechaFin } = this.form.getRawValue();
    this.selectedUnit.set(this.units().find(u => u.id === Number(unidadId)) ?? null);
    this.nights.set(nightsBetween(fechaInicio, fechaFin));
  }

  private currentPriceKey(): string {
    const { unidadId, fechaInicio, fechaFin } = this.form.getRawValue();
    return `${unidadId ?? ''}|${fechaInicio}|${fechaFin}`;
  }

  showError(field: FormField): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || this.submitted());
  }

  get showDateRangeError(): boolean {
    return this.form.hasError('dateRange') && (this.form.controls.fechaFin.touched || this.submitted());
  }

  submit(): void {
    this.submitted.set(true);
    this.serverError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const unit = this.selectedUnit();
    if (!unit) {
      this.serverError.set('Selecciona una unidad del catálogo.');
      return;
    }
    if (!(Number(value.precioTotal) > 0)) {
      this.serverError.set('Elige la unidad y las fechas para calcular el precio.');
      return;
    }
    const body = {
      unidadId: unit.id,
      alojamientoNombre: unit.nombre,
      fechaInicio: value.fechaInicio,
      fechaFin: value.fechaFin,
      precioTotal: Number(value.precioTotal),
      // Cliente: sus datos del token. Admin/Operador: los ingresados en el formulario.
      huespedNombre: this.registersGuest() ? value.huespedNombre.trim() : this.authRoles.userName(),
      huespedEmail: this.registersGuest() ? value.huespedEmail.trim() : this.authRoles.userEmail()
    };
    const editing = this.reservation();
    this.saving.set(true);

    const request$ = editing
      ? this.reservationService.actualizarReserva(editing.id, body)
      : this.reservationService.crearReserva(body);

    request$.subscribe({
      next: reservation => {
        this.saving.set(false);
        this.submitted.set(false);
        this.toast.success(editing ? `Reserva #${editing.id} actualizada.` : 'Reserva creada correctamente.');
        this.saved.emit(reservation);
      },
      error: err => {
        console.error('Error al guardar la reserva:', err);
        this.saving.set(false);
        this.serverError.set(
          friendlyHttpMessage(err, editing ? 'No fue posible actualizar la reserva.' : 'No fue posible crear la reserva.')
        );
      }
    });
  }
}
