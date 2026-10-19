import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../shared/components/toast/toast.service';
import { AuthRoleService } from '../auth/auth-role.service';

/** Errores que se notifican de forma global; el resto (400, 404, 409) lo maneja cada vista. */
export function isGloballyHandled(error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse)) {
    return false;
  }
  return error.status === 0 || error.status === 401 || error.status === 403 || error.status >= 500;
}

/**
 * Mensaje para el usuario. El backend responde { timestamp, status, error, message }:
 * si trae "message" se usa tal cual; si no, un texto genérico según el código.
 */
export function friendlyHttpMessage(error: unknown, fallback = 'Ocurrió un error inesperado.'): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  const backendMessage = (error.error as { message?: unknown } | null)?.message;
  if (typeof backendMessage === 'string' && backendMessage.trim()) {
    return backendMessage;
  }

  switch (true) {
    case error.status === 0:
      return 'No se pudo conectar con el servidor. Revisa tu conexión e intenta nuevamente.';
    case error.status === 400:
      return 'Los datos enviados no son válidos.';
    case error.status === 401:
      return 'Tu sesión expiró o no es válida. Inicia sesión nuevamente.';
    case error.status === 403:
      return 'No tienes permisos para esta acción.';
    case error.status === 404:
      return 'La reserva no existe o no tienes acceso a ella.';
    case error.status === 409:
      return 'La operación no está permitida para el estado actual de la reserva.';
    case error.status >= 500:
      return 'El servidor tuvo un problema. Intenta nuevamente en unos minutos.';
    default:
      return fallback;
  }
}

// Evita un ciclo de redirecciones si el backend sigue respondiendo 401 tras volver a iniciar sesión
const LOGIN_RETRY_KEY = 'andesstay.401-login-at';
const LOGIN_RETRY_WINDOW_MS = 60_000;

function shouldRedirectToLogin(): boolean {
  try {
    const last = Number(sessionStorage.getItem(LOGIN_RETRY_KEY) ?? 0);
    if (Date.now() - last < LOGIN_RETRY_WINDOW_MS) {
      return false;
    }
    sessionStorage.setItem(LOGIN_RETRY_KEY, String(Date.now()));
  } catch {
    // sessionStorage no disponible: se intenta igual
  }
  return true;
}

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const authRoles = inject(AuthRoleService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (isGloballyHandled(error)) {
        toast.error(friendlyHttpMessage(error));

        // 401: sesión inválida -> login de MSAL. 403: sin permiso, la sesión se mantiene.
        if (error instanceof HttpErrorResponse && error.status === 401 && shouldRedirectToLogin()) {
          authRoles.login();
        }
      }
      return throwError(() => error);
    })
  );
};
