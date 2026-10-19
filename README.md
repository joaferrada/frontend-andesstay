# AndesStay · Frontend

Aplicación web de gestión de reservas para la red AndesStay: 20 hostales, cabañas y lodges de turismo de intereses especiales en los Andes y la Patagonia (Chile).

- Angular 19 con componentes standalone y rutas lazy (`loadComponent`).
- Autenticación con Microsoft Entra ID mediante MSAL (`@azure/msal-angular`).
- Autorización por *app roles* de Entra ID (claim `roles` del token).
- Estilos propios en SCSS, sin librerías de UI.

## Requisitos

- Node.js 22 y npm.
- Una cuenta de Entra ID con alguno de los roles de la aplicación asignado.

## Desarrollo

```bash
npm install
npm start          # equivale a ng serve
```

Abre `http://localhost:4200/`. Sin sesión, la aplicación muestra `/login`; con sesión, redirige a `/dashboard`.

## Build

```bash
npm run build      # ng build, salida en dist/frontend-andesstay/browser
```

El despliegue a GitHub Pages lo realiza el workflow `.github/workflows/deploy.yml`.

## Estructura de carpetas

```
src/
├── enviroments/                 # configuración de MSAL y del API Gateway (usada por el deploy)
├── styles/                      # _variables.scss, _mixins.scss, _base.scss
├── styles.scss                  # punto de entrada de estilos globales
└── app/
    ├── core/
    │   ├── auth/                # AuthRoleService (matrices de permisos), roleGuard, guards de sesión
    │   ├── interceptors/        # http-error.interceptor (401 → login, 403/503 con texto fijo)
    │   ├── models/              # Reservation, ReservationStatus, UserRole, Unit, AuditEvent, Kpis
    │   └── services/            # ReservationService, CatalogService, AuditService, ReportService
    ├── shared/
    │   ├── components/          # status-badge, empty-state, loading-spinner, confirm-dialog, toast
    │   └── pipes/               # statusLabel (CHECKIN_PENDIENTE → "Check-in pendiente")
    ├── layout/
    │   ├── shell/               # layout principal: sidebar + header + router-outlet
    │   ├── header/              # usuario conectado, roles como chips, cerrar sesión
    │   └── sidebar/             # menú filtrado por rol, colapsable en móvil
    └── features/
        ├── auth/login/          # pantalla "Iniciar sesión con Microsoft"
        ├── dashboard/           # tarjetas por rol con datos reales de reservas
        ├── reservations/
        │   ├── pages/reservation-list/      # tabla + filtro por estado
        │   ├── pages/reservation-editor/    # crear y editar
        │   └── components/
        │       ├── reservation-form/        # unidad del catálogo, fechas, precio = noches x tarifa
        │       ├── reservation-table/
        │       └── status-actions/
        ├── catalog/
        │   ├── pages/unit-list/             # tarjetas de unidades con filtros
        │   └── components/unit-form/        # crear, editar y dar de baja (Admin)
        ├── audit/
        │   ├── pages/audit-list/            # eventos con filtros y paginación
        │   └── components/reservation-timeline/
        └── reports/
            ├── pages/report-dashboard/      # KPIs, reservas por hora, unidades más demandadas
            └── components/bar-chart/        # gráfico de barras en CSS
```

Cada componente tiene sus archivos `.ts`, `.html` y `.scss` en su propia carpeta. Los `.scss` importan los tokens con `@use 'styles/variables' as *;` (ruta configurada en `angular.json` con `stylePreprocessorOptions.includePaths`).

## Rutas

| Ruta            | Guards                     | Roles permitidos                 |
|-----------------|----------------------------|----------------------------------|
| `/`             | sesión                     | redirige a `/dashboard` o `/login` |
| `/login`        | sesión (si ya hay, redirige) | público                        |
| `/dashboard`    | `MsalGuard`, `roleGuard`   | cualquier usuario autenticado    |
| `/reservations` | `MsalGuard`, `roleGuard`   | Admin, Operador_Dominio, Cliente_Dominio, Auditor |
| `/reservations/new` | `MsalGuard`, `roleGuard` | Admin, Operador_Dominio, Cliente_Dominio |
| `/reservations/:id/edit` | `MsalGuard`, `roleGuard` | Admin, Operador_Dominio, Cliente_Dominio |
| `/catalog`      | `MsalGuard`, `roleGuard`   | Admin, Operador_Dominio, Cliente_Dominio, Auditor |
| `/audit`        | `MsalGuard`, `roleGuard`   | Admin, Auditor |
| `/reports`      | `MsalGuard`, `roleGuard`   | Admin |

`roleGuard` lee `data.roles` de la ruta. Si el usuario no tiene ninguno de esos roles, vuelve al panel con un aviso. El menú lateral muestra cada pantalla solo a los mismos roles.

## Roles por pantalla

| Pantalla      | Admin | Operador_Dominio | Cliente_Dominio | Auditor |
|---------------|:---:|:---:|:---:|:---:|
| Panel         | ✔ (+ acceso a Reportería) | ✔ | ✔ | ✔ |
| Reservas      | ✔ | ✔ | ✔ (las suyas) | ✔ (solo lectura) |
| Catálogo      | ✔ (crear, editar, dar de baja) | ✔ (consulta) | ✔ (consulta) | ✔ (consulta) |
| Auditoría     | ✔ | — | — | ✔ |
| Reportería    | ✔ | — | — | — |

