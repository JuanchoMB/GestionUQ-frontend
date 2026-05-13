import { AccionHistorial, CanalOrigen, EstadoSolicitud, ImpactoAcademico, Prioridad, RolUsuario, TipoSolicitud } from './enums';

export interface ResponsableResumen {
  id: string;
  username: string;
  nombreCompleto: string;
}

export interface Solicitud {
  id: string;
  solicitanteId: string;
  tipoSolicitud: TipoSolicitud;
  descripcion: string;
  canalOrigen: CanalOrigen;
  impactoAcademico?: ImpactoAcademico | null;
  fechaLimite?: string | null;
  fechaHoraRegistro: string;
  identificacionSolicitante: string;
  estado: EstadoSolicitud;
  prioridad?: Prioridad | null;
  justificacionPrioridad?: string | null;
  responsable?: ResponsableResumen | null;
  fechaCierre?: string | null;
  observacionCierre?: string | null;
}

export interface SolicitudCreate {
  tipoSolicitud: TipoSolicitud;
  descripcion: string;
  canalOrigen: CanalOrigen;
  impactoAcademico?: ImpactoAcademico | null;
  fechaLimite?: string | null;
}

export interface FiltroSolicitudes {
  page?: number;
  size?: number;
  estado?: EstadoSolicitud | '';
  tipoSolicitud?: TipoSolicitud | '';
  prioridad?: Prioridad | '';
  responsableId?: string | '';
  descripcion?: string;
  identificacionSolicitante?: string;
}

export interface ClasificarPriorizar {
  tipoSolicitud: TipoSolicitud;
  prioridad?: Prioridad | null;
  justificacionPrioridad?: string | null;
}

export interface AsignarResponsable {
  responsableId: string;
}

export interface IniciarAtencionRequest {
  observacion?: string | null;
}

export interface MarcarAtendidaRequest {
  observacion: string;
}

export interface CerrarSolicitudRequest {
  observacionCierre: string;
}

export interface HistorialSolicitud {
  fechaHora: string;
  accion: AccionHistorial;
  usuarioResponsable: string;
  detalle?: string | null;
  observaciones?: string | null;
}

export interface UsuarioSimple {
  id: string;
  username: string;
  nombreCompleto: string;
  rol: RolUsuario;
  activo: boolean;
}

export interface SugerirPrioridadRequest {
  tipoSolicitud: TipoSolicitud;
  impactoAcademico: ImpactoAcademico;
  fechaLimite?: string | null;
}

export interface SugerirPrioridadResponse {
  prioridadSugerida: Prioridad;
  puntajeTotal: number;
  razones: string[];
}

export interface SugerirClasificacionPrioridadRequest {
  descripcion: string;
  canalOrigen: CanalOrigen;
  impactoAcademico: ImpactoAcademico;
  fechaLimite?: string | null;
}

export interface SugerirClasificacionPrioridadResponse {
  tipoSolicitudSugerido: TipoSolicitud;
  prioridadSugerida: Prioridad;
  confianza?: number;
  puntajeTotal?: number;
  razones: string[];
  requiereConfirmacionHumana: boolean;
}
