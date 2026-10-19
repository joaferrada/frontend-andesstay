import { Injectable, computed, signal } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';
import { environment } from '../../../enviroments/enviroment';
import { ALL_ROLES, UserRole } from '../models/user-role.enum';

/**
 * Matriz de permisos de reservas (el backend responde 403 si no se cumple).
 * Única fuente de verdad: la usan AuthRoleService y app.routes.ts.
 */
export const RESERVATION_PERMISSIONS = {
  view: ALL_ROLES,
  create: [UserRole.Admin, UserRole.Operador, UserRole.Cliente],
  edit: [UserRole.Admin, UserRole.Operador, UserRole.Cliente],
  changeStatus: [UserRole.Admin, UserRole.Operador],
  delete: [UserRole.Admin],
  // El Cliente reserva a su nombre (datos del token); Admin y recepción ingresan los del huésped
  registerGuest: [UserRole.Admin, UserRole.Operador]
} as const satisfies Record<string, readonly UserRole[]>;

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

  private readonly claims = computed(() =>
    (this.account()?.idTokenClaims ?? {}) as { name?: unknown; upn?: unknown; preferred_username?: unknown }
  );

  /** Claim "name" del id token. */
  readonly userName = computed<string>(() => {
    const name = this.claims().name;
    return (typeof name === 'string' && name) || this.account()?.name || this.userEmail();
  });

  /** Claim "upn" o, si no viene, "preferred_username" del id token. */
  readonly userEmail = computed<string>(() => {
    const { upn, preferred_username } = this.claims();
    return (
      (typeof upn === 'string' && upn) ||
      (typeof preferred_username === 'string' && preferred_username) ||
      this.account()?.username ||
      ''
    );
  });

  // Permisos de reservas. Cliente_Dominio solo edita las suyas: el backend solo le devuelve esas.
  readonly canView = computed(() => this.hasAnyRole(RESERVATION_PERMISSIONS.view));
  readonly canCreate = computed(() => this.hasAnyRole(RESERVATION_PERMISSIONS.create));
  readonly canEdit = computed(() => this.hasAnyRole(RESERVATION_PERMISSIONS.edit));
  readonly canChangeStatus = computed(() => this.hasAnyRole(RESERVATION_PERMISSIONS.changeStatus));
  readonly canDelete = computed(() => this.hasAnyRole(RESERVATION_PERMISSIONS.delete));
  /** Reserva a nombre de otra persona (ingresa nombre y correo del huésped). */
  readonly canRegisterGuest = computed(() => this.hasAnyRole(RESERVATION_PERMISSIONS.registerGuest));
  /** Sin ninguna acción disponible (Auditor). */
  readonly isReadOnly = computed(() =>
    !this.canCreate() && !this.canEdit() && !this.canChangeStatus() && !this.canDelete()
  );

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

  hasAnyRole(roles: readonly UserRole[]): boolean {
    return roles.some(r => this.hasRole(r));
  }

  login(): void {
    this.msalService.loginRedirect({
      scopes: environment.apiConfig.scopes
    }).subscribe({
      // p. ej. interaction_in_progress si ya hay un login en curso
      error: error => console.error('No fue posible iniciar sesión con Microsoft:', error)
    });
  }

  logout(): void {
    this.msalService.logoutRedirect({
      postLogoutRedirectUri: environment.msalConfig.auth.redirectUri
    });
  }
}
