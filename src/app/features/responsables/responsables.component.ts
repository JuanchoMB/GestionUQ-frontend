import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioService } from '../../core/services/usuario.service';
import { UsuarioSimple } from '../../core/models/solicitud.model';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { extractErrorMessage, labelEnum } from '../../core/utils/labels';
import { AuthService } from '../../core/services/auth.service';
import { AlertService } from '../../core/services/alert.service';

type RolResponsableForm = 'ADMINISTRATIVO' | 'COORDINADOR' | 'CONSULTOR';

@Component({
  selector: 'app-responsables',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
  templateUrl: './responsables.component.html',
  styleUrls: ['./responsables.component.css']
})
export class ResponsablesComponent implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly alert = inject(AlertService);

  responsables: UsuarioSimple[] = [];
  loading = true;
  error = '';
  label = labelEnum;

  showCreateForm = false;
  creating = false;
  createError = '';

  rolesResponsable: RolResponsableForm[] = ['ADMINISTRATIVO', 'COORDINADOR', 'CONSULTOR'];

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    nombres: ['', [Validators.required, Validators.maxLength(80)]],
    apellidos: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    identificacion: ['', [Validators.required, Validators.maxLength(20)]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(80)]],
    rol: ['COORDINADOR' as RolResponsableForm, Validators.required]
  });

  ngOnInit(): void {
    this.cargarResponsables();
  }

  cargarResponsables(): void {
    this.loading = true;
    this.error = '';

    const request$ = this.canCreateResponsable()
      ? this.usuarioService.responsablesGestion()
      : this.usuarioService.responsablesActivos();

    request$.subscribe({
      next: data => {
        this.responsables = data;
        this.loading = false;
      },
      error: error => {
        this.error = extractErrorMessage(error);
        this.loading = false;
      }
    });
  }

  canCreateResponsable(): boolean {
    return this.auth.hasAnyRole(['ADMINISTRATIVO']);
  }

  get responsablesActivos(): UsuarioSimple[] {
    return this.responsables.filter(usuario =>
      usuario.activo &&
      (usuario.rol === 'ADMINISTRATIVO' || usuario.rol === 'COORDINADOR')
    );
  }

  get consultoresActivos(): UsuarioSimple[] {
    return this.responsables.filter(usuario =>
      usuario.activo && usuario.rol === 'CONSULTOR'
    );
  }

  get responsablesInactivos(): UsuarioSimple[] {
    return this.responsables.filter(usuario => !usuario.activo);
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.createError = '';

    if (!this.showCreateForm) {
      this.resetForm();
    }
  }

  crearResponsable(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      this.alert.warning(
        'Formulario incompleto',
        'Revisa los campos obligatorios antes de crear el responsable.'
      );

      return;
    }

    const raw = this.form.getRawValue();

    this.creating = true;
    this.createError = '';

    this.alert.loading('Creando responsable...');

    this.usuarioService.crearResponsable({
      username: raw.username.trim(),
      nombres: raw.nombres.trim(),
      apellidos: raw.apellidos.trim(),
      email: raw.email.trim().toLowerCase(),
      identificacion: raw.identificacion.trim(),
      password: raw.password,
      rol: raw.rol
    }).subscribe({
      next: responsable => {
        this.alert.close();

        this.alert.success(
          'Responsable creado exitosamente',
          `${responsable.nombreCompleto} fue registrado correctamente como ${this.label(responsable.rol)}.`
        );

        this.creating = false;
        this.showCreateForm = false;
        this.resetForm();
        this.cargarResponsables();
      },
      error: error => {
        this.alert.close();

        this.createError = extractErrorMessage(error);
        this.creating = false;

        this.alert.error(
          'No se pudo crear el responsable',
          this.createError
        );
      }
    });
  }

  desactivarResponsable(responsable: UsuarioSimple): void {
    this.alert.confirm(
      '¿Desactivar responsable?',
      `${responsable.nombreCompleto} quedará inactivo y no podrá ser asignado a nuevas solicitudes.`,
      'Sí, desactivar'
    ).then(confirmed => {
      if (!confirmed) {
        return;
      }

      this.alert.loading('Desactivando responsable...');

      this.usuarioService.desactivarResponsable(responsable.id).subscribe({
        next: () => {
          this.alert.close();

          this.alert.success(
            'Responsable desactivado',
            `${responsable.nombreCompleto} fue desactivado correctamente.`
          );

          this.cargarResponsables();
        },
        error: error => {
          this.alert.close();

          this.alert.error(
            'No se pudo desactivar el responsable',
            extractErrorMessage(error)
          );
        }
      });
    });
  }

  activarResponsable(responsable: UsuarioSimple): void {
    this.alert.confirm(
      '¿Activar responsable?',
      `${responsable.nombreCompleto} volverá a estar disponible en el sistema.`,
      'Sí, activar'
    ).then(confirmed => {
      if (!confirmed) {
        return;
      }

      this.alert.loading('Activando responsable...');

      this.usuarioService.activarResponsable(responsable.id).subscribe({
        next: () => {
          this.alert.close();

          this.alert.success(
            'Responsable activado',
            `${responsable.nombreCompleto} fue activado correctamente.`
          );

          this.cargarResponsables();
        },
        error: error => {
          this.alert.close();

          this.alert.error(
            'No se pudo activar el responsable',
            extractErrorMessage(error)
          );
        }
      });
    });
  }

  private resetForm(): void {
    this.form.reset({
      username: '',
      nombres: '',
      apellidos: '',
      email: '',
      identificacion: '',
      password: '',
      rol: 'COORDINADOR'
    });
  }
}
