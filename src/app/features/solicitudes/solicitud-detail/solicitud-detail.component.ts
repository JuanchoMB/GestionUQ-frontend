import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SolicitudService } from '../../../core/services/solicitud.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { AuthService } from '../../../core/services/auth.service';
import { ESTADOS_SOLICITUD, PRIORIDADES, TIPOS_SOLICITUD } from '../../../core/models/enums';
import { HistorialSolicitud, Solicitud, UsuarioSimple, SugerirPrioridadResponse } from '../../../core/models/solicitud.model';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/priority-badge/priority-badge.component';
import { extractErrorMessage, formatDate, formatDateTime, labelEnum } from '../../../core/utils/labels';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-solicitud-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingSpinnerComponent, StatusBadgeComponent, PriorityBadgeComponent],
  templateUrl: './solicitud-detail.component.html'
})
export class SolicitudDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly solicitudService = inject(SolicitudService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly alert = inject(AlertService);
  readonly auth = inject(AuthService);

  solicitud?: Solicitud;
  historial: HistorialSolicitud[] = [];
  responsables: UsuarioSimple[] = [];
  resumen = '';
  prioridadSugerida?: SugerirPrioridadResponse;
  loading = true;
  actionLoading = false;
  resumenLoading = false;
  error = '';
  success = '';

  tipos = TIPOS_SOLICITUD;
  prioridades = PRIORIDADES;
  estados = ESTADOS_SOLICITUD;
  label = labelEnum;
  formatDate = formatDate;
  formatDateTime = formatDateTime;

  clasificarForm = this.fb.group({
    tipoSolicitud: ['', Validators.required],
    prioridad: [''],
    justificacionPrioridad: ['']
  });

  asignarForm = this.fb.group({ responsableId: ['', Validators.required] });
  iniciarForm = this.fb.group({ observacion: [''] });
  atendidaForm = this.fb.group({ observacion: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]] });
  cerrarForm = this.fb.group({ observacionCierre: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(1000)]] });

  ngOnInit(): void {
    if (this.canManage()) {
      this.usuarioService.responsablesActivos().subscribe({ next: data => this.responsables = data, error: () => this.responsables = [] });
    }
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.loading = true;
    this.error = '';
    forkJoin({
      solicitud: this.solicitudService.obtenerPorId(id),
      historial: this.solicitudService.historial(id).pipe(catchError(() => of([] as HistorialSolicitud[])))
    }).subscribe({
      next: ({ solicitud, historial }) => {
        this.solicitud = solicitud;
        this.historial = historial;
        this.patchForms(solicitud);
        this.loading = false;
      },
      error: error => { this.error = extractErrorMessage(error); this.loading = false; }
    });
  }

  canManage(): boolean {
    return this.auth.hasAnyRole(['ADMINISTRATIVO', 'COORDINADOR']);
  }

  isClosed(): boolean {
    return this.solicitud?.estado === 'CERRADA';
  }

  canClassify(): boolean {
    return this.canManage() && !this.isClosed();
  }

  canAssign(): boolean {
    return this.canManage() && !this.isClosed();
  }

  canStartAttention(): boolean {
    return this.canManage() && this.solicitud?.estado === 'CLASIFICADA' && !!this.solicitud?.responsable;
  }

  canMarkAttended(): boolean {
    return this.canManage() && this.solicitud?.estado === 'EN_ATENCION';
  }

  canClose(): boolean {
    return this.canManage() && this.solicitud?.estado === 'ATENDIDA';
  }

  suggestPriority(): void {
    if (!this.solicitud?.impactoAcademico) {
      this.error = 'La solicitud no tiene impacto académico registrado para sugerir prioridad.';
      return;
    }
    this.actionLoading = true;
    this.solicitudService.sugerirPrioridad({
      tipoSolicitud: this.clasificarForm.controls.tipoSolicitud.value as any,
      impactoAcademico: this.solicitud.impactoAcademico,
      fechaLimite: this.solicitud.fechaLimite || null
    }).subscribe({
      next: response => {
        this.prioridadSugerida = response;
        this.clasificarForm.patchValue({ prioridad: response.prioridadSugerida });
        this.success = 'Prioridad sugerida. Puedes confirmar o ajustar antes de clasificar.';
        this.actionLoading = false;
      },
      error: error => { this.error = `La asistencia IA no está disponible. Puedes continuar manualmente. ${extractErrorMessage(error)}`; this.actionLoading = false; }
    });
  }

  clasificar(): void {
    if (!this.solicitud || this.clasificarForm.invalid) return;
    this.runAction(this.solicitudService.clasificar(this.solicitud.id, {
      tipoSolicitud: this.clasificarForm.controls.tipoSolicitud.value as any,
      prioridad: this.clasificarForm.controls.prioridad.value ? this.clasificarForm.controls.prioridad.value as any : null,
      justificacionPrioridad: this.clasificarForm.controls.justificacionPrioridad.value || null
    }), 'Solicitud clasificada y priorizada.');
  }

  asignar(): void {
    if (!this.solicitud || this.asignarForm.invalid) return;
    this.runAction(this.solicitudService.asignar(this.solicitud.id, { responsableId: this.asignarForm.controls.responsableId.value || '' }), 'Responsable asignado.');
  }

  iniciarAtencion(): void {
    if (!this.solicitud) return;
    this.runAction(this.solicitudService.iniciarAtencion(this.solicitud.id, { observacion: this.iniciarForm.controls.observacion.value || null }), 'Atención iniciada.');
  }

  marcarAtendida(): void {
    if (!this.solicitud || this.atendidaForm.invalid) {
      this.atendidaForm.markAllAsTouched();
      return;
    }
    this.runAction(this.solicitudService.marcarAtendida(this.solicitud.id, { observacion: this.atendidaForm.controls.observacion.value || '' }), 'Solicitud marcada como atendida.');
  }

  async cerrar(): Promise<void> {
    if (!this.solicitud || this.cerrarForm.invalid) {
      this.cerrarForm.markAllAsTouched();

      this.alert.warning(
        'Observación requerida',
        'Debes registrar una observación de cierre válida.'
      );

      return;
    }

    const confirmado = await this.alert.confirm(
      'Cerrar solicitud',
      'Una solicitud cerrada no podrá ser modificada. ¿Deseas continuar?',
      'Sí, cerrar solicitud'
    );

    if (!confirmado) {
      return;
    }

    this.runAction(
      this.solicitudService.cerrar(this.solicitud.id, {
        observacionCierre: this.cerrarForm.controls.observacionCierre.value || ''
      }),
      'Solicitud cerrada correctamente.'
    );
  }

  generarResumen(): void {
    if (!this.solicitud) return;
    this.resumenLoading = true;
    this.resumen = '';
    this.solicitudService.resumen(this.solicitud.id).subscribe({
      next: response => { this.resumen = response; this.resumenLoading = false; this.load(); },
      error: error => { this.error = `No fue posible generar resumen. ${extractErrorMessage(error)}`; this.resumenLoading = false; }
    });
  }

  private runAction(obs: any, message: string): void {
    this.actionLoading = true;
    this.error = '';
    this.success = '';

    this.alert.loading('Procesando operación...');

    obs.subscribe({
      next: () => {
        this.alert.close();

        this.success = message;
        this.actionLoading = false;

        this.alert.success(
          'Operación exitosa',
          message
        );

        this.load();
      },
      error: (error: unknown) => {
        this.alert.close();

        this.error = extractErrorMessage(error);
        this.actionLoading = false;

        this.alert.error(
          'No se pudo completar la operación',
          this.error
        );
      }
    });
  }

  private patchForms(solicitud: Solicitud): void {
    this.clasificarForm.patchValue({
      tipoSolicitud: solicitud.tipoSolicitud,
      prioridad: solicitud.prioridad || '',
      justificacionPrioridad: solicitud.justificacionPrioridad || ''
    });
    this.asignarForm.patchValue({ responsableId: solicitud.responsable?.id || '' });
  }
}
