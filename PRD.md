# PRD.md - Documento de Requerimientos del Producto

## 1. Resumen Ejecutivo
Plataforma médica web ligera que combina una landing page de alta conversión para una doctora con un motor de reservas en tiempo real. Elimina la fricción de agendamiento manual integrando directamente **Google Calendar API** (sincronización bidireccional) y persiste pacientes y citas mediante **Supabase**.

---

## 2. Historias de Usuario & Alcance

### Módulo Público (Landing Page + Citas)
* **HU-01 [Perfil Médico]:** El paciente puede visualizar biografía, especialidad, costo de consulta, ubicación y preguntas frecuentes.
* **HU-02 [Consulta de Disponibilidad]:** El paciente selecciona una fecha y el sistema calcula en tiempo real los bloques libres cruzando la agenda laboral con los eventos de Google Calendar.
* **HU-03 [Registro & Reserva]:** El paciente ingresa sus datos (Nombre, Email, Teléfono, Cédula/DNI opcional y Motivo). El sistema registra/actualiza el registro en la tabla `patients` y genera la cita (`appointments`).
* **HU-04 [Notificación Automática]:** El paciente y la doctora reciben la invitación de Google Calendar con enlace a Meet (si es virtual).

### Módulo Administrativo (Doctora / Asistente)
* **HU-05 [Autenticación RBAC]:** Control de acceso por roles (`DOCTOR` y `ASSISTANT`).
* **HU-06 [Google OAuth Connect]:** Vincular la cuenta de Google Calendar para sincronizar disponibilidad y refrescar tokens en segundo plano.
* **HU-07 [Gestión de Citas & Pacientes]:** Panel para visualizar citas agendadas, cambiar estados (`CONFIRMED`, `CANCELLED`, `COMPLETED`) y aplicar *Soft-Delete*.

---

## 3. Matriz de Roles y Permisos (RBAC)

| Permiso Code | Descripción | Rol DOCTOR | Rol ASSISTANT |
| :--- | :--- | :---: | :---: |
| `appointments:read` | Consultar agenda de citas | ✅ | ✅ |
| `appointments:write` | Crear / Modificar citas manualmente | ✅ | ✅ |
| `appointments:delete` | Cancelar cita / Soft-delete | ✅ | ❌ |
| `patients:read` | Ver listado e historial de pacientes | ✅ | ✅ |
| `patients:write` | Registrar / Editar datos de paciente | ✅ | ✅ |
| `settings:manage` | Configurar horarios base y OAuth de Google | ✅ | ❌ |

---

## 4. Criterios de Aceptación Técnicos
* **Performance:** Google Lighthouse $\ge 90$ en Performance, Accessibility y SEO en móvil.
* **Resiliencia API:** Si el `access_token` de Google expira, el backend debe utilizar el `refresh_token` (encriptado) de forma transparente.
* **Cero Overbooking:** La API debe validar la disponibilidad del horario mediante una transacción atómica inmediatamente antes de guardar la cita.