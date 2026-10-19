import { ApplicationConfig, APP_INITIALIZER, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import {
  provideHttpClient,
  withInterceptorsFromDi,
  withInterceptors,
  HTTP_INTERCEPTORS
} from '@angular/common/http';
import { httpErrorInterceptor } from './core/interceptors/http-error.interceptor';

import {
  InteractionType,
  IPublicClientApplication,
  PublicClientApplication
} from '@azure/msal-browser';

import {
  MsalGuard,
  MsalInterceptor,
  MsalService,
  MsalBroadcastService,
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG,
  MSAL_GUARD_CONFIG
} from '@azure/msal-angular';

import { environment } from '../enviroments/enviroment';


export function MSALInstanceFactory(): IPublicClientApplication {

  return new PublicClientApplication({

    auth: {
      clientId: environment.msalConfig.auth.clientId,
      authority: environment.msalConfig.auth.authority,
      redirectUri: environment.msalConfig.auth.redirectUri
    },

    cache: {
      cacheLocation: 'localStorage'
    }

  });

}


export function MSALInitializerFactory(
  msalInstance: IPublicClientApplication
) {

  return () => msalInstance.initialize();

}


export function MSALInterceptorConfigFactory() {
  const protectedResourceMap =
    new Map<string, Array<string>>();

  // Producción: <API Gateway>/api/* · Desarrollo (uri vacío): /api/* relativo, que MSAL resuelve
  // contra el origen de la página. El comodín cubre también /api/reservations/{id} y /status.
  protectedResourceMap.set(
    `${environment.apiConfig.uri}/api/*`,
    environment.apiConfig.scopes
  );

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
  };
}


export function MSALGuardConfigFactory() {

  return {

    interactionType: InteractionType.Redirect,

    authRequest: {
      scopes: environment.apiConfig.scopes
    }

  };

}


export const appConfig: ApplicationConfig = {

  providers: [

    provideRouter(routes),

    { provide: LOCALE_ID, useValue: 'es-CL' },

    provideHttpClient(
      withInterceptorsFromDi(),
      withInterceptors([httpErrorInterceptor])
    ),

    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    },

    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory
    },

    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory
    },

    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: MSALGuardConfigFactory
    },

    {
      provide: APP_INITIALIZER,
      useFactory: MSALInitializerFactory,
      deps: [MSAL_INSTANCE],
      multi: true
    },

    MsalService,
    MsalGuard,
    MsalBroadcastService

  ]

};