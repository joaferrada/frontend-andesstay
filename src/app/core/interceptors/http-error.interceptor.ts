import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../shared/components/toast/toast.service';

/** Traduce un error HTTP a un mensaje entendible para el usuario. */
export function friendlyHttpMessage(error: unknown, fallback = 'Ocurrió un error inesperado.'): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  switch (true) {
    case error.status === 0:
      return 'No se pudo conectar con el servidor. Revisa tu conexión e intenta nuevamente.';
    case error.status === 401:
      return 'Tu sesión expiró o no es válida. Inicia sesión nuevamente.';
    case error.status === 403:
      return 'No tienes permisos para esta acción.';
    case error.status === 404:
      return 'El recurso solicitado no existe.';
    case error.status >= 500:
      return 'El servidor tuvo un problema. Intenta nuevamente en unos minutos.';
    default:
      return fallback;
  }
}

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        (error.status === 0 || error.status === 401 || error.status === 403 || error.status >= 500)
      ) {
        toast.error(friendlyHttpMessage(error));
      }
      return throwError(() => error);
    })
  );
};
