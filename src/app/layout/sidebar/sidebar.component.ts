import { Component, computed, inject, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthRoleService } from '../../core/auth/auth-role.service';
import { ALL_ROLES, UserRole } from '../../core/models/user-role.enum';

interface NavItem {
  label: string;
  icon: 'home' | 'calendar' | 'cabin' | 'chart' | 'shield';
  route?: string;
  /** Roles que ven el ítem. Vacío = cualquier usuario autenticado. */
  roles: UserRole[];
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Panel', icon: 'home', route: '/dashboard', roles: [] },
  { label: 'Reservas', icon: 'calendar', route: '/reservations', roles: ALL_ROLES },
  { label: 'Alojamientos', icon: 'cabin', roles: [UserRole.Admin, UserRole.Operador], disabled: true },
  { label: 'Reportes', icon: 'chart', roles: [UserRole.Admin, UserRole.Auditor], disabled: true },
  { label: 'Auditoría', icon: 'shield', roles: [UserRole.Admin, UserRole.Auditor], disabled: true }
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private readonly authRoles = inject(AuthRoleService);

  readonly open = input(false);
  readonly navigate = output<void>();

  readonly items = computed(() => {
    // Se recalcula cuando cambian los roles de la cuenta activa
    this.authRoles.roles();
    return NAV_ITEMS.filter(item => item.roles.length === 0 || this.authRoles.hasAnyRole(item.roles));
  });
}
