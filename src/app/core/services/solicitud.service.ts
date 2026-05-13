import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse, normalizePage } from '../models/api-response.model';
import {
  AsignarResponsable,
  CerrarSolicitudRequest,
  ClasificarPriorizar,
  FiltroSolicitudes,
  HistorialSolicitud,
  IniciarAtencionRequest,
  MarcarAtendidaRequest,
  Solicitud,
  SolicitudCreate,
  SugerirClasificacionPrioridadRequest,
  SugerirClasificacionPrioridadResponse,
  SugerirPrioridadRequest,
  SugerirPrioridadResponse
} from '../models/solicitud.model';

@Injectable({ providedIn: 'root' })
export class SolicitudService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/solicitudes`;

  listar(filtros: FiltroSolicitudes = {}): Observable<PageResponse<Solicitud>> {
    return this.http.get<ApiResponse<PageResponse<Solicitud> | Solicitud[]>>(this.baseUrl, {
      params: this.buildParams(filtros)
    }).pipe(map(response => normalizePage(response.data)));
  }

  misSolicitudes(filtros: Pick<FiltroSolicitudes, 'estado' | 'page' | 'size'> = {}): Observable<PageResponse<Solicitud>> {
    return this.http.get<ApiResponse<PageResponse<Solicitud> | Solicitud[]>>(`${this.baseUrl}/mis-solicitudes`, {
      params: this.buildParams(filtros)
    }).pipe(map(response => normalizePage(response.data)));
  }

  obtenerPorId(id: string): Observable<Solicitud> {
    return this.http.get<ApiResponse<Solicitud>>(`${this.baseUrl}/${id}`).pipe(map(response => response.data));
  }

  obtenerMiSolicitud(id: string): Observable<Solicitud> {
    return this.http.get<ApiResponse<Solicitud>>(`${this.baseUrl}/mis-solicitudes/${id}`).pipe(map(response => response.data));
  }

  registrar(dto: SolicitudCreate): Observable<Solicitud> {
    return this.http.post<ApiResponse<Solicitud>>(this.baseUrl, dto).pipe(map(response => response.data));
  }

  clasificar(id: string, dto: ClasificarPriorizar): Observable<Solicitud> {
    return this.http.put<ApiResponse<Solicitud>>(`${this.baseUrl}/${id}/clasificar`, dto).pipe(map(response => response.data));
  }

  asignar(id: string, dto: AsignarResponsable): Observable<Solicitud> {
    return this.http.put<ApiResponse<Solicitud>>(`${this.baseUrl}/${id}/asignar`, dto).pipe(map(response => response.data));
  }

  iniciarAtencion(id: string, dto: IniciarAtencionRequest): Observable<Solicitud> {
    return this.http.put<ApiResponse<Solicitud>>(`${this.baseUrl}/${id}/iniciar-atencion`, dto).pipe(map(response => response.data));
  }

  marcarAtendida(id: string, dto: MarcarAtendidaRequest): Observable<Solicitud> {
    return this.http.put<ApiResponse<Solicitud>>(`${this.baseUrl}/${id}/marcar-atendida`, dto).pipe(map(response => response.data));
  }

  cerrar(id: string, dto: CerrarSolicitudRequest): Observable<Solicitud> {
    return this.http.put<ApiResponse<Solicitud>>(`${this.baseUrl}/${id}/cerrar`, dto).pipe(map(response => response.data));
  }

  historial(id: string): Observable<HistorialSolicitud[]> {
    return this.http.get<ApiResponse<HistorialSolicitud[]>>(`${this.baseUrl}/${id}/historial`).pipe(map(response => response.data));
  }

  resumen(id: string): Observable<string> {
    return this.http.get<ApiResponse<string>>(`${this.baseUrl}/${id}/resumen`).pipe(map(response => response.data));
  }

  sugerirPrioridad(dto: SugerirPrioridadRequest): Observable<SugerirPrioridadResponse> {
    return this.http.post<ApiResponse<SugerirPrioridadResponse>>(`${this.baseUrl}/sugerir-prioridad`, dto).pipe(map(response => response.data));
  }

  sugerirClasificacionPrioridad(dto: SugerirClasificacionPrioridadRequest): Observable<SugerirClasificacionPrioridadResponse> {
    return this.http.post<ApiResponse<SugerirClasificacionPrioridadResponse>>(`${this.baseUrl}/sugerir-clasificacion-prioridad`, dto).pipe(map(response => response.data));
  }

  private buildParams(filtros: object): HttpParams {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });
    if (!params.has('size')) params = params.set('size', '20');
    if (!params.has('page')) params = params.set('page', '0');
    return params;
  }
}
