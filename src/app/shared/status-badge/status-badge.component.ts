import { Component, Input } from '@angular/core';
import { EstadoSolicitud } from '../../core/models/enums';
import { labelEnum } from '../../core/utils/labels';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `<span class="badge" [class]="badgeClass">{{ label(estado) }}</span>`
})
export class StatusBadgeComponent {
  @Input() estado: EstadoSolicitud | null | undefined;

  get badgeClass(): string {
    const map: Record<EstadoSolicitud, string> = {
      REGISTRADA: 'badge badge-gray',
      CLASIFICADA: 'badge badge-blue',
      EN_ATENCION: 'badge badge-yellow',
      ATENDIDA: 'badge badge-green',
      CERRADA: 'badge badge-purple'
    };
    return this.estado ? map[this.estado] : 'badge badge-gray';
  }

  label = labelEnum;
}
