-- 0002: auth con Supabase Auth, datos del formulario de preconsulta, documentos,
-- anti-overbooking a nivel de BD, RLS y función atómica de reserva.

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1. USUARIOS ADMIN -> Supabase Auth (auth.users guarda la contraseña)
ALTER TABLE users DROP COLUMN password_hash;
ALTER TABLE users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE users
    ADD CONSTRAINT users_auth_fk FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. PACIENTES: campos del formulario de preconsulta
ALTER TABLE patients
    ADD COLUMN birth_date DATE NULL,
    ADD COLUMN health_conditions TEXT NULL;

-- Email único solo entre pacientes activos (permite re-registrar tras soft-delete)
ALTER TABLE patients DROP CONSTRAINT patients_email_key;
CREATE UNIQUE INDEX patients_email_active_uq ON patients (lower(email)) WHERE deleted_at IS NULL;

-- 3. CITAS: motivo, objetivo y token para subir documentos
ALTER TABLE appointments RENAME COLUMN reason TO main_reason;
ALTER TABLE appointments
    ADD COLUMN goals TEXT NULL,
    ADD COLUMN upload_token UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    ADD COLUMN google_sync_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (google_sync_status IN ('PENDING', 'SYNCED', 'FAILED', 'SKIPPED'));

CREATE INDEX appointments_start_idx ON appointments (start_time) WHERE deleted_at IS NULL;

-- Cero overbooking: dos citas activas no pueden solaparse, pase lo que pase en la app.
ALTER TABLE appointments
    ADD CONSTRAINT appointments_no_overlap
    EXCLUDE USING gist (tstzrange(start_time, end_time) WITH &&)
    WHERE (status <> 'CANCELLED' AND deleted_at IS NULL);

-- 4. DOCUMENTOS (analíticas, imágenes, PDF) subidos por la paciente
CREATE TABLE appointment_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    storage_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes INT NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX appointment_documents_appt_idx ON appointment_documents (appointment_id) WHERE deleted_at IS NULL;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('patient-documents', 'patient-documents', false, 10485760,
        ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'])
ON CONFLICT (id) DO NOTHING;

-- 5. RLS: todas las tablas cerradas; solo el backend (service role) accede.
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_documents ENABLE ROW LEVEL SECURITY;

-- 6. RESERVA ATÓMICA: paciente (nueva o existente) + cita en una sola transacción.
CREATE OR REPLACE FUNCTION book_appointment(
    p_existing BOOLEAN,
    p_full_name TEXT,
    p_email TEXT,
    p_phone TEXT,
    p_birth_date DATE,
    p_identification_id TEXT,
    p_health_conditions TEXT,
    p_type TEXT,
    p_start TIMESTAMP WITH TIME ZONE,
    p_end TIMESTAMP WITH TIME ZONE,
    p_main_reason TEXT,
    p_goals TEXT
) RETURNS TABLE (appointment_id UUID, patient_id UUID, upload_token UUID, patient_name TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_column
DECLARE
    v_patient patients%ROWTYPE;
    v_appt appointments%ROWTYPE;
    v_digits TEXT := regexp_replace(p_phone, '\D', '', 'g');
BEGIN
    SELECT * INTO v_patient FROM patients
    WHERE lower(email) = lower(p_email) AND deleted_at IS NULL
    FOR UPDATE;

    IF p_existing THEN
        -- Paciente existente: debe coincidir correo Y teléfono (últimos 7 dígitos).
        IF NOT FOUND
           OR right(regexp_replace(v_patient.phone, '\D', '', 'g'), 7) <> right(v_digits, 7) THEN
            RAISE EXCEPTION 'PATIENT_NOT_FOUND' USING ERRCODE = 'P0002';
        END IF;
        UPDATE patients
           SET health_conditions = COALESCE(p_health_conditions, health_conditions)
         WHERE id = v_patient.id
        RETURNING * INTO v_patient;
    ELSIF FOUND THEN
        -- Correo ya registrado: solo completa campos vacíos, nunca sobrescribe datos previos.
        UPDATE patients
           SET birth_date = COALESCE(birth_date, p_birth_date),
               identification_id = COALESCE(identification_id, p_identification_id),
               health_conditions = COALESCE(health_conditions, p_health_conditions)
         WHERE id = v_patient.id
        RETURNING * INTO v_patient;
    ELSE
        INSERT INTO patients (full_name, email, phone, birth_date, identification_id, health_conditions)
        VALUES (p_full_name, p_email, p_phone, p_birth_date, p_identification_id, p_health_conditions)
        RETURNING * INTO v_patient;
    END IF;

    -- El EXCLUDE constraint lanza 23P01 si el horario ya está tomado.
    INSERT INTO appointments (patient_id, appointment_type, start_time, end_time, main_reason, goals)
    VALUES (v_patient.id, p_type, p_start, p_end, p_main_reason, p_goals)
    RETURNING * INTO v_appt;

    RETURN QUERY SELECT v_appt.id, v_patient.id, v_appt.upload_token, v_patient.full_name;
END;
$$;

REVOKE ALL ON FUNCTION book_appointment FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION book_appointment TO service_role;

-- 7. DATOS INICIALES: perfil y horario base (Lun-Vie 9-12 y 14-17), editable en /settings
INSERT INTO doctor_profile (full_name, title, bio, consultation_fee, slot_duration_min)
SELECT 'Dra. Mirian Galán', 'Nutricionista & Nutrióloga Clínica',
       'Especialista en composición corporal, nutrición clínica, tratamientos estéticos integrales y educación nutricional.',
       4000, 30
WHERE NOT EXISTS (SELECT 1 FROM doctor_profile);

INSERT INTO working_hours (day_of_week, start_time, end_time)
SELECT d, s, e FROM generate_series(1, 5) AS d,
     (VALUES ('09:00'::time, '12:00'::time), ('14:00'::time, '17:00'::time)) AS b(s, e)
WHERE NOT EXISTS (SELECT 1 FROM working_hours);
