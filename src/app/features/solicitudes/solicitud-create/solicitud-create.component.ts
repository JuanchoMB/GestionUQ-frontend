import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
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
  templateUrl: './solicitud-create.component.html',
  styleUrls: ['./solicitud-create.component.css']
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

  today = this.getTodayLocalDate();

  calendarOpen = false;
  currentDate = new Date();
  currentYear = this.currentDate.getFullYear();
  currentMonth = this.currentDate.getMonth();

  monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre'
  ];

  weekDays = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SAB'];

  form = this.fb.group({
    tipoSolicitud: ['', Validators.required],
    descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
    canalOrigen: ['CORREO', Validators.required],
    impactoAcademico: ['MEDIO'],
    fechaLimite: ['', [Validators.required]]
  });

  get selectedDateLabel(): string {
    const value = this.form.controls.fechaLimite.value;

    if (!value) {
      return '';
    }

    const [year, month, day] = value.split('-').map(Number);

    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  }

  get daysInMonth(): number[] {
    const totalDays = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

    return Array.from({ length: totalDays }, (_, index) => index + 1);
  }

  get emptyDays(): number[] {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();

    return Array.from({ length: firstDay }, (_, index) => index);
  }

  canSuggest(): boolean {
    return this.auth.hasAnyRole(['ADMINISTRATIVO', 'COORDINADOR']);
  }

  toggleCalendar(): void {
    this.calendarOpen = !this.calendarOpen;
  }

  previousMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
  }

  selectDate(day: number): void {
    if (this.isPastDate(day)) {
      return;
    }

    const value = this.formatDateValue(this.currentYear, this.currentMonth, day);

    this.form.controls.fechaLimite.setValue(value);
    this.form.controls.fechaLimite.markAsTouched();
    this.form.controls.fechaLimite.updateValueAndValidity();

    this.calendarOpen = false;
  }

  selectToday(): void {
    const now = new Date();

    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth();

    this.form.controls.fechaLimite.setValue(this.today);
    this.form.controls.fechaLimite.markAsTouched();
    this.form.controls.fechaLimite.updateValueAndValidity();

    this.calendarOpen = false;
  }

  clearDate(): void {
    this.form.controls.fechaLimite.setValue('');
    this.form.controls.fechaLimite.markAsTouched();
    this.form.controls.fechaLimite.updateValueAndValidity();

    this.calendarOpen = false;
  }

  isSelected(day: number): boolean {
    const value = this.form.controls.fechaLimite.value;

    if (!value) {
      return false;
    }

    return value === this.formatDateValue(this.currentYear, this.currentMonth, day);
  }

  isToday(day: number): boolean {
    return this.today === this.formatDateValue(this.currentYear, this.currentMonth, day);
  }

  isPastDate(day: number): boolean {
    const value = this.formatDateValue(this.currentYear, this.currentMonth, day);

    return value < this.today;
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

    const fechaLimite = this.form.controls.fechaLimite.value || null;

    if (fechaLimite && fechaLimite < this.today) {
      this.form.controls.fechaLimite.setErrors({ pastDate: true });
      this.form.controls.fechaLimite.markAsTouched();

      this.alert.warning(
        'Fecha límite inválida',
        'No puedes seleccionar una fecha anterior a la fecha actual.'
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
      fechaLimite
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
    if (!this.suggestion) {
      return;
    }

    this.form.patchValue({
      tipoSolicitud: this.suggestion.tipoSolicitudSugerido
    });
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

    const raw = this.form.getRawValue();
    const fechaLimite = raw.fechaLimite || null;

    if (fechaLimite && fechaLimite < this.today) {
      this.form.controls.fechaLimite.setErrors({ pastDate: true });
      this.form.markAllAsTouched();

      this.alert.warning(
        'Fecha límite inválida',
        'No puedes seleccionar una fecha anterior a la fecha actual.'
      );

      return;
    }

    this.loading = true;
    this.error = '';
    this.alert.loading('Registrando solicitud...');

    this.solicitudService.registrar({
      tipoSolicitud: raw.tipoSolicitud as any,
      descripcion: raw.descripcion || '',
      canalOrigen: raw.canalOrigen as any,
      impactoAcademico: raw.impactoAcademico ? raw.impactoAcademico as any : null,
      fechaLimite
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

  @HostListener('document:keydown.escape')
  closeCalendarWithEscape(): void {
    this.calendarOpen = false;
  }

  private formatDateValue(year: number, month: number, day: number): string {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');

    return `${year}-${formattedMonth}-${formattedDay}`;
  }

  private getTodayLocalDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
