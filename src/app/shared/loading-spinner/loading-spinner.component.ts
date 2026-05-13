import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  styles: [`
    .spinner-wrap { display: flex; align-items: center; justify-content: center; gap: 12px; color: #667085; padding: 30px; }
    .spinner { width: 22px; height: 22px; border: 3px solid #d0d5dd; border-top-color: #22577a; border-radius: 50%; animation: spin 900ms linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
  template: `
    <div class="spinner-wrap">
      <span class="spinner" aria-hidden="true"></span>
      <span>{{ text }}</span>
    </div>
  `
})
export class LoadingSpinnerComponent {
  @Input() text = 'Cargando información...';
}
