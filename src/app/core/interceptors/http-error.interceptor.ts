import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../shared/components/toast/toast.service';
import { AuthRoleService } from '../auth/auth-role.service';

/**
 * Marca una petición opcional cuyo error no debe mostrarse como aviso global
 * (p. ej. el resumen de KPIs en el panel). El 401 sigue iniciando sesión.
 */
export const SILENT_HTTP_ERRORS = new HttpContextToken<boolean>(() => false);

/** Errores que se notifican de forma global; el resto (400, 404, 409) lo maneja cada vista. */
export function isGloballyHandled(error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse)) {
    return false;
  }
  return error.status === 0 || error.status === 401 || error.status === 403 || error.status >= 500;
}

export const FORBIDDEN_MESSAGE = 'No tienes permisos para esta acción.';
export const UNAVAILABLE_MESSAGE = 'Servicio no disponible, intenta más tarde.';

/**
 * Mensaje para el usuario. 403 y 503 usan siempre un texto fijo. En el resto, el backend
 * responde { timestamp, status, error, message }: si trae "message" se usa tal cual;
 * si no, un texto genérico según el código.
 */
export function friendlyHttpMessage(error: unknown, fallback = 'Ocurrió un error inesperado.'): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  if (error.status === 403) {
    return FORBIDDEN_MESSAGE;
  }
  if (error.status === 503) {
    return UNAVAILABLE_MESSAGE;
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
    case error.status === 404:
      return 'No se encontró lo solicitado o no tienes acceso a ello.';
    case error.status === 409:
      return 'La operación no está permitida en el estado actual.';
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
        if (!req.context.get(SILENT_HTTP_ERRORS)) {
          toast.error(friendlyHttpMessage(error));
        }

        // 401: sesión inválida -> login de MSAL. 403: sin permiso, la sesión se mantiene.
        if (error instanceof HttpErrorResponse && error.status === 401 && shouldRedirectToLogin()) {
          authRoles.login();
        }
      }
      return throwError(() => error);
    })
  );
};
