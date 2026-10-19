import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { AuthRoleService } from './core/auth/auth-role.service';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private readonly msalService = inject(MsalService);
  private readonly authRoles = inject(AuthRoleService);

  ngOnInit(): void {
    this.msalService.instance
      .handleRedirectPromise()
      .then(response => {
        if (response?.account) {
          this.msalService.instance.setActiveAccount(response.account);
        }
        this.authRoles.refresh();
      })
      .catch(error => {
        console.error('Error procesando redirect de MSAL:', error);
        this.authRoles.refresh();
      });
  }
}
