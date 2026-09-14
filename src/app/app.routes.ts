import { Routes } from '@angular/router';
import { ReservationsComponent } from './reservations.component';
import { MsalGuard } from '@azure/msal-angular';
import { HomeComponent } from './home.component';

export const routes: Routes = [

  {
    path: 'reservations',
    component: ReservationsComponent,
    canActivate: [MsalGuard]
  },

  {
    path: '',
    pathMatch: 'full',
    component: HomeComponent
  },

  {
    path: '**',
    redirectTo: ''
  }

];