import { Component, computed, inject, input, output } from '@angular/core';
import { AuthRoleService } from '../../core/auth/auth-role.service';
import { ROLE_LABELS, UserRole } from '../../core/models/user-role.enum';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  readonly authRoles = inject(AuthRoleService);

  readonly menuOpen = input(false);
  readonly toggleMenu = output<void>();

  readonly roleChips = computed(() =>
    this.authRoles.roles().map(role => ({
      value: role,
      label: ROLE_LABELS[role as UserRole] ?? role
    }))
  );

  logout(): void {
    this.authRoles.logout();
  }
}
