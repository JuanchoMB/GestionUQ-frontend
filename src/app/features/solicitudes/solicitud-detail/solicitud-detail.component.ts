import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { animate, stagger } from 'animejs';

import { SolicitudService } from '../../../core/services/solicitud.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';

import {
  ESTADOS_SOLICITUD,
  PRIORIDADES,
  TIPOS_SOLICITUD
} from '../../../core/models/enums';

import {
  HistorialSolicitud,
  Solicitud,
  UsuarioSimple,
  SugerirPrioridadResponse
} from '../../../core/models/solicitud.model';

import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/priority-badge/priority-badge.component';

import {
  extractErrorMessage,
  formatDate,
  formatDateTime,
  labelEnum
} from '../../../core/utils/labels';

@Component({
  selector: 'app-solicitud-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LoadingSpinnerComponent,
    StatusBadgeComponent,
    PriorityBadgeComponent
  ],
  templateUrl: './solicitud-detail.component.html',
  styleUrls: ['./solicitud-detail.component.css']
})
export class SolicitudDetailComponent implements OnInit, AfterViewChecked {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly solicitudService = inject(SolicitudService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly alert = inject(AlertService);

  readonly auth = inject(AuthService);

  @ViewChild('historySection')
  historySection?: ElementRef<HTMLElement>;

  private lastHistoryCount = 0;

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

  asignarForm = this.fb.group({
    responsableId: ['', Validators.required]
  });

  iniciarForm = this.fb.group({
    observacion: ['']
  });

  atendidaForm = this.fb.group({
    observacion: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(500)
      ]
    ]
  });

  cerrarForm = this.fb.group({
    observacionCierre: [
      '',
      [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(1000)
      ]
    ]
  });

  ngOnInit(): void {
    if (this.canManage()) {
      this.usuarioService.responsablesActivos().subscribe({
        next: data => {
          this.responsables = data;
        },
        error: () => {
          this.responsables = [];
        }
      });
    }

    this.load();
  }

  ngAfterViewChecked(): void {
    this.animateHistoryTimeline();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';

    this.loading = true;
    this.error = '';
    this.success = '';
    this.lastHistoryCount = 0;

    forkJoin({
      solicitud: this.solicitudService.obtenerPorId(id),
      historial: this.solicitudService
        .historial(id)
        .pipe(catchError(() => of([] as HistorialSolicitud[])))
    }).subscribe({
      next: ({ solicitud, historial }) => {
        this.solicitud = solicitud;
        this.historial = historial;
        this.patchForms(solicitud);
        this.loading = false;
      },
      error: error => {
        this.error = extractErrorMessage(error);
        this.loading = false;
      }
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
    return (
      this.canManage() &&
      this.solicitud?.estado === 'CLASIFICADA' &&
      !!this.solicitud?.responsable
    );
  }

  canMarkAttended(): boolean {
    return this.canManage() && this.solicitud?.estado === 'EN_ATENCION';
  }

  canClose(): boolean {
    return this.canManage() && this.solicitud?.estado === 'ATENDIDA';
  }

  suggestPriority(): void {
    if (!this.solicitud?.impactoAcademico) {
      this.alert.warning(
        'Datos insuficientes',
        'La solicitud no tiene impacto académico registrado para sugerir prioridad.'
      );

      return;
    }

    this.actionLoading = true;
    this.error = '';
    this.success = '';

    this.solicitudService.sugerirPrioridad({
      tipoSolicitud: this.clasificarForm.controls.tipoSolicitud.value as any,
      impactoAcademico: this.solicitud.impactoAcademico,
      fechaLimite: this.solicitud.fechaLimite || null
    }).subscribe({
      next: response => {
        this.prioridadSugerida = response;

        this.clasificarForm.patchValue({
          prioridad: response.prioridadSugerida
        });

        this.success = 'Prioridad sugerida. Puedes confirmar o ajustar antes de clasificar.';
        this.actionLoading = false;

        this.alert.success(
          'Sugerencia generada',
          'Gemini generó una prioridad sugerida para esta solicitud.'
        );
      },
      error: error => {
        this.error = `La asistencia IA no está disponible. Puedes continuar manualmente. ${extractErrorMessage(error)}`;
        this.actionLoading = false;

        this.alert.warning(
          'IA no disponible',
          'Puedes continuar la clasificación de forma manual.'
        );
      }
    });
  }

  clasificar(): void {
    if (!this.solicitud || this.clasificarForm.invalid) {
      this.clasificarForm.markAllAsTouched();

      this.alert.warning(
        'Formulario incompleto',
        'Revisa los datos de clasificación antes de continuar.'
      );

      return;
    }

    this.runAction(
      this.solicitudService.clasificar(this.solicitud.id, {
        tipoSolicitud: this.clasificarForm.controls.tipoSolicitud.value as any,
        prioridad: this.clasificarForm.controls.prioridad.value
          ? this.clasificarForm.controls.prioridad.value as any
          : null,
        justificacionPrioridad:
          this.clasificarForm.controls.justificacionPrioridad.value || null
      }),
      'Solicitud clasificada y priorizada.'
    );
  }

  asignar(): void {
    if (!this.solicitud || this.asignarForm.invalid) {
      this.asignarForm.markAllAsTouched();

      this.alert.warning(
        'Responsable requerido',
        'Selecciona un responsable activo antes de asignar la solicitud.'
      );

      return;
    }

    this.runAction(
      this.solicitudService.asignar(this.solicitud.id, {
        responsableId: this.asignarForm.controls.responsableId.value || ''
      }),
      'Responsable asignado.'
    );
  }

  iniciarAtencion(): void {
    if (!this.solicitud) {
      return;
    }

    this.runAction(
      this.solicitudService.iniciarAtencion(this.solicitud.id, {
        observacion: this.iniciarForm.controls.observacion.value || null
      }),
      'Atención iniciada.'
    );
  }

  marcarAtendida(): void {
    if (!this.solicitud || this.atendidaForm.invalid) {
      this.atendidaForm.markAllAsTouched();

      this.alert.warning(
        'Observación requerida',
        'Debes registrar una observación de atención válida.'
      );

      return;
    }

    this.runAction(
      this.solicitudService.marcarAtendida(this.solicitud.id, {
        observacion: this.atendidaForm.controls.observacion.value || ''
      }),
      'Solicitud marcada como atendida.'
    );
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
        observacionCierre:
          this.cerrarForm.controls.observacionCierre.value || ''
      }),
      'Solicitud cerrada correctamente.'
    );
  }

  generarResumen(): void {
    if (!this.solicitud) {
      return;
    }

    this.resumenLoading = true;
    this.error = '';
    this.resumen = '';

    this.solicitudService.resumen(this.solicitud.id).subscribe({
      next: response => {
        console.log('RESUMEN COMPLETO RECIBIDO DEL BACKEND:', response);
        console.log('LONGITUD DEL RESUMEN:', response?.length);

        this.resumen = response;
        this.resumenLoading = false;

        this.alert.success(
          'Resumen generado',
          'Se generó un resumen asistido de la solicitud.'
        );

        // No llamamos this.load() aquí porque puede refrescar el componente
        // y afectar la visualización del resumen recién generado.
      },
      error: error => {
        console.error('ERROR AL GENERAR RESUMEN:', error);

        this.error = `No fue posible generar resumen. ${extractErrorMessage(error)}`;
        this.resumenLoading = false;

        this.alert.warning(
          'Resumen no disponible',
          'Puedes continuar usando el sistema normalmente.'
        );
      }
    });
  }

  getHistoryIcon(accion: string): string {
    const value = accion?.toLowerCase() || '';

    if (value.includes('registr')) return '📝';
    if (value.includes('clasific') || value.includes('prior')) return '🎯';
    if (value.includes('asign')) return '👤';
    if (value.includes('atención') || value.includes('atencion')) return '⚙️';
    if (value.includes('atendida')) return '✅';
    if (value.includes('cerr')) return '🔒';

    return '•';
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

    this.asignarForm.patchValue({
      responsableId: solicitud.responsable?.id || ''
    });
  }

  private animateHistoryTimeline(): void {
    const section = this.historySection?.nativeElement;

    if (!section) {
      return;
    }

    const items = section.querySelectorAll('.history-item');

    if (!items || items.length === 0) {
      return;
    }

    if (items.length === this.lastHistoryCount) {
      return;
    }

    this.lastHistoryCount = items.length;

    animate(items, {
      opacity: [0, 1],
      translateY: [16, 0],
      scale: [0.98, 1],
      duration: 520,
      delay: stagger(80),
      ease: 'outCubic'
    });

    const latest = section.querySelector('.history-item.latest .history-marker');

    if (latest) {
      animate(latest, {
        scale: [1, 1.12, 1],
        duration: 700,
        ease: 'outElastic(1, .6)'
      });
    }
  }

}
