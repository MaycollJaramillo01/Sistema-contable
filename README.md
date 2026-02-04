# Sistema Contable Comunales

Plataforma completa para la contabilidad de asociaciones comunales con doble partida, multi-tenant, RLS, auditoría, facturación y reportes listos para desplegar en Vercel.

## Stack
- **Frontend**: Next.js App Router + TypeScript + Reactstrap + Bootstrap 5
- **Backend/BBDD/Auth/Storage**: Supabase (PostgreSQL + RLS + Auth + Storage)
- **Deploy**: Vercel
- **Estado global**: TanStack Query + Supabase client

## Instalación local
1. Instala dependencias: `npm install`
2. Configura variables de entorno (ver sección siguiente)
3. Ejecuta el servidor: `npm run dev`
4. Accede a `/register` para crear el primer admin con su organización y contraseña (el registro crea automáticamente perfil, rol ADMIN y cuentas contables base). Luego usa `/login`.

## Variables de entorno
| Variable | Descripción |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública del proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Key pública para el cliente. |
| `SUPABASE_SERVICE_ROLE_KEY` | Key de servicio para operaciones de backend, triggers y storage. |

> En Vercel configura estas mismas variables en `Settings > Environment Variables` para producción y previews.

## Supabase y RLS
- Las migraciones SQL están en `supabase/migrations`:
  - `0001_init.sql`: crea el modelo relacional (organizaciones, perfiles, roles, cuentas, asientos, clientes/proveedores, facturas, presupuestos, attachments, auditoría, notificaciones, etc.).
  - `0002_rls.sql`: añade roles base, funciones helper (`current_org_id`, `has_role`, `can_modify_accounting`), trigger de auditoría (`audit_log_trigger`), política RLS por módulo, vistas (`v_account_balances`, `v_balance_sheet`, `v_income_statement`, `v_ar_aging`, `v_ap_aging`, `v_budget_vs_actual`) y la RPC `fn_enqueue_overdue_alerts`.
- Usa Supabase CLI para correrlas:
  ```bash
  npx supabase migration run
  ```
  o bien `npx supabase db push` si estás sincronizado con los archivos.
- Todos los datos tienen `organization_id`; las políticas sólo permiten ver/editar dentro de la organización y según rol (ADMIN/CONTADOR/TESORERO para escribir, AUDITOR/LECTOR sólo lectura).

## Storage seguro
- Crea un bucket privado llamado `attachments` en Supabase Storage.
- Guarda los comprobantes (PDF/JPG/PNG) en ese bucket y registra su metadata en la tabla `attachments` (incluye `entity_type`, `entity_id`, `mime_type`, `storage_path`).
- Añade políticas de Storage que verifiquen `organization_id` en los claims JWT para evitar cruces entre organizaciones.

## Rutas principales
| Ruta | Descripción |
| --- | --- |
| `/login`, `/register` | Auth básica con formularios accesibles y validación. `/register` crea organización y rol ADMIN. |
| `/dashboard` | Indicadores clave, alertas sobre vencidos y ejecución de `fn_enqueue_overdue_alerts`. |
| `/accounts` | Catálogo contable jerárquico por tipo con cálculo de saldos. |
| `/journal` | Libro diario (asientos) generado automáticamente. |
| `/ar`, `/ap` | CxC/CxP con clientes/proveedores, facturas y pagos. |
| `/incomes`, `/expenses` | Registro de ingresos/gastos con validaciones y alertas de presupuesto. |
| `/billing` | Facturación con totales automáticos, impuestos y descuentos. |
| `/budgets` | Presupuesto mensual vs real con alertas de variaciones. |
| `/maintenance` | CRUD de proyectos, centros de costo e impuestos. |
| `/queries` | Filtros avanzados por cuenta, rango y estado. |
| `/reports` | Balance, resultados, aging, libros con export CSV y vista imprimible. |
| `/security` | Gestión de roles RBAC y visualización de asignaciones. |

## Características técnicas esenciales
- **Autenticación**: `AuthProvider` (lib/context/auth.tsx) captura sesión, perfil, rol y organización. `ProtectedLayout` en `app/(protected)/layout.tsx` protege rutas y siempre muestra sidebar/topbar.
- **Supabase client**: `lib/supabase/client.ts` (navegador) y `lib/supabase/server.ts` (server actions). Las llamadas se ejecutan dentro de TanStack Query (`lib/providers/AppProviders.tsx`).
- **Auditoría**: Trigger `audit_log_trigger` escribe en `audit_logs` con cada INSERT/UPDATE/DELETE en tablas críticas (cuentas, facturación, ingresos, gastos, presupuestos, asientos).
- **Vistas SQL**: incluidas `v_account_balances`, `v_balance_sheet`, `v_income_statement`, `v_ar_aging`, `v_ap_aging`, `v_budget_vs_actual` para reportes y dashboards.
- **Notificaciones**: RPC `fn_enqueue_overdue_alerts` crea alertas por facturas vencidas en CxC y CxP y se invoca desde el dashboard.
- **RBAC**: `has_role` y `can_modify_accounting` permiten diferenciar permisos (ADMIN/CNT/TES para escribir, AUD/LECTOR solo lectura). Los usuarios se asignan desde `/security`.

## Ejecución y pruebas
- `npm run dev`: servidor de desarrollo.
- `npm run build`: compilación de producción.
- `npm run start`: arranque en modo producción.
- `npm run lint`: análisis con ESLint (config Next.js).

## Despliegue en Vercel
1. Configura env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
2. Apunta el build a `npm run build` y `npm run start` como comando de producción.
3. Después del build inicial ejecuta `/register` para crear la organización y el admin.

## Creación de usuarios y roles
- Registra nuevos usuarios desde Supabase Auth (o por la UI si se habilita) y crea su perfil (`profiles`) con el `organization_id` correcto.
- Usa `/security` para asignar roles (ADMIN, CONTADOR, TESORERO, AUDITOR, LECTOR) dentro de la misma organización.
- Los roles controlan acceso granular: sólo ADMIN/TESORERO/CONTADOR pueden crear movimientos contables, mientras que AUDITOR/LECTOR solo pueden consultar.

## Observaciones finales
- Todos los formularios son accesibles: usan `labels`, mensajes de error y `aria` necesarios, y la navegación contempla `tabindex` natural.
- Las tablas tienen filtros simples; puedes extenderlas con paginación completa si lo necesitas.
- Exportar reportes (CSV) y la vista `printable-card` permiten impresión clara de comprobantes y balances.
- Para reglas contables adicionales (ej: doble partida automática), aprovecha `journal_entries`, `journal_lines` y crea funciones adicionales para registrar asientos cuando haya ingresos o gastos.
