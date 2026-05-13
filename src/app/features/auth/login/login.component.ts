import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { extractErrorMessage } from '../../../core/utils/labels';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styleUrls: ['./login.component.css'],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly alert = inject(AlertService);

  loading = false;
  error = '';

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(4)]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      this.alert.warning(
        'Datos incompletos',
        'Ingresa usuario y contraseña.'
      );

      return;
    }

    this.loading = true;
    this.error = '';
    this.alert.loading('Iniciando sesión...');

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.alert.close();

        this.alert.success(
          'Bienvenido',
          'Inicio de sesión correcto.'
        );

        this.router.navigate(['/dashboard']);
      },
      error: error => {
        this.alert.close();

        this.error = extractErrorMessage(error);
        this.loading = false;

        this.alert.error(
          'No se pudo iniciar sesión',
          this.error
        );
      }
    });
  }
}
