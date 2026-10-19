export const environment = {
  production: false,
  msalConfig: {
    auth: {
      clientId: 'b32eb050-21b6-433a-809b-00b4f21cb5e2',
      authority: 'https://login.microsoftonline.com/524de923-14d5-4e21-bbbf-525ca2e1ced7/', 
      redirectUri: 'https://joaferrada.github.io/frontend-andesstay/'
    }
  },
  apiConfig: {
    scopes: ['api://b32eb050-21b6-433a-809b-00b4f21cb5e2/access_as_user'],
    uri: 'https://oa3syj8vc0.execute-api.us-east-1.amazonaws.com'
  }
};

import { Component, OnInit, OnDestroy } from '@angular/core';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { EventMessage, EventType, AuthenticationResult } from '@azure/msal-browser';
import { filter, Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div style="font-family: sans-serif; padding: 20px;">
      <nav style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ccc; padding-bottom: 10px;">
        <h2>AndesStay - BarrioDigital</h2>
        <button *ngIf="!loggedIn" (click)="login()" style="padding: 10px; cursor: pointer;">Iniciar Sesión con Microsoft</button>
        <button *ngIf="loggedIn" (click)="logout()" style="padding: 10px; cursor: pointer;">Cerrar Sesión</button>
      </nav>
      <main style="margin-top: 20px;">
        <div *ngIf="loggedIn">
          <h3 style="color: green;">¡Autenticación exitosa!</h3>
          <p>Revisa la consola del navegador (F12) para ver tu Access Token.</p>
        </div>
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class AppComponent implements OnInit, OnDestroy {
  loggedIn = false;
  private readonly _destroying$ = new Subject<void>();

  constructor(
    private authService: MsalService,
    private broadcastService: MsalBroadcastService
  ) {}

  ngOnInit(): void {
    this.broadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS),
        takeUntil(this._destroying$)
      )
      .subscribe((result: EventMessage) => {
        const payload = result.payload as AuthenticationResult;
        this.authService.instance.setActiveAccount(payload.account);
        console.log('Access Token:', payload.accessToken);
        this.checkAccount();
      });

    this.checkAccount();
  }

  checkAccount() {
    this.loggedIn = this.authService.instance.getAllAccounts().length > 0;
  }

  login() {
    this.authService.loginPopup().subscribe({
      error: (error) => console.error('Error en login:', error)
    });
  }

  logout() {
    this.authService.logoutPopup({
      mainWindowRedirectUri: "/"
    });
  }

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }
}
