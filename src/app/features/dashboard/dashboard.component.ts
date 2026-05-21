import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SolicitudService } from '../../core/services/solicitud.service';
import { AuthService } from '../../core/services/auth.service';
import { EstadoSolicitud } from '../../core/models/enums';
import { Solicitud } from '../../core/models/solicitud.model';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../shared/priority-badge/priority-badge.component';
import { extractErrorMessage, formatDateTime, labelEnum } from '../../core/utils/labels';
import { AnimationService } from '../../core/services/animation.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LoadingSpinnerComponent,
    StatusBadgeComponent,
    PriorityBadgeComponent
  ],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private readonly solicitudService = inject(SolicitudService);
  private readonly animation = inject(AnimationService);

  readonly auth = inject(AuthService);

  @ViewChild('dashboardPage') dashboardPage?: ElementRef<HTMLElement>;

  loading = true;
  error = '';
  solicitudes: Solicitud[] = [];

  label = labelEnum;
  formatDateTime = formatDateTime;

  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit(): void {
    this.animateDashboard();
  }

  load(): void {
    this.loading = true;
    this.error = '';

    const request = this.auth.hasAnyRole(['ADMINISTRATIVO', 'COORDINADOR', 'CONSULTOR'])
      ? this.solicitudService.listar({ size: 100 })
      : this.solicitudService.misSolicitudes({ size: 100 });

    request.subscribe({
      next: (response: any) => {
        this.solicitudes = this.extractSolicitudes(response);
        this.loading = false;

        setTimeout(() => {
          this.animateDashboard();
        }, 100);
      },
      error: error => {
        this.error = extractErrorMessage(error);
        this.solicitudes = [];
        this.loading = false;
      }
    });
  }

  private extractSolicitudes(response: any): Solicitud[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.content)) {
      return response.content;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.data?.content)) {
      return response.data.content;
    }

    return [];
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

  private animateDashboard(): void {
    setTimeout(() => {
      if (!this.dashboardPage) return;

      this.animation.pageEnter(this.dashboardPage.nativeElement);

      const cards = this.dashboardPage.nativeElement.querySelectorAll('.card');
      if (cards.length > 0) {
        this.animation.cardsEnter(cards);
      }

      const rows = this.dashboardPage.nativeElement.querySelectorAll('tbody tr, .timeline-item');
      if (rows.length > 0) {
        this.animation.rowsEnter(rows);
      }
    }, 120);
  }
}
