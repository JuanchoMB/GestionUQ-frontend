export type TipoSolicitud =
  | 'REGISTRO_ASIGNATURAS'
  | 'HOMOLOGACION'
  | 'CANCELACION_ASIGNATURAS'
  | 'SOLICITUD_CUPOS'
  | 'CONSULTA_ACADEMICA'
  | 'OTRO';

export type Prioridad = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export type EstadoSolicitud =
  | 'REGISTRADA'
  | 'CLASIFICADA'
  | 'EN_ATENCION'
  | 'ATENDIDA'
  | 'CERRADA';

export type CanalOrigen = 'CSU' | 'CORREO' | 'SAC' | 'TELEFONICO' | 'PRESENCIAL' | 'OTRO';

export type ImpactoAcademico = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';

export type RolUsuario = 'ESTUDIANTE' | 'ADMINISTRATIVO' | 'COORDINADOR' | 'CONSULTOR';

export type AccionHistorial =
  | 'REGISTRO_SOLICITUD'
  | 'CLASIFICACION_SOLICITUD'
  | 'PRIORIZACION_SOLICITUD'
  | 'ASIGNACION_RESPONSABLE'
  | 'INICIO_ATENCION'
  | 'MARCAR_ATENDIDA'
  | 'CIERRE_SOLICITUD'
  | 'GENERACION_RESUMEN';

export const TIPOS_SOLICITUD: TipoSolicitud[] = [
  'REGISTRO_ASIGNATURAS',
  'HOMOLOGACION',
  'CANCELACION_ASIGNATURAS',
  'SOLICITUD_CUPOS',
  'CONSULTA_ACADEMICA',
  'OTRO'
];

export const PRIORIDADES: Prioridad[] = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];
export const ESTADOS_SOLICITUD: EstadoSolicitud[] = ['REGISTRADA', 'CLASIFICADA', 'EN_ATENCION', 'ATENDIDA', 'CERRADA'];
export const CANALES_ORIGEN: CanalOrigen[] = ['CSU', 'CORREO', 'SAC', 'TELEFONICO', 'PRESENCIAL', 'OTRO'];
export const IMPACTOS_ACADEMICOS: ImpactoAcademico[] = ['BAJO', 'MEDIO', 'ALTO', 'CRITICO'];
