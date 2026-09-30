# Memory.md - Arquitectura de Datos & Script DDL

## 1. Esquema de Base de Datos (DDL PostgreSQL / Supabase)

```sql
-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ROLES Y PERMISOS (RBAC)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIMEZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id),
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIMEZONE NULL,
    created_at TIMESTAMP WITH TIMEZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE doctor_oauth_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(30) DEFAULT 'google',
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL, -- Guardado encriptado en reposo
    token_expires_at TIMESTAMP WITH TIMEZONE NOT NULL,
    calendar_id VARCHAR(255) DEFAULT 'primary',
    updated_at TIMESTAMP WITH TIMEZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. PERFIL MÉDICO & DISPONIBILIDAD (SINGLETON)
CREATE TABLE doctor_profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    title VARCHAR(100) NOT NULL,
    bio TEXT,
    consultation_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    slot_duration_min INT NOT NULL DEFAULT 30,
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/Santo_Domingo',
    updated_at TIMESTAMP WITH TIMEZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE working_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIMEZONE NULL
);

-- 3. PACIENTES Y CITAS (APPOINTMENTS)
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    identification_id VARCHAR(30) NULL,
    notes TEXT NULL,
    deleted_at TIMESTAMP WITH TIMEZONE NULL,
    created_at TIMESTAMP WITH TIMEZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    appointment_type VARCHAR(20) NOT NULL CHECK (appointment_type IN ('PRESENCIAL', 'VIRTUAL')),
    start_time TIMESTAMP WITH TIMEZONE NOT NULL,
    end_time TIMESTAMP WITH TIMEZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CANCELLED', 'COMPLETED')),
    google_event_id VARCHAR(255) NULL,
    meet_link TEXT NULL,
    reason TEXT NULL,
    deleted_at TIMESTAMP WITH TIMEZONE NULL,
    created_at TIMESTAMP WITH TIMEZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TRIGGER PARA SOFT-DELETE EN CASCADA
CREATE OR REPLACE FUNCTION cascade_patient_soft_delete()
RETURNS TRIGGER AS $$ BEGIN     IF (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL) THEN         UPDATE appointments          SET deleted_at = NEW.deleted_at          WHERE patient_id = NEW.id AND deleted_at IS NULL;     ELSIF (NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL) THEN         UPDATE appointments          SET deleted_at = NULL          WHERE patient_id = NEW.id;     END IF;     RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cascade_patient_soft_delete
AFTER UPDATE OF deleted_at ON patients
FOR EACH ROW
EXECUTE FUNCTION cascade_patient_soft_delete();

-- 5. POBLADO DE ROLES Y PERMISOS INICIALES
INSERT INTO roles (name, description) VALUES 
('DOCTOR', 'Acceso total al sistema, configuración y gestión de citas'),
('ASSISTANT', 'Acceso a la gestión de citas y lectura de pacientes');

INSERT INTO permissions (code, description) VALUES 
('appointments:read', 'Permite ver las citas agendadas'),
('appointments:write', 'Permite crear y modificar citas'),
('appointments:delete', 'Permite cancelar o eliminar citas'),
('patients:read', 'Permite consultar lista de pacientes'),
('patients:write', 'Permite registrar o editar datos del paciente'),
('settings:manage', 'Permite modificar configuración de horarios y perfil médico');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'DOCTOR';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p 
WHERE r.name = 'ASSISTANT' AND p.code IN ('appointments:read', 'appointments:write', 'patients:read', 'patients:write');
```