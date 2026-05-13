import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'solicitudes',
        loadComponent: () => import('./features/solicitudes/solicitud-list/solicitud-list.component').then(m => m.SolicitudListComponent)
      },
      {
        path: 'solicitudes/nueva',
        data: { roles: ['ESTUDIANTE', 'ADMINISTRATIVO', 'COORDINADOR'] },
        canActivate: [roleGuard],
        loadComponent: () => import('./features/solicitudes/solicitud-create/solicitud-create.component').then(m => m.SolicitudCreateComponent)
      },
      {
        path: 'solicitudes/:id',
        loadComponent: () => import('./features/solicitudes/solicitud-detail/solicitud-detail.component').then(m => m.SolicitudDetailComponent)
      },
      {
        path: 'responsables',
        data: { roles: ['ADMINISTRATIVO', 'COORDINADOR', 'CONSULTOR'] },
        canActivate: [roleGuard],
        loadComponent: () => import('./features/responsables/responsables.component').then(m => m.ResponsablesComponent)
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
