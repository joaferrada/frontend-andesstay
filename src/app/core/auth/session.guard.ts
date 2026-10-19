import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { AuthRoleService } from './auth-role.service';

/**
 * Procesa una posible respuesta de login por redirect y devuelve si hay sesión.
 * handleRedirectPromise es idempotente, por lo que puede llamarse desde varios puntos.
 */
async function hasSession(): Promise<boolean> {
  const msal = inject(MsalService);
  const authRoles = inject(AuthRoleService);

  try {
    const result = await msal.instance.handleRedirectPromise();
    if (result?.account) {
      msal.instance.setActiveAccount(result.account);
    }
  } catch (error) {
    console.error('Error procesando redirect de MSAL:', error);
  }

  authRoles.refresh();
  return authRoles.isAuthenticated();
}

/** Ruta vacía: envía al dashboard si hay sesión y al login si no. */
export const entryRedirectGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const loggedIn = await hasSession();
  return router.createUrlTree([loggedIn ? '/dashboard' : '/login']);
};

/** Pantalla de login: si ya hay sesión, no tiene sentido mostrarla. */
export const loginPageGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const loggedIn = await hasSession();
  return loggedIn ? router.createUrlTree(['/dashboard']) : true;
};
