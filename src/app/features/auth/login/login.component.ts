import { Component, inject, signal } from '@angular/core';
import { AuthRoleService } from '../../../core/auth/auth-role.service';
import { UnitImageService } from '../../../core/services/unit-image.service';
import { UnitImageComponent } from '../../../shared/components/unit-image/unit-image.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [UnitImageComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly authRoles = inject(AuthRoleService);

  /** Torres del Paine como portada. */
  readonly hero = inject(UnitImageService).hero(0);
  readonly redirecting = signal(false);

  login(): void {
    this.redirecting.set(true);
    this.authRoles.login();
  }
}
