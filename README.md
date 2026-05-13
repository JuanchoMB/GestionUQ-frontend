# Frontend - Sistema de Triage y Gestión de Solicitudes Académicas

Frontend Angular standalone conectado al backend `ProyectoGestionUQ`.

## Stack

- Angular standalone components
- Reactive Forms
- HttpClient con interceptor JWT
- Guards de autenticación y roles
- CSS propio sin librerías UI externas

## Endpoints consumidos

Base URL por defecto:

```ts
http://localhost:8080/api
```

Endpoints principales:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/solicitudes`
- `GET /api/solicitudes/mis-solicitudes`
- `POST /api/solicitudes`
- `GET /api/solicitudes/{id}`
- `PUT /api/solicitudes/{id}/clasificar`
- `PUT /api/solicitudes/{id}/asignar`
- `PUT /api/solicitudes/{id}/iniciar-atencion`
- `PUT /api/solicitudes/{id}/marcar-atendida`
- `PUT /api/solicitudes/{id}/cerrar`
- `GET /api/solicitudes/{id}/historial`
- `GET /api/solicitudes/{id}/resumen`
- `POST /api/solicitudes/sugerir-prioridad`
- `POST /api/solicitudes/sugerir-clasificacion-prioridad`
- `GET /api/usuarios/responsables-activos`

## Roles soportados

- `ESTUDIANTE`
- `ADMINISTRATIVO`
- `COORDINADOR`
- `CONSULTOR`

El frontend normaliza también roles recibidos como `ROLE_ADMINISTRATIVO`, `ROLE_COORDINADOR`, etc.

## Usuarios demo detectados en el backend

El backend inicializa estos usuarios en perfiles no productivos:

- `admin1 / 123456`
- `coord1 / 123456`
- `est1 / 123456`

## Instalación

Desde esta carpeta:

```bash
npm install
npm start
```

Luego abre:

```txt
http://localhost:4200
```

Asegúrate de tener el backend corriendo en:

```txt
http://localhost:8080
```

## Configuración de API

Edita si necesitas cambiar la URL:

```txt
src/environments/environment.ts
src/environments/environment.prod.ts
```

## Flujo implementado

1. Login con JWT.
2. Dashboard con métricas.
3. Registro de solicitud.
4. Consulta con filtros.
5. Detalle de solicitud.
6. Clasificación y priorización.
7. Sugerencia de prioridad o clasificación con IA/fallback.
8. Asignación de responsable activo.
9. Inicio de atención.
10. Marcado como atendida.
11. Cierre con observación obligatoria.
12. Bloqueo visual de modificación cuando está cerrada.
13. Historial auditable.
14. Lista de responsables activos.

## Reglas importantes reflejadas en el frontend

- Una solicitud cerrada queda en modo solo lectura.
- Solo `ADMINISTRATIVO` y `COORDINADOR` gestionan clasificación, asignación, atención y cierre.
- `ESTUDIANTE` puede crear y consultar sus solicitudes.
- `CONSULTOR` puede consultar solicitudes y responsables, pero no modificar.
- La IA es asistiva: si falla, el usuario puede continuar manualmente.

## Comandos útiles

```bash
npm start
npm run build
```
