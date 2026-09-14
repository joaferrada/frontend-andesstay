import { Routes } from '@angular/router';
import { ReservationsComponent } from './reservations.component';
import { MsalGuard } from '@azure/msal-angular';

export const routes: Routes = [
  { 
    path: 'reservations', 
    component: ReservationsComponent,
    canActivate: [MsalGuard] 
  },
  { 
    path: '', 
    redirectTo: '/reservations', 
    pathMatch: 'full' 
  },
  { 
    path: '**', 
    redirectTo: '' 
  }
];