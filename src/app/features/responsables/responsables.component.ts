import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { UsuarioService } from '../../core/services/usuario.service';
import { UsuarioSimple } from '../../core/models/solicitud.model';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { extractErrorMessage, labelEnum } from '../../core/utils/labels';

@Component({
  selector: 'app-responsables',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  templateUrl: './responsables.component.html'
})
export class ResponsablesComponent implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  responsables: UsuarioSimple[] = [];
  loading = true;
  error = '';
  label = labelEnum;

  ngOnInit(): void {
    this.usuarioService.responsablesActivos().subscribe({
      next: data => { this.responsables = data; this.loading = false; },
      error: error => { this.error = extractErrorMessage(error); this.loading = false; }
    });
  }
}
