# Agent.md - Instrucciones de Arquitectura y Agente IA

## 1. Tech Stack
* **Framework:** Next.js (App Router, React 19 / TypeScript).
* **Styling:** Tailwind CSS + Framer Motion + Lucide React.
* **Database & Auth:** Supabase (PostgreSQL + RLS).
* **Calendar Integration:** Official `googleapis` Node.js SDK.
* **Validation:** Zod schemas.

---

## 2. Reglas de Desarrollo & Código

### Server Actions & Data Fetching
* Toda la lógica sensible (Google Calendar API, mutaciones de BD, encriptación) DEBE ser ejecutada en **Server Actions** (`use server`) dentro del directorio `/app/actions`.
* Los clientes NUNCA deben invocar directamente los SDKs de Google ni manipular `refresh_tokens`.

### Directrices de Base de Datos
* Toda consulta a tablas con Soft-Delete DEBE filtrar explícitamente `WHERE deleted_at IS NULL`.
* Utilizar únicamente UUID v4 para Llaves Primarias.
* Al eliminar un paciente, el Soft-Delete se propaga a sus citas automáticamente mediante el trigger `trg_cascade_patient_soft_delete`.

---

## 3. Estructura de Rutas del Proyecto

```text
/src/app
├── (public)
│   ├── page.tsx               # Landing Page Bento Grid
│   └── actions/
│       ├── availability.ts    # Consulta slots libres cruzando Google API + BD
│       └── book.ts            # Registra Paciente, Cita e inserta Evento en Google
├── (admin)
│   ├── layout.tsx             # Protegido con Middleware RBAC
│   ├── dashboard/page.tsx     # Tabla de citas y gestión de pacientes
│   └── settings/page.tsx      # OAuth Google & Horarios de atención
└── api/
    └── auth/google/callback   # Manejador del flujo OAuth 2.0 de Google

```