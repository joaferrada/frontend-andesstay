import { Component, OnInit, inject, input, output, signal } from '@angular/core';
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
export class ReservationFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly reservationService = inject(ReservationService);
  private readonly toast = inject(ToastService);

  /** Reserva a editar; si es null el formulario crea una nueva. */
  readonly reservation = input<Reservation | null>(null);

  readonly saved = output<Reservation>();
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

  ngOnInit(): void {
    const r = this.reservation();
    if (r) {
      this.form.setValue({
        alojamientoNombre: r.alojamientoNombre ?? '',
        fechaInicio: (r.fechaInicio ?? '').slice(0, 10),
        fechaFin: (r.fechaFin ?? '').slice(0, 10),
        precioTotal: r.precioTotal ?? null
      });
    }
  }

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
    const body = {
      alojamientoNombre: value.alojamientoNombre.trim(),
      fechaInicio: value.fechaInicio,
      fechaFin: value.fechaFin,
      precioTotal: Number(value.precioTotal)
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
