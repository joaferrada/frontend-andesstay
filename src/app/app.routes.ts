import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { roleGuard } from './core/auth/role.guard';
import { entryRedirectGuard, loginPageGuard } from './core/auth/session.guard';
import { CATALOG_PERMISSIONS, RESERVATION_PERMISSIONS } from './core/auth/auth-role.service';

export const routes: Routes = [
  {
    // Ruta vacía: dashboard si hay sesión, login si no
    path: '',
    pathMatch: 'full',
    canActivate: [entryRedirectGuard],
    children: []
  },
  {
    path: 'login',
    title: 'Iniciar sesión | AndesStay',
    canActivate: [loginPageGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    // Layout autenticado; cada ruta hija valida sesión (MsalGuard) y rol (roleGuard)
    path: '',
    loadComponent: () =>
      import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        title: 'Panel | AndesStay',
        canActivate: [MsalGuard, roleGuard],
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'reservations',
        title: 'Reservas | AndesStay',
        canActivate: [MsalGuard, roleGuard],
        data: { roles: RESERVATION_PERMISSIONS.view },
        loadComponent: () =>
          import('./features/reservations/pages/reservation-list/reservation-list.component')
            .then(m => m.ReservationListComponent)
      },
      {
        // Admin, Operador_Dominio, Cliente_Dominio
        path: 'reservations/new',
        title: 'Nueva reserva | AndesStay',
        canActivate: [MsalGuard, roleGuard],
        data: { roles: RESERVATION_PERMISSIONS.create },
        loadComponent: () =>
          import('./features/reservations/pages/reservation-editor/reservation-editor.component')
            .then(m => m.ReservationEditorComponent)
      },
      {
        // Admin, Operador_Dominio, Cliente_Dominio (el backend responde 404 si no es suya)
        path: 'reservations/:id/edit',
        title: 'Editar reserva | AndesStay',
        canActivate: [MsalGuard, roleGuard],
        data: { roles: RESERVATION_PERMISSIONS.edit },
        loadComponent: () =>
          import('./features/reservations/pages/reservation-editor/reservation-editor.component')
            .then(m => m.ReservationEditorComponent)
      },
      {
        path: 'catalog',
        title: 'Catálogo | AndesStay',
        canActivate: [MsalGuard, roleGuard],
        data: { roles: CATALOG_PERMISSIONS.view },
        loadComponent: () =>
          import('./features/catalog/pages/unit-list/unit-list.component').then(m => m.UnitListComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
