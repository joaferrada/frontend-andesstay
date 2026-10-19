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
    │   ├── auth/                # AuthRoleService, roleGuard, guards de sesión
    │   ├── interceptors/        # http-error.interceptor (mensajes para 401/403/500)
    │   ├── models/              # Reservation, ReservationStatus, UserRole
    │   └── services/            # ReservationService (API de reservas)
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
        └── reservations/
            ├── pages/reservation-list/
            └── components/
                ├── reservation-form/
                ├── reservation-table/
                └── status-actions/
```

Cada componente tiene sus archivos `.ts`, `.html` y `.scss` en su propia carpeta. Los `.scss` importan los tokens con `@use 'styles/variables' as *;` (ruta configurada en `angular.json` con `stylePreprocessorOptions.includePaths`).

## Rutas

| Ruta            | Guards                     | Roles permitidos                 |
|-----------------|----------------------------|----------------------------------|
| `/`             | sesión                     | redirige a `/dashboard` o `/login` |
| `/login`        | sesión (si ya hay, redirige) | público                        |
| `/dashboard`    | `MsalGuard`, `roleGuard`   | cualquier usuario autenticado    |
| `/reservations` | `MsalGuard`, `roleGuard`   | Admin, Operador_Dominio, Cliente_Dominio, Auditor |

`roleGuard` lee `data.roles` de la ruta. Si el usuario no tiene ninguno de esos roles, vuelve al panel con un aviso.

## Roles y permisos

| Rol (Entra ID)     | Perfil       | Panel                               | Listar y filtrar | Crear | Cambiar estado | Eliminar |
|--------------------|--------------|-------------------------------------|:---:|:---:|:---:|:---:|
| `Admin`            | Administrador | Total de reservas y conteo por estado | ✔ | ✔ | ✔ | ✔ |
| `Operador_Dominio` | Recepción    | Llegadas y salidas de hoy           | ✔ | ✔ | ✔ | — |
| `Cliente_Dominio`  | Huésped      | Mis reservas y su estado            | ✔ | ✔ | — | — |
| `Auditor`          | Auditor      | Últimas reservas (solo lectura)     | ✔ | — | — | — |

La interfaz oculta las acciones no permitidas, pero la autorización real la aplica el backend. Si responde 403 se muestra "No tienes permisos para esta acción".

## Estados de reserva

| Estado              | Texto               | Transiciones permitidas          |
|---------------------|---------------------|----------------------------------|
| `CREADA`            | Creada              | Confirmar, Cancelar              |
| `CONFIRMADA`        | Confirmada          | Check-in pendiente, Cancelar     |
| `CHECKIN_PENDIENTE` | Check-in pendiente  | Registrar check-in, Cancelar     |
| `EN_ESTADIA`        | En estadía          | Registrar check-out              |
| `CHECKOUT`          | Check-out realizado | —                                |
| `CANCELADA`         | Cancelada           | —                                |

Las transiciones están definidas en `core/models/reservation-status.enum.ts` y se envían al backend con `PATCH /api/reservations/{id}/estado`.

## Próximas etapas

El menú muestra como deshabilitados (texto "Próxima etapa") los módulos de Alojamientos, Reportes y Auditoría, que todavía no tienen backend.
