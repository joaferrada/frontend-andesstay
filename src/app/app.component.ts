import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { AuthenticationResult } from '@azure/msal-browser';
import { environment } from '../enviroments/enviroment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div style="font-family: sans-serif; padding: 20px;">

      <nav style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #ccc;
        padding-bottom: 10px;
      ">
        <h2>AndesStay - BarrioDigital</h2>

        <button
          *ngIf="!loggedIn"
          (click)="login()"
          style="padding: 10px; cursor: pointer;">
          Iniciar Sesión con Microsoft
        </button>

        <button
          *ngIf="loggedIn"
          (click)="logout()"
          style="padding: 10px; cursor: pointer;">
          Cerrar Sesión
        </button>
      </nav>

      <main style="margin-top: 20px;">

        <div *ngIf="loggedIn">
          <h3 style="color: green;">
            ¡Autenticación exitosa!
          </h3>

          <p>
            Usuario autenticado correctamente con Microsoft Entra ID.
          </p>
        </div>

        <router-outlet></router-outlet>

      </main>

    </div>
  `
})
export class AppComponent implements OnInit {

  loggedIn = false;

  constructor(
    private authService: MsalService,
    private router: Router
  ) {}

  ngOnInit(): void {

    this.authService.instance
      .handleRedirectPromise()
      .then((response: AuthenticationResult | null) => {

        if (response?.account) {

          this.authService.instance.setActiveAccount(response.account);

          console.log('LOGIN CORRECTO');
          console.log('Account:', response.account);

          this.loggedIn = true;

          // Después del login vamos a reservas
          this.router.navigate(['/reservations']);

          return;
        }

        this.checkAccount();

      })
      .catch((error) => {

        console.error('Error procesando redirect de MSAL:', error);

        this.checkAccount();

      });
  }

  checkAccount(): void {

    const accounts =
      this.authService.instance.getAllAccounts();

    this.loggedIn = accounts.length > 0;

    if (
      accounts.length > 0 &&
      !this.authService.instance.getActiveAccount()
    ) {
      this.authService.instance.setActiveAccount(accounts[0]);
    }

    console.log('Cuentas MSAL:', accounts);
  }

  login(): void {

    console.log('Iniciando login con Microsoft Entra ID...');

    this.authService.loginRedirect({
      scopes: environment.apiConfig.scopes
    });
  }

  logout(): void {

    this.authService.logoutRedirect({
      postLogoutRedirectUri:
        'https://joaferrada.github.io/frontend-andesstay/'
    });
  }
}