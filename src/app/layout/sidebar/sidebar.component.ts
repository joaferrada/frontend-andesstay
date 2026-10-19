import { Component, computed, inject, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  AUDIT_PERMISSIONS,
  AuthRoleService,
  CATALOG_PERMISSIONS,
  REPORT_PERMISSIONS,
  RESERVATION_PERMISSIONS
} from '../../core/auth/auth-role.service';
import { UserRole } from '../../core/models/user-role.enum';

interface NavItem {
  label: string;
  icon: 'home' | 'calendar' | 'cabin' | 'chart' | 'shield';
  route: string;
  /** Roles que ven el ítem (los mismos que exige la ruta). Vacío = cualquier usuario autenticado. */
  roles: readonly UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Panel', icon: 'home', route: '/dashboard', roles: [] },
  { label: 'Reservas', icon: 'calendar', route: '/reservations', roles: RESERVATION_PERMISSIONS.view },
  { label: 'Catálogo', icon: 'cabin', route: '/catalog', roles: CATALOG_PERMISSIONS.view },
  { label: 'Reportería', icon: 'chart', route: '/reports', roles: REPORT_PERMISSIONS.view },
  { label: 'Auditoría', icon: 'shield', route: '/audit', roles: AUDIT_PERMISSIONS.view }
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
