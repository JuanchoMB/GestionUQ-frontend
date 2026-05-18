import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { CrearResponsableRequest, UsuarioSimple } from '../models/solicitud.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/usuarios`;

  responsablesActivos(): Observable<UsuarioSimple[]> {
    return this.http.get<ApiResponse<UsuarioSimple[]>>(`${this.baseUrl}/responsables-activos`)
      .pipe(map(response => response.data));
  }

  responsablesGestion(): Observable<UsuarioSimple[]> {
    return this.http.get<ApiResponse<UsuarioSimple[]>>(`${this.baseUrl}/responsables`)
      .pipe(map(response => response.data));
  }

  crearResponsable(request: CrearResponsableRequest): Observable<UsuarioSimple> {
    return this.http.post<ApiResponse<UsuarioSimple>>(`${this.baseUrl}/responsables`, request)
      .pipe(map(response => response.data));
  }

  desactivarResponsable(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/responsables/${id}`)
      .pipe(map(() => undefined));
  }

  activarResponsable(id: string): Observable<void> {
    return this.http.patch<ApiResponse<void>>(`${this.baseUrl}/responsables/${id}/activar`, {})
      .pipe(map(() => undefined));
  }
}
