import { Component, ElementRef, effect, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss'
})
export class ConfirmDialogComponent {
  readonly open = input(false);
  readonly title = input('Confirmar acción');
  readonly message = input('');
  readonly confirmText = input('Confirmar');
  readonly cancelText = input('Volver');
  readonly danger = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const el = this.dialog()?.nativeElement;
      if (!el) {
        return;
      }
      if (this.open() && !el.open) {
        el.showModal();
      } else if (!this.open() && el.open) {
        el.close();
      }
    });
  }

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(event?: Event): void {
    // Evita que <dialog> se cierre por su cuenta con Escape; el padre controla "open".
    event?.preventDefault();
    this.cancelled.emit();
  }
}
