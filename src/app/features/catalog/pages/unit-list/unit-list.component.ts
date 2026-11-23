import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthRoleService } from '../../../../core/auth/auth-role.service';
import { CatalogService } from '../../../../core/services/catalog.service';
import { friendlyHttpMessage } from '../../../../core/interceptors/http-error.interceptor';
import { ALL_UNIT_TYPES, UNIT_TYPE_LABELS, Unit, UnitType } from '../../../../core/models/unit.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { UnitFormComponent } from '../../components/unit-form/unit-form.component';
import { UnitImageService } from '../../../../core/services/unit-image.service';
import { UNIT_TYPE_ICONS } from '../../../../core/utils/unit-availability';
import { UnitCardComponent } from '../../../../shared/components/unit-card/unit-card.component';
import { UnitImageComponent } from '../../../../shared/components/unit-image/unit-image.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-unit-list',
  standalone: true,
  imports: [
    RouterLink,
    EmptyStateComponent,
    UnitFormComponent,
    UnitCardComponent,
    UnitImageComponent,
    IconComponent
  ],
  templateUrl: './unit-list.component.html',
  styleUrl: './unit-list.component.scss'
})
export class UnitListComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);
  readonly authRoles = inject(AuthRoleService);

  readonly types = ALL_UNIT_TYPES;
  readonly typeLabels = UNIT_TYPE_LABELS;
  readonly typeIcons = UNIT_TYPE_ICONS;
  readonly hero = inject(UnitImageService).hero(1);
  /** Tarjetas de esqueleto mientras carga. */
  readonly skeletons = [1, 2, 3, 4];

  readonly units = signal<Unit[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly tipo = signal<UnitType | ''>('');
  readonly hostal = signal('');
  readonly soloDisponibles = signal(false);

  /** Hostales vistos en las respuestas, para el selector de filtro. */
  private readonly knownHostales = signal<string[]>([]);
  readonly hostales = computed(() => this.knownHostales());

  readonly formOpen = signal(false);
  /** Unidad en edición; null con el formulario abierto = nueva unidad. */
  readonly editingUnit = signal<Unit | null>(null);
  readonly hasFilters = computed(() => !!this.tipo() || !!this.hostal() || this.soloDisponibles());

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.catalogService.listarUnidades({
      tipo: this.tipo(),
      hostal: this.hostal(),
      soloDisponibles: this.soloDisponibles()
    }).subscribe({
      next: units => {
        this.units.set(units ?? []);
        this.rememberHostales(units ?? []);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error al cargar el catálogo:', err);
        this.error.set(friendlyHttpMessage(err, 'No fue posible cargar el catálogo.'));
        this.loading.set(false);
      }
    });
  }

  setTipo(value: UnitType | ''): void {
    this.tipo.set(value);
    this.load();
  }

  setHostal(value: string): void {
    this.hostal.set(value);
    this.load();
  }

  setSoloDisponibles(value: boolean): void {
    this.soloDisponibles.set(value);
    this.load();
  }

  clearFilters(): void {
    this.tipo.set('');
    this.hostal.set('');
    this.soloDisponibles.set(false);
    this.load();
  }

  openNew(): void {
    this.editingUnit.set(null);
    this.formOpen.set(true);
  }

  openEdit(unit: Unit): void {
    this.editingUnit.set(unit);
    this.formOpen.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingUnit.set(null);
  }

  onFormDone(): void {
    this.closeForm();
    this.load();
  }

  private rememberHostales(units: Unit[]): void {
    const all = new Set([...this.knownHostales(), ...units.map(u => u.hostal).filter(Boolean)]);
    this.knownHostales.set([...all].sort((a, b) => a.localeCompare(b, 'es')));
  }
}
