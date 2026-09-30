# On Time — Dra. Mirian Galán

Landing informativa + portal de gestión de citas para una consulta de nutrición.
Next.js 16 (App Router, React 19, TypeScript) · Tailwind CSS 4 · Supabase · Google Calendar · Resend.

Documentación de producto y diseño: [`PRD.md`](PRD.md), [`agent.md`](agent.md), [`DESING.md`](DESING.md), [`Memory.md`](Memory.md).

## Cómo funciona

- **La landing es solo informativa.** No hay reserva pública: los botones llevan a WhatsApp con un mensaje prellenado.
- **La doctora (o personal con permiso) crea todas las citas** desde el portal.
- Al crear una cita:
  1. se reserva el horario de forma atómica (sin overbooking),
  2. se crea el evento en Google Calendar (con Meet si es virtual) y la paciente recibe la invitación,
  3. la paciente recibe un correo con la **guía de preparación** (PDF) y un enlace para **subir sus estudios**.
- Cada cita guarda motivo, objetivo y los datos de preconsulta (fecha de nacimiento, condiciones de salud).

## Modo demo (sin configurar nada)

```bash
npm install
npm run dev        # http://localhost:3000
```

Si faltan las variables de Supabase (o con `USE_MOCK=1`), la app usa los datos de ejemplo de `src/_mock`.
Viven en memoria y se reinician con el servidor. Todo es funcional, incluido el login:

| Cuenta | Correo | Contraseña |
|---|---|---|
| Doctora (`DOCTOR`) | `doctora@demo.com` | `Doctora123!` |
| Asistente (`ASSISTANT`) | `asistente@demo.com` | `Asistente123!` |

En demo: 6 pacientes con historial, citas pasadas y próximas, eventos "ocupados" de un Google Calendar simulado,
estudios de ejemplo, Meet falso en citas virtuales y correos que solo se escriben en la consola del servidor.

## Mapa de rutas

| Ruta | Acceso | Descripción |
|---|---|---|
| `/` | Público | Landing informativa (enlaces a WhatsApp, Instagram y TikTok) |
| `/documentos/[token]` | Público con enlace | La paciente sube sus estudios (PDF/JPG/PNG/WEBP/HEIC, 10 MB, hasta 10 por cita) |
| `/login` | Público | Acceso al portal |
| `/dashboard` | `appointments:read` | Próximas citas y citas por cerrar |
| `/dashboard/new` | `appointments:write` | Crear cita (paciente existente o nueva) |
| `/history` | `appointments:read` | Historial general con filtros (paciente, estado, fechas) y paginación |
| `/patients` | `patients:read` | Lista de pacientes |
| `/patients/[id]` | `patients:read` | Ficha e historial de citas de la paciente |
| `/settings` | `settings:manage` (solo DOCTOR) | Conectar Google Calendar y editar el horario de atención |
| `/api/auth/google/start` | Solo DOCTOR | Inicia la conexión con Google (en demo la simula) |
| `/api/auth/google/callback` | Solo DOCTOR | Recibe y guarda (encriptados) los tokens de Google |
| `/api/mock-files/[id]` | Sesión, solo demo | Sirve los PDF de ejemplo |

`/dashboard`, `/patients`, `/history` y `/settings` pasan por `src/proxy.ts` (redirige a `/login` sin sesión);
los permisos se verifican además en cada página y Server Action (`src/lib/auth.ts`).

### Roles y permisos

| Permiso | DOCTOR | ASSISTANT |
|---|:-:|:-:|
| `appointments:read` / `appointments:write` | ✅ | ✅ |
| `appointments:delete` (cancelar, eliminar cita o paciente) | ✅ | ❌ |
| `patients:read` / `patients:write` | ✅ | ✅ |
| `settings:manage` (Google y horarios) | ✅ | ❌ |

## Producción

