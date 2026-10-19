import { Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { CatalogService } from '../../../../core/services/catalog.service';
import { friendlyHttpMessage } from '../../../../core/interceptors/http-error.interceptor';
import { ALL_UNIT_TYPES, UNIT_TYPE_LABELS, Unit, UnitPayload, UnitType } from '../../../../core/models/unit.model';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

const positive: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (value === null || value === '' || value === undefined) {
    return null;
  }
  return Number(value) > 0 ? null : { positive: true };
};

const cuposRange: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const totales = group.get('cuposTotales')?.value;
  const disponibles = group.get('cuposDisponibles')?.value;
  if (totales === null || disponibles === null || totales === '' || disponibles === '') {
    return null;
  }
  return Number(disponibles) <= Number(totales) ? null : { cuposRange: true };
};

type UnitField = 'nombre' | 'tipo' | 'hostal' | 'ubicacion' | 'capacidad' | 'tarifaNoche' | 'cuposTotales' | 'cuposDisponibles';

/** Crear o editar una unidad del catálogo (solo Admin). */
@Component({
  selector: 'app-unit-form',
  standalone: true,
  imports: [ReactiveFormsModule, ConfirmDialogComponent],
  templateUrl: './unit-form.component.html',
  styleUrl: './unit-form.component.scss'
})
export class UnitFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly catalogService = inject(CatalogService);
  private readonly toast = inject(ToastService);

  /** Unidad a editar; null = nueva. */
  readonly unit = input<Unit | null>(null);

  readonly saved = output<Unit>();
  readonly removed = output<Unit>();
  readonly dismissed = output<void>();

  readonly types = ALL_UNIT_TYPES;
  readonly typeLabels = UNIT_TYPE_LABELS;

  readonly saving = signal(false);
  readonly submitted = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly confirmingRemoval = signal(false);

  readonly form = this.fb.group(
    {
      nombre: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(120)]),
      tipo: this.fb.control<UnitType | ''>('', Validators.required),
      hostal: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(120)]),
      ubicacion: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(160)]),
      capacidad: this.fb.control<number | null>(null, [Validators.required, positive, Validators.pattern(/^\d+$/)]),
      tarifaNoche: this.fb.control<number | null>(null, [Validators.required, positive]),
      cuposTotales: this.fb.control<number | null>(null, [Validators.required, positive, Validators.pattern(/^\d+$/)]),
      cuposDisponibles: this.fb.control<number | null>(null, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]),
      activo: this.fb.nonNullable.control(true)
    },
    { validators: cuposRange }
  );

  constructor() {
    // Si se elige otra unidad con el formulario abierto, se recargan sus datos
    effect(() => {
      const unit = this.unit();
      untracked(() => this.fill(unit));
    });
  }

  private fill(u: Unit | null): void {
    this.submitted.set(false);
    this.serverError.set(null);
    if (!u) {
      this.form.reset({ nombre: '', tipo: '', hostal: '', ubicacion: '', capacidad: null, tarifaNoche: null,
        cuposTotales: null, cuposDisponibles: null, activo: true });
    } else {
      this.form.setValue({
        nombre: u.nombre ?? '',
        tipo: u.tipo ?? '',
        hostal: u.hostal ?? '',
        ubicacion: u.ubicacion ?? '',
        capacidad: u.capacidad ?? null,
        tarifaNoche: u.tarifaNoche ?? null,
        cuposTotales: u.cuposTotales ?? null,
        cuposDisponibles: u.cuposDisponibles ?? null,
        activo: u.activo ?? true
      });
    }
  }

  showError(field: UnitField): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || this.submitted());
  }

  get showCuposError(): boolean {
    return this.form.hasError('cuposRange') && (this.form.controls.cuposDisponibles.touched || this.submitted());
  }

  submit(): void {
    this.submitted.set(true);
    this.serverError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const payload: UnitPayload = {
      nombre: v.nombre.trim(),
      tipo: v.tipo as UnitType,
      hostal: v.hostal.trim(),
      ubicacion: v.ubicacion.trim(),
      capacidad: Number(v.capacidad),
      tarifaNoche: Number(v.tarifaNoche),
      cuposTotales: Number(v.cuposTotales),
      cuposDisponibles: Number(v.cuposDisponibles),
      activo: v.activo
    };
    const editing = this.unit();
    this.saving.set(true);

    const request$ = editing
      ? this.catalogService.actualizarUnidad(editing.id, payload)
      : this.catalogService.crearUnidad(payload);

    request$.subscribe({
      next: unit => {
        this.saving.set(false);
        this.toast.success(editing ? `Unidad «${payload.nombre}» actualizada.` : `Unidad «${payload.nombre}» creada.`);
        this.saved.emit(unit);
      },
      error: err => {
        console.error('Error al guardar la unidad:', err);
        this.saving.set(false);
        this.serverError.set(friendlyHttpMessage(err, 'No fue posible guardar la unidad.'));
      }
    });
  }

  confirmRemoval(): void {
    const unit = this.unit();
    this.confirmingRemoval.set(false);
    if (!unit) {
      return;
    }

    this.saving.set(true);
    this.catalogService.darDeBaja(unit.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(`Unidad «${unit.nombre}» dada de baja.`);
        this.removed.emit(unit);
      },
      error: err => {
        console.error('Error al dar de baja la unidad:', err);
        this.saving.set(false);
        this.serverError.set(friendlyHttpMessage(err, 'No fue posible dar de baja la unidad.'));
      }
    });
  }
}
