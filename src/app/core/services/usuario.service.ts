import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { UsuarioSimple } from '../models/solicitud.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/usuarios`;

  responsablesActivos(): Observable<UsuarioSimple[]> {
    return this.http.get<ApiResponse<UsuarioSimple[]>>(`${this.baseUrl}/responsables-activos`)
      .pipe(map(response => response.data));
  }
}
