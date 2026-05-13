import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SolicitudService } from '../../../core/services/solicitud.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { AuthService } from '../../../core/services/auth.service';
import { ESTADOS_SOLICITUD, PRIORIDADES, TIPOS_SOLICITUD } from '../../../core/models/enums';
import { PageResponse, emptyPage } from '../../../core/models/api-response.model';
import { Solicitud, UsuarioSimple } from '../../../core/models/solicitud.model';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/priority-badge/priority-badge.component';
import { extractErrorMessage, formatDateTime, labelEnum } from '../../../core/utils/labels';

@Component({
  selector: 'app-solicitud-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingSpinnerComponent, StatusBadgeComponent, PriorityBadgeComponent],
  templateUrl: './solicitud-list.component.html'
})
export class SolicitudListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly solicitudService = inject(SolicitudService);
  private readonly usuarioService = inject(UsuarioService);
  readonly auth = inject(AuthService);

  estados = ESTADOS_SOLICITUD;
  tipos = TIPOS_SOLICITUD;
  prioridades = PRIORIDADES;
  responsables: UsuarioSimple[] = [];
  page: PageResponse<Solicitud> = emptyPage();
  loading = true;
  error = '';
  label = labelEnum;
  formatDateTime = formatDateTime;

  filters = this.fb.group({
    estado: [''],
    tipoSolicitud: [''],
    prioridad: [''],
    responsableId: [''],
    descripcion: [''],
    identificacionSolicitante: ['']
  });

  ngOnInit(): void {
    if (this.auth.hasAnyRole(['ADMINISTRATIVO', 'COORDINADOR', 'CONSULTOR'])) {
      this.usuarioService.responsablesActivos().subscribe({ next: data => this.responsables = data, error: () => this.responsables = [] });
    }
    this.search(0);
  }

  search(pageNumber = 0): void {
    this.loading = true;
    this.error = '';
    const raw = this.filters.getRawValue();
    const query = { ...raw, page: pageNumber, size: 20 };
    const request = this.auth.hasAnyRole(['ADMINISTRATIVO', 'COORDINADOR', 'CONSULTOR'])
      ? this.solicitudService.listar(query as any)
      : this.solicitudService.misSolicitudes({ estado: raw.estado as any, page: pageNumber, size: 20 });

    request.subscribe({
      next: page => { this.page = page; this.loading = false; },
      error: error => { this.error = extractErrorMessage(error); this.loading = false; }
    });
  }

  clear(): void {
    this.filters.reset({ estado: '', tipoSolicitud: '', prioridad: '', responsableId: '', descripcion: '', identificacionSolicitante: '' });
    this.search(0);
  }

  canUseAdvancedFilters(): boolean {
    return this.auth.hasAnyRole(['ADMINISTRATIVO', 'COORDINADOR', 'CONSULTOR']);
  }
}
