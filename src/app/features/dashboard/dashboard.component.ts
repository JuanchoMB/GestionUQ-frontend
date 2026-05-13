import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SolicitudService } from '../../core/services/solicitud.service';
import { AuthService } from '../../core/services/auth.service';
import { EstadoSolicitud, Prioridad } from '../../core/models/enums';
import { Solicitud } from '../../core/models/solicitud.model';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../shared/priority-badge/priority-badge.component';
import { extractErrorMessage, formatDateTime, labelEnum } from '../../core/utils/labels';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent, StatusBadgeComponent, PriorityBadgeComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private readonly solicitudService = inject(SolicitudService);
  readonly auth = inject(AuthService);

  loading = true;
  error = '';
  solicitudes: Solicitud[] = [];
  label = labelEnum;
  formatDateTime = formatDateTime;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    const request = this.auth.hasAnyRole(['ADMINISTRATIVO', 'COORDINADOR', 'CONSULTOR'])
      ? this.solicitudService.listar({ size: 100 })
      : this.solicitudService.misSolicitudes({ size: 100 });

    request.subscribe({
      next: page => {
        this.solicitudes = page.content;
        this.loading = false;
      },
      error: error => {
        this.error = extractErrorMessage(error);
        this.loading = false;
      }
    });
  }

  countByEstado(estado: EstadoSolicitud): number {
    return this.solicitudes.filter(s => s.estado === estado).length;
  }

  countCritical(): number {
    return this.solicitudes.filter(s => s.prioridad === 'CRITICA' || s.prioridad === 'ALTA').length;
  }

  latest(): Solicitud[] {
    return [...this.solicitudes].slice(0, 8);
  }

  pending(): Solicitud[] {
    return this.solicitudes.filter(s => s.estado !== 'CERRADA').slice(0, 6);
  }
}
