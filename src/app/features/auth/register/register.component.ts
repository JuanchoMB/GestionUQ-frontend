import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';
import { AnimationService } from '../../../core/services/animation.service';
import { extractErrorMessage } from '../../../core/utils/labels';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  styleUrls: ['./register.component.css'],
  templateUrl: './register.component.html'
})
export class RegisterComponent implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly alert = inject(AlertService);
  private readonly animation = inject(AnimationService);

  private readonly institutionalEmailPattern = /^[A-Za-z0-9._%+-]+@uniquindio\.edu\.co$/;

  @ViewChild('registerPage') registerPage?: ElementRef<HTMLElement>;

  loading = false;
  error = '';

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    nombres: ['', [Validators.required, Validators.maxLength(80)]],
    apellidos: ['', [Validators.required, Validators.maxLength(80)]],
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(120),
        Validators.pattern(this.institutionalEmailPattern)
      ]
    ],
    identificacion: ['', [Validators.required, Validators.maxLength(20)]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(80)]],
    confirmPassword: ['', [Validators.required]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      this.alert.warning(
        'Datos incompletos',
        'Completa todos los campos requeridos.'
      );

      return;
    }

    const raw = this.form.getRawValue();
    const email = raw.email.trim().toLowerCase();

    if (!email.endsWith('@uniquindio.edu.co')) {
      this.form.controls.email.setErrors({ institutionalEmail: true });
      this.form.controls.email.markAsTouched();

      this.alert.warning(
        'Correo no institucional',
        'Debes registrarte con un correo que finalice en @uniquindio.edu.co.'
      );

      return;
    }

    if (raw.password !== raw.confirmPassword) {
      this.form.controls.confirmPassword.setErrors({ passwordMismatch: true });

      this.alert.warning(
        'Contraseñas diferentes',
        'La confirmación de contraseña no coincide.'
      );

      return;
    }

    this.loading = true;
    this.error = '';
    this.alert.loading('Registrando estudiante...');

    const request = {
      username: raw.username.trim(),
      nombres: raw.nombres.trim(),
      apellidos: raw.apellidos.trim(),
      email,
      identificacion: raw.identificacion.trim(),
      password: raw.password
    };

    this.auth.register(request).subscribe({
      next: () => {
        this.alert.close();

        this.alert.success(
          'Registro exitoso',
          'Ahora puedes iniciar sesión con tu usuario y contraseña.'
        );

        this.router.navigate(['/login']);
      },
      error: error => {
        this.alert.close();

        this.error = extractErrorMessage(error);
        this.loading = false;

        this.alert.error(
          'No se pudo registrar',
          this.error
        );
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (!this.registerPage) return;

      this.animation.pageEnter(this.registerPage.nativeElement);

      const cards = this.registerPage.nativeElement.querySelectorAll('.hero-card, .login-card');
      this.animation.cardsEnter(cards);
    }, 100);
  }

}
