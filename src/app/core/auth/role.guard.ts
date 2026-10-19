import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthRoleService } from './auth-role.service';
import { UserRole } from '../models/user-role.enum';
import { ToastService } from '../../shared/components/toast/toast.service';

/**
 * Permite el acceso solo si el usuario tiene alguno de los roles indicados en data.roles.
 * Si la ruta no define data.roles, basta con estar autenticado (lo valida MsalGuard).
 */
export const roleGuard: CanActivateFn = (route) => {
  const authRoles = inject(AuthRoleService);
  const router = inject(Router);
  const toast = inject(ToastService);

  authRoles.refresh();

  const allowed = route.data?.['roles'] as UserRole[] | undefined;
  if (!allowed || allowed.length === 0 || authRoles.hasAnyRole(allowed)) {
    return true;
  }

  toast.error('No tienes permisos para acceder a esta sección.');
  return router.createUrlTree(['/dashboard']);
};