1. `cp .env.example .env.local` y completa las variables (con Supabase configurado, el modo demo se apaga solo).
2. **Supabase:** en el SQL Editor ejecuta, en orden, `supabase/migrations/0001_init.sql` y
   `0002_booking_auth_documents.sql`. Crean las tablas, RLS cerrado (solo el backend accede), el bucket privado
   `patient-documents`, la función atómica `book_appointment` y un horario base (lun–vie 9–12 y 14–17).
3. **Usuarios del portal:**
   ```bash
   npm run create-user -- doctora@correo.com "<contraseña de 10+ caracteres>" "Dra. Mirian Galán" DOCTOR
   npm run create-user -- asistente@correo.com "<contraseña>" "Nombre" ASSISTANT
   ```
4. **Google Calendar:** en Google Cloud crea un cliente OAuth (Web), activa Calendar API y agrega el redirect
   `GOOGLE_REDIRECT_URI`. Luego entra a `/settings` → *Conectar Google Calendar*.
5. **Correos:** crea una clave de [Resend](https://resend.com) (`RESEND_API_KEY`) y verifica tu dominio para `EMAIL_FROM`.
6. `TOKEN_ENCRYPTION_KEY`: 32 bytes en base64 (el comando está en `.env.example`).
7. `npm run build && npm start`.

### Variables de entorno

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_APP_URL` | URL pública (enlaces de los correos) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase (las tres activan el modo real) |
| `USE_MOCK` | `1` fuerza el modo demo aunque Supabase esté configurado |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | OAuth de Google Calendar |
| `TOKEN_ENCRYPTION_KEY` | Encripta los tokens de Google en reposo (AES-256-GCM) |
| `RESEND_API_KEY`, `EMAIL_FROM` | Envío de correos |
| `MOCK_SESSION_SECRET` | (opcional) firma de la cookie de sesión del modo demo |

## Estructura

```
src/
  app/            rutas: (public) landing y /documentos · (admin) dashboard, history, patients, settings · login · api
  components/     landing/ · booking/ (calendario, subida de estudios) · admin/ · ui/ (íconos)
  lib/            data/ (contrato + implementación Supabase), booking, booking-service, availability,
                  google, email, auth, crypto, mode, site (contacto)
  _mock/          modo demo: usuarios, pacientes, citas, Google simulado, sesión
  assets/         guía de preparación (PDF) adjunta a los correos
  proxy.ts        protección del área admin
public/           imágenes (foto de la doctora, sin fondo)
scripts/          create-user.mjs · build-icons.mjs
supabase/         migraciones SQL
```

Notas de arquitectura:
- **Acceso a datos:** `src/lib/data` define un contrato (`DataApi`) con dos implementaciones: Supabase y `src/_mock/db.ts`.
  El resto de la app no sabe cuál usa (`db()`).
- **Server Actions:** la lógica sensible (Google, mutaciones, cifrado) corre solo en el servidor.
- **Soft-delete:** las tablas con `deleted_at` se filtran siempre; eliminar un paciente oculta sus citas.
- **Disponibilidad:** horario de atención − citas existentes − eventos ocupados de Google Calendar.
  La base de datos impide citas solapadas incluso ante reservas simultáneas.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Compilar y servir en producción |
| `npm run lint` | ESLint |
| `npm run create-user` | Crear usuario del portal (requiere `.env.local`) |
| `npm run icons` | Regenera `src/lib/icon-data.ts` con los íconos usados (`lucide:*`, `logos:*`, `simple-icons:*`) |

Los íconos van empaquetados como SVG en línea (sin peticiones de red). Al usar un ícono nuevo, corre `npm run icons`.

## Pendiente antes de publicar

- Reemplazar el contenido de ejemplo de la landing (testimonios, textos de especialidades y segunda foto).
- Probar el flujo completo contra un proyecto real de Supabase, Google y Resend (hasta ahora solo se probó en modo demo).
- Añadir control de intentos (rate limit) a `/login` y a la subida de estudios.
- Si se elimina una paciente, el evento de Google Calendar de sus citas no se borra (solo al cancelar o eliminar la cita).
