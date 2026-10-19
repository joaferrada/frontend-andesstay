import { Injectable, computed, signal } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';
import { environment } from '../../../enviroments/enviroment';
import { UserRole } from '../models/user-role.enum';

@Injectable({
  providedIn: 'root'
})
export class AuthRoleService {

  private readonly account = signal<AccountInfo | null>(null);

  readonly isAuthenticated = computed(() => this.account() !== null);

  readonly roles = computed<string[]>(() => {
    const claims = this.account()?.idTokenClaims as { roles?: unknown } | undefined;
    return Array.isArray(claims?.roles) ? (claims!.roles as string[]) : [];
  });

  readonly userName = computed<string>(() => {
    const acc = this.account();
    return acc?.name || acc?.username || '';
  });

  readonly userEmail = computed<string>(() => this.account()?.username ?? '');

  constructor(private msalService: MsalService) {
    this.refresh();
  }

  /** Vuelve a leer la cuenta activa de MSAL (y la fija si aún no hay una). */
  refresh(): void {
    const instance = this.msalService.instance;
    let active = instance.getActiveAccount();

    if (!active) {
      const accounts = instance.getAllAccounts();
      if (accounts.length > 0) {
        instance.setActiveAccount(accounts[0]);
        active = accounts[0];
      }
    }

    this.account.set(active);
  }

  hasRole(role: UserRole): boolean {
    return this.roles().includes(role);
  }

  hasAnyRole(roles: UserRole[]): boolean {
    return roles.some(r => this.hasRole(r));
  }

  login(): void {
    this.msalService.loginRedirect({
      scopes: environment.apiConfig.scopes
    });
  }

  logout(): void {
    this.msalService.logoutRedirect({
      postLogoutRedirectUri: environment.msalConfig.auth.redirectUri
    });
  }
}
