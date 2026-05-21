import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';
import { AnimationService } from '../../../core/services/animation.service';
import { extractErrorMessage } from '../../../core/utils/labels';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly alert = inject(AlertService);
  private readonly animation = inject(AnimationService);

  private readonly institutionalEmailPattern = /^[A-Za-z0-9._%+-]+@uqvirtual\.edu\.co$/;

  @ViewChild('forgotPage') forgotPage?: ElementRef<HTMLElement>;

  loading = false;
  error = '';

  form = this.fb.nonNullable.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.pattern(this.institutionalEmailPattern)
      ]
    ]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      this.alert.warning(
        'Correo inválido',
        'Ingresa tu correo institucional terminado en @uqvirtual.edu.co.'
      );

      return;
    }

    const email = this.form.getRawValue().email.trim().toLowerCase();

    this.loading = true;
    this.error = '';

    this.alert.loading('Enviando código de recuperación...');

    this.auth.forgotPassword({ email }).subscribe({
      next: () => {
        this.alert.close();

        this.alert.success(
          'Código enviado',
          'Revisa tu correo institucional e ingresa el código de recuperación.'
        );

        this.loading = false;

        this.router.navigate(['/reset-password'], {
          queryParams: { email }
        });
      },
      error: error => {
        this.alert.close();

        this.error = extractErrorMessage(error);
        this.loading = false;

        this.alert.error(
          'No se pudo enviar el código',
          this.error
        );
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (!this.forgotPage) return;

      this.animation.pageEnter(this.forgotPage.nativeElement);

      const cards = this.forgotPage.nativeElement.querySelectorAll('.hero-card, .login-card');
      this.animation.cardsEnter(cards);
    }, 100);
  }
}
