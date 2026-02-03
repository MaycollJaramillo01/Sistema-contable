# Sistema web de gestión financiera contable para asociaciones

Stack
- Next.js (App Router) + React + TypeScript
- TailwindCSS + Radix UI
- Supabase (PostgreSQL + Auth + Storage + RLS)
- Zod + React Hook Form
- TanStack Query + TanStack Table
- Vitest + Testing Library

## Setup local
1. Instalar dependencias
```bash
npm install
```
2. Crear `.env.local`
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_ROLE_KEY=... (opcional, solo server)
```
3. Ejecutar
```bash
npm run dev
```

## Supabase
### Migraciones
Aplicar SQL en `supabase/migrations/20250203120000_init.sql`.

### Seed
Ejecutar `supabase/seed.sql` para datos de ejemplo.

### Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (solo si se requiere en server, evitar en client)

## Deploy en Vercel
- Framework: Next.js
- Build: `next build`
- Output: `.next`
- Configurar variables de entorno en Vercel

## Tests
```bash
npm test
```

## Notas
- RLS estricta por `org_id` usando `org_members`.
- Middleware protege rutas y exige organización seleccionada.
- Services contables en `lib/services/accounting.ts` usan RPCs SQL.
