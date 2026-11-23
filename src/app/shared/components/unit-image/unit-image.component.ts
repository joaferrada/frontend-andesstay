import { Component, booleanAttribute, input, linkedSignal } from '@angular/core';

type LoadState = 'loading' | 'loaded' | 'error';

/**
 * Foto de un alojamiento con proporción fija, carga diferida, esqueleto mientras carga
 * y una ilustración de montañas si la imagen no está disponible.
 */
@Component({
  selector: 'app-unit-image',
  standalone: true,
  templateUrl: './unit-image.component.html',
  styleUrl: './unit-image.component.scss',
  host: {
    '[class.unit-image--fill]': 'fill()',
    '[style.aspect-ratio]': 'fill() ? null : ratio()'
  }
})
export class UnitImageComponent {
  readonly src = input.required<string>();
  readonly alt = input.required<string>();
  /** Proporción CSS (ancho / alto). Se ignora con fill. */
  readonly ratio = input('3 / 2');
  /** Ocupa todo el contenedor posicionado (portadas). */
  readonly fill = input(false, { transform: booleanAttribute });
  /** Imágenes visibles al cargar la página (portadas): sin lazy y con prioridad alta. */
  readonly priority = input(false, { transform: booleanAttribute });

  /** Vuelve a 'loading' cada vez que cambia la foto (p. ej. al elegir otra unidad). */
  readonly state = linkedSignal<string, LoadState>({
    source: this.src,
    computation: () => 'loading'
  });

  onLoad(): void {
    this.state.set('loaded');
  }

  onError(): void {
    this.state.set('error');
  }
}
