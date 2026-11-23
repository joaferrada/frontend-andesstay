import { Component, input } from '@angular/core';

export type IconName =
  | 'map-pin'
  | 'users'
  | 'bed'
  | 'cabin'
  | 'lodge'
  | 'dome'
  | 'calendar'
  | 'calendar-plus'
  | 'moon'
  | 'home'
  | 'chart'
  | 'shield'
  | 'plus'
  | 'pencil'
  | 'arrow-right'
  | 'mountain'
  | 'check'
  | 'sparkles';

/** Ícono SVG de trazo, decorativo (aria-hidden). El texto accesible va en el elemento que lo contiene. */
@Component({
  selector: 'app-icon',
  standalone: true,
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss'
})
export class IconComponent {
  readonly name = input.required<IconName>();
}
