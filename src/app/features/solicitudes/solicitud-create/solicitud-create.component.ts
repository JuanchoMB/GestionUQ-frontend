import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SolicitudService } from '../../../core/services/solicitud.service';
import { AuthService } from '../../../core/services/auth.service';
import { CANALES_ORIGEN, IMPACTOS_ACADEMICOS, TIPOS_SOLICITUD } from '../../../core/models/enums';
import { extractErrorMessage, labelEnum } from '../../../core/utils/labels';
import { SugerirClasificacionPrioridadResponse } from '../../../core/models/solicitud.model';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-solicitud-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './solicitud-create.component.html'
})
export class SolicitudCreateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly solicitudService = inject(SolicitudService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  private readonly alert = inject(AlertService);

  tipos = TIPOS_SOLICITUD;
  canales = CANALES_ORIGEN;
  impactos = IMPACTOS_ACADEMICOS;
  label = labelEnum;
  loading = false;
  suggesting = false;
  error = '';
  suggestion?: SugerirClasificacionPrioridadResponse;

  form = this.fb.group({
    tipoSolicitud: ['', Validators.required],
    descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
    canalOrigen: ['CORREO', Validators.required],
    impactoAcademico: ['MEDIO'],
    fechaLimite: ['']
  });

  canSuggest(): boolean {
    return this.auth.hasAnyRole(['ADMINISTRATIVO', 'COORDINADOR']);
  }

  suggest(): void {
    if (!this.form.controls.descripcion.valid || !this.form.controls.canalOrigen.valid || !this.form.controls.impactoAcademico.value) {
      this.form.markAllAsTouched();

      this.alert.warning(
        'Datos insuficientes',
        'Escribe una descripción clara antes de solicitar la sugerencia con IA.'
      );

      return;
    }

    this.suggesting = true;
    this.error = '';
    this.alert.loading('Consultando Gemini...');

    this.solicitudService.sugerirClasificacionPrioridad({
      descripcion: this.form.controls.descripcion.value || '',
      canalOrigen: this.form.controls.canalOrigen.value as any,
      impactoAcademico: this.form.controls.impactoAcademico.value as any,
      fechaLimite: this.form.controls.fechaLimite.value || null
    }).subscribe({
      next: response => {
        this.alert.close();
        this.suggestion = response;
        this.suggesting = false;

        this.alert.success(
          'Sugerencia generada',
          'Gemini generó una clasificación y prioridad sugerida.'
        );
      },
      error: error => {
        this.alert.close();
        this.error = `La asistencia IA no está disponible. Puedes continuar manualmente. ${extractErrorMessage(error)}`;
        this.suggesting = false;

        this.alert.warning(
          'IA no disponible',
          'Puedes continuar el registro de forma manual.'
        );
      }
    });
  }

  applySuggestion(): void {
    if (!this.suggestion) return;
    this.form.patchValue({ tipoSolicitud: this.suggestion.tipoSolicitudSugerido });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      this.alert.warning(
        'Formulario incompleto',
        'Revisa los campos obligatorios antes de registrar la solicitud.'
      );

      return;
    }

    this.loading = true;
    this.error = '';
    this.alert.loading('Registrando solicitud...');

    const raw = this.form.getRawValue();

    this.solicitudService.registrar({
      tipoSolicitud: raw.tipoSolicitud as any,
      descripcion: raw.descripcion || '',
      canalOrigen: raw.canalOrigen as any,
      impactoAcademico: raw.impactoAcademico ? raw.impactoAcademico as any : null,
      fechaLimite: raw.fechaLimite || null
    }).subscribe({
      next: solicitud => {
        this.alert.close();

        this.alert.success(
          'Solicitud registrada',
          'La solicitud académica fue creada correctamente.'
        );

        this.router.navigate(['/solicitudes', solicitud.id]);
      },
      error: error => {
        this.alert.close();
        this.error = extractErrorMessage(error);
        this.loading = false;

        this.alert.error(
          'No se pudo registrar la solicitud',
          this.error
        );
      }
    });
  }
}
