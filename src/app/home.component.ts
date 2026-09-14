import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <div style="padding: 20px;">
      <h1>Bienvenido a AndesStay</h1>
      <p>Inicia sesión con Microsoft para acceder a tus reservas.</p>
    </div>
  `
})
export class HomeComponent {}