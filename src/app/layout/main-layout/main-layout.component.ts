import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RolUsuario } from '../../core/models/enums';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  roles?: RolUsuario[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  styleUrls: ['./main-layout.component.css'],
  templateUrl: './main-layout.component.html'
})
export class MainLayoutComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  menu: MenuItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: '📊' },
    { label: 'Solicitudes', route: '/solicitudes', icon: '📋' },
    { label: 'Nueva solicitud', route: '/solicitudes/nueva', icon: '➕', roles: ['ESTUDIANTE', 'ADMINISTRATIVO', 'COORDINADOR'] },
    { label: 'Responsables', route: '/responsables', icon: '👥', roles: ['ADMINISTRATIVO', 'COORDINADOR', 'CONSULTOR'] }
  ];

  visibleItems(): MenuItem[] {
    return this.menu.filter(item => !item.roles || this.auth.hasAnyRole(item.roles));
  }

  logout(): void {
    this.auth.logout();
  }

  userInitials(): string {
    const name = this.auth.currentUser?.nombreCompleto || this.auth.currentUser?.username || 'U';
    return name.split(' ').slice(0, 2).map(part => part[0]).join('').toUpperCase();
  }
}
