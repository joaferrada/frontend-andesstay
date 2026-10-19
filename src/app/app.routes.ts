import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { roleGuard } from './core/auth/role.guard';
import { entryRedirectGuard, loginPageGuard } from './core/auth/session.guard';
import { ALL_ROLES } from './core/models/user-role.enum';

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
        data: { roles: ALL_ROLES },
        loadComponent: () =>
          import('./features/reservations/pages/reservation-list/reservation-list.component')
            .then(m => m.ReservationListComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
