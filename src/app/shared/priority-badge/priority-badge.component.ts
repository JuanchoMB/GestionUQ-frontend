import { Component, Input } from '@angular/core';
import { Prioridad } from '../../core/models/enums';
import { labelEnum } from '../../core/utils/labels';

@Component({
  selector: 'app-priority-badge',
  standalone: true,
  template: `<span class="badge" [class]="badgeClass">{{ label(prioridad) }}</span>`
})
export class PriorityBadgeComponent {
  @Input() prioridad: Prioridad | null | undefined;

  get badgeClass(): string {
    const map: Record<Prioridad, string> = {
      BAJA: 'badge badge-green',
      MEDIA: 'badge badge-blue',
      ALTA: 'badge badge-yellow',
      CRITICA: 'badge badge-red'
    };
    return this.prioridad ? map[this.prioridad] : 'badge badge-gray';
  }

  label = labelEnum;
}
