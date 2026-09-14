import { Routes } from '@angular/router';

import { HomeComponent } from './home.component';
import { ReservationsComponent } from './reservations.component';

import { MsalGuard } from '@azure/msal-angular';

export const routes: Routes = [

  {
    path: '',
    component: HomeComponent
  },

  {
    path: 'reservations',
    component: ReservationsComponent,
    canActivate: [MsalGuard]
  },

  {
    path: '**',
    redirectTo: ''
  }

];