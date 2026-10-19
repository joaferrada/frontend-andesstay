import { Component, inject, signal } from '@angular/core';
import { AuthRoleService } from '../../../core/auth/auth-role.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly authRoles = inject(AuthRoleService);

  readonly redirecting = signal(false);

  login(): void {
    this.redirecting.set(true);
    this.authRoles.login();
  }
}
