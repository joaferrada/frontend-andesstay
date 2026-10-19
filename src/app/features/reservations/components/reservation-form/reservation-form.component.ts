import { Component, inject, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { ReservationService } from '../../../../core/services/reservation.service';
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

@Component({
  selector: 'app-reservation-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './reservation-form.component.html',
  styleUrl: './reservation-form.component.scss'
})
export class ReservationFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly reservationService = inject(ReservationService);
  private readonly toast = inject(ToastService);

  readonly created = output<Reservation>();
  readonly dismissed = output<void>();

  readonly saving = signal(false);
  readonly submitted = signal(false);
  readonly serverError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group(
    {
      alojamientoNombre: ['', [Validators.required, Validators.maxLength(120)]],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      precioTotal: [null as number | null, [Validators.required, positiveNumber]]
    },
    { validators: dateRange }
  );

  showError(field: 'alojamientoNombre' | 'fechaInicio' | 'fechaFin' | 'precioTotal'): boolean {
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
    this.saving.set(true);

    this.reservationService.crearReserva({
      alojamientoNombre: value.alojamientoNombre.trim(),
      fechaInicio: value.fechaInicio,
      fechaFin: value.fechaFin,
      precioTotal: Number(value.precioTotal)
    }).subscribe({
      next: reservation => {
        this.saving.set(false);
        this.submitted.set(false);
        this.form.reset();
        this.toast.success('Reserva creada correctamente.');
        this.created.emit(reservation);
      },
      error: err => {
        console.error('Error al crear la reserva:', err);
        this.saving.set(false);
        this.serverError.set(friendlyHttpMessage(err, 'No fue posible crear la reserva.'));
      }
    });
  }
}
