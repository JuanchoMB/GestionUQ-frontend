import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
  inject
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';
import { AnimationService } from '../../../core/services/animation.service';
import { extractErrorMessage } from '../../../core/utils/labels';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly alert = inject(AlertService);
  private readonly animation = inject(AnimationService);

  private readonly institutionalEmailPattern = /^[A-Za-z0-9._%+-]+@uqvirtual\.edu\.co$/;

  @ViewChild('resetPage') resetPage?: ElementRef<HTMLElement>;
  @ViewChildren('codeInput') codeInputs?: QueryList<ElementRef<HTMLInputElement>>;

  loading = false;
  error = '';
  step = 1;
  verifiedCode = false;

  codeDigits = ['', '', '', '', '', ''];

  form = this.fb.nonNullable.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.pattern(this.institutionalEmailPattern)
      ]
    ],
    newPassword: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(80)]],
    confirmPassword: ['', [Validators.required]]
  });

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email');

    if (email) {
      this.form.patchValue({
        email: email.trim().toLowerCase()
      });
    }
  }

  get code(): string {
    return this.codeDigits.join('');
  }

  trackByIndex(index: number): number {
    return index;
  }

  onDigitInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(-1);

    this.codeDigits[index] = value;
    input.value = value;

    if (value && index < this.codeDigits.length - 1) {
      setTimeout(() => this.focusInput(index + 1), 0);
    }
  }

  onDigitKeyDown(index: number, event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace') {
      if (input.value) {
        this.codeDigits[index] = '';
        input.value = '';
        event.preventDefault();
        return;
      }

      if (index > 0) {
        this.codeDigits[index - 1] = '';
        this.focusInput(index - 1);
        event.preventDefault();
        return;
      }
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusInput(index - 1);
      return;
    }

    if (event.key === 'ArrowRight' && index < this.codeDigits.length - 1) {
      event.preventDefault();
      this.focusInput(index + 1);
    }
  }

  onPasteCode(event: ClipboardEvent): void {
    event.preventDefault();

    const pasted = event.clipboardData
      ?.getData('text')
      ?.replace(/\D/g, '')
      .slice(0, 6) || '';

    if (!pasted) {
      return;
    }

    for (let i = 0; i < this.codeDigits.length; i++) {
      this.codeDigits[i] = pasted[i] || '';
    }

    setTimeout(() => {
      const nextIndex = Math.min(pasted.length, this.codeDigits.length) - 1;
      this.focusInput(Math.max(nextIndex, 0));
    }, 0);
  }

  verifyCode(): void {
    const email = this.form.getRawValue().email.trim().toLowerCase();
    const code = this.code;

    if (!email) {
      this.form.controls.email.markAsTouched();
      this.alert.warning('Correo requerido', 'Primero debe existir un correo válido.');
      return;
    }

    if (code.length !== 6) {
      this.alert.warning(
        'Código incompleto',
        'Ingresa el código completo de 6 dígitos.'
      );
      return;
    }

    this.loading = true;
    this.error = '';
    this.alert.loading('Verificando código...');

    this.auth.verifyResetCode({ email, code }).subscribe({
      next: () => {
        this.alert.close();
        this.loading = false;
        this.verifiedCode = true;
        this.step = 2;

        this.alert.success(
          'Código válido',
          'Ahora puedes ingresar tu nueva contraseña.'
        );
      },
      error: error => {
        this.alert.close();
        this.loading = false;
        this.error = extractErrorMessage(error);

        this.alert.error(
          'Código inválido',
          this.error
        );
      }
    });
  }

  submitNewPassword(): void {
    if (!this.verifiedCode) {
      this.alert.warning(
        'Código no verificado',
        'Primero debes verificar el código de recuperación.'
      );
      return;
    }

    if (this.form.controls.newPassword.invalid || this.form.controls.confirmPassword.invalid) {
      this.form.controls.newPassword.markAsTouched();
      this.form.controls.confirmPassword.markAsTouched();

      this.alert.warning(
        'Datos incompletos',
        'Ingresa y confirma la nueva contraseña.'
      );
      return;
    }

    const raw = this.form.getRawValue();

    if (raw.newPassword !== raw.confirmPassword) {
      this.form.controls.confirmPassword.setErrors({ passwordMismatch: true });
      this.form.controls.confirmPassword.markAsTouched();

      this.alert.warning(
        'Contraseñas diferentes',
        'La confirmación de contraseña no coincide.'
      );

      return;
    }

    this.loading = true;
    this.error = '';
    this.alert.loading('Guardando nueva contraseña...');

    this.auth.resetPassword({
      email: raw.email.trim().toLowerCase(),
      code: this.code,
      newPassword: raw.newPassword,
      confirmPassword: raw.confirmPassword
    }).subscribe({
      next: () => {
        this.alert.close();

        this.alert.success(
          'Contraseña restablecida',
          'Ahora puedes iniciar sesión con tu nueva contraseña.'
        );

        this.router.navigate(['/login']);
      },
      error: error => {
        this.alert.close();
        this.loading = false;
        this.error = extractErrorMessage(error);

        this.alert.error(
          'No se pudo restablecer la contraseña',
          this.error
        );
      }
    });
  }

  private focusInput(index: number): void {
    const inputs = this.codeInputs?.toArray();
    inputs?.[index]?.nativeElement.focus();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (!this.resetPage) return;

      this.animation.pageEnter(this.resetPage.nativeElement);

      const cards = this.resetPage.nativeElement.querySelectorAll('.hero-card, .login-card');
      this.animation.cardsEnter(cards);
    }, 100);
  }
}