## Roles y permisos en reservas

Las matrices están definidas en un solo lugar, `core/auth/auth-role.service.ts`: `RESERVATION_PERMISSIONS`, `CATALOG_PERMISSIONS`, `AUDIT_PERMISSIONS` y `REPORT_PERMISSIONS`. Se exponen como `canCreate`, `canEdit`, `canChangeStatus`, `canDelete`, `canEditPrice`, `canManageCatalog`, `canViewAudit` y `canViewReports`, y las usan las plantillas, el menú y `app.routes.ts`.

| Rol (Entra ID)     | Perfil        | Panel                                 | Ver / filtrar | Crear | Editar | Cambiar estado | Eliminar |
|--------------------|---------------|---------------------------------------|:---:|:---:|:---:|:---:|:---:|
| `Admin`            | Administrador | Total de reservas y conteo por estado | ✔ | ✔ | ✔ | ✔ | ✔ |
| `Operador_Dominio` | Recepción     | Llegadas y salidas de hoy             | ✔ | ✔ | ✔ | ✔ | — |
| `Cliente_Dominio`  | Huésped       | Mis reservas y su estado              | ✔ (las suyas) | ✔ | ✔ (las suyas) | — | — |
| `Auditor`          | Auditor       | Últimas reservas (solo lectura)       | ✔ | — | — | — | — |

`GET /api/reservations` ya devuelve solo las reservas del huésped del token (Admin, Operador y Auditor ven todas), por lo que el frontend no filtra por usuario. La interfaz oculta las acciones no permitidas, pero la autorización real la aplica el backend.

Al crear una reserva se elige una unidad activa con cupos del catálogo. El precio es noches × tarifa por noche, y solo el Admin puede ajustarlo. Admin y Auditor ven en la tabla un enlace «Ver trazabilidad» que abre la línea de tiempo de la reserva en Auditoría.

## API de reservas

Todas las llamadas van al BFF (`environment.apiConfig.uri`) desde `core/services/reservation.service.ts`:

| Método y ruta                         | Uso                     | Body |
|---------------------------------------|-------------------------|------|
| `GET /api/reservations[?status=]`     | Listar                  | — |
| `GET /api/reservations/{id}`          | Detalle (404 → "no encontrada") | — |
| `POST /api/reservations`              | Crear (parte en `CREADA`) | `{ unidadId, alojamientoNombre, fechaInicio, fechaFin, precioTotal, huespedNombre, huespedEmail }` |
| `PUT /api/reservations/{id}`          | Editar (no cambia el estado) | mismo body |
| `PUT /api/reservations/{id}/status`   | Cambiar estado          | `{ "status": "<ESTADO>" }` |
| `DELETE /api/reservations/{id}`       | Eliminar (204)          | — |

Fechas en formato `yyyy-MM-dd`. Los errores llegan como `{ timestamp, status, error, message }`: se muestra `message` si existe y, si no, un texto genérico por código. Un 401 inicia el login de MSAL. Un 403 muestra "No tienes permisos para esta acción" y mantiene la sesión. Un 503 muestra "Servicio no disponible, intenta más tarde". Un 409 al confirmar una reserva muestra "No quedan cupos disponibles para esta unidad".

## API de catálogo, auditoría y reportería

| Método y ruta | Uso |
|---|---|
| `GET /api/catalog/units?tipo=&hostal=&soloDisponibles=` | Listar unidades |
| `GET /api/catalog/units/{id}` | Detalle de una unidad |
| `POST /api/catalog/units` · `PUT /api/catalog/units/{id}` | Crear y editar (Admin) |
| `DELETE /api/catalog/units/{id}` | Baja lógica (Admin) |
| `GET /api/audit/events?actor=&tipo=&reservationId=&desde=&hasta=&page=&size=` | Eventos paginados (`page` desde 0, fechas `yyyy-MM-dd`) |
| `GET /api/audit/reservations/{id}/timeline` | Línea de tiempo de una reserva |
| `GET /api/report/kpis?range=last24h\|last7d\|last30d` | KPIs |
| `GET /api/report/top-units?range=&limit=5` | Unidades más demandadas |

## Estados de reserva

| Estado              | Texto               | Transiciones permitidas          |
|---------------------|---------------------|----------------------------------|
| `CREADA`            | Creada              | Confirmar, Cancelar              |
| `CONFIRMADA`        | Confirmada          | Check-in pendiente, Cancelar     |
| `CHECKIN_PENDIENTE` | Check-in pendiente  | Registrar check-in, Cancelar     |
| `EN_ESTADIA`        | En estadía          | Registrar check-out              |
| `CHECKOUT`          | Check-out realizado | —                                |
| `CANCELADA`         | Cancelada           | —                                |

Las transiciones están definidas en `core/models/reservation-status.enum.ts` y coinciden con el backend. Si un cambio es rechazado con 409, se muestra el `message` del backend (incluye las transiciones posibles) y se recarga el listado.
