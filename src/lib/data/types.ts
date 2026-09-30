// Contrato de acceso a datos. Dos implementaciones: Supabase (lib/data/supabase.ts) y datos de ejemplo (_mock/db.ts).

export type Role = "DOCTOR" | "ASSISTANT";

export type PermissionCode =
  | "appointments:read"
  | "appointments:write"
  | "appointments:delete"
  | "patients:read"
  | "patients:write"
  | "settings:manage";

export type UserRecord = { id: string; email: string; fullName: string; role: Role; permissions: PermissionCode[] };

export type WorkingBlock = { day: number; start: string; end: string };

export type AppointmentStatus = "CONFIRMED" | "CANCELLED" | "COMPLETED";
export type AppointmentType = "PRESENCIAL" | "VIRTUAL";
export type SyncStatus = "PENDING" | "SYNCED" | "FAILED" | "SKIPPED";

export type PatientRecord = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  birthDate: string | null;
  identificationId: string | null;
  healthConditions: string | null;
  notes: string | null;
  createdAt: string;
};

export type DocumentRecord = { id: string; name: string; mime: string; size: number; ref: string };

export type AppointmentRecord = {
  id: string;
  patientId: string;
  patient: PatientRecord;
  type: AppointmentType;
  startTime: string; // ISO UTC
  endTime: string;
  status: AppointmentStatus;
  mainReason: string | null;
  goals: string | null;
  meetLink: string | null;
  googleEventId: string | null;
  syncStatus: SyncStatus;
  uploadToken: string;
  docs: DocumentRecord[];
};

export type AppointmentFilter = {
  patientId?: string;
  status?: AppointmentStatus;
  q?: string; // nombre del paciente
  from?: string; // YYYY-MM-DD (hora local RD)
  to?: string;
  ascending?: boolean;
  limit?: number;
  offset?: number;
};

export type BookParams = {
  existing: boolean; // true: la paciente debe coincidir por correo + teléfono
  fullName: string;
  email: string;
  phone: string;
  birthDate: string | null;
  identificationId: string | null;
  healthConditions: string | null;
  type: AppointmentType;
  start: Date;
  end: Date;
  mainReason: string;
  goals: string | null;
};

export type BookOutcome =
  | { ok: true; appointmentId: string; patientId: string; uploadToken: string; patientName: string }
  | { ok: false; code: "SLOT_TAKEN" | "PATIENT_NOT_FOUND" | "ERROR" };

export type UploadedFile = { name: string; mime: string; size: number; ext: string; bytes: Uint8Array };

export type TokenAppointment = { id: string; patientId: string; startTime: string; endTime: string; patientName: string };

export interface DataApi {
  getUser(id: string): Promise<UserRecord | null>;

  getWorkingHours(): Promise<WorkingBlock[]>;
  saveWorkingHours(blocks: WorkingBlock[]): Promise<boolean>;
  /** Rangos de citas activas que se cruzan con [from, to). */
  getBookedRanges(from: Date, to: Date): Promise<{ start: Date; end: Date }[]>;

  /** Reserva atómica: paciente (nueva/existente) + cita sin solapamientos. */
  book(p: BookParams): Promise<BookOutcome>;
  updateSync(id: string, v: { eventId: string | null; meetLink: string | null; status: SyncStatus }): Promise<void>;

  listAppointments(f: AppointmentFilter): Promise<{ rows: AppointmentRecord[]; total: number }>;
  getAppointmentByToken(token: string): Promise<TokenAppointment | null>;
  countDocuments(appointmentId: string): Promise<number>;
  addDocument(appt: { id: string; patientId: string }, file: UploadedFile): Promise<boolean>;
  documentUrls(docs: DocumentRecord[]): Promise<Map<string, string>>;
  setStatus(id: string, status: AppointmentStatus): Promise<boolean>;
  softDeleteAppointment(id: string): Promise<boolean>;
  getEventId(id: string): Promise<string | null>;

  listPatients(): Promise<(PatientRecord & { appointmentCount: number })[]>;
  getPatient(id: string): Promise<PatientRecord | null>;
  softDeletePatient(id: string): Promise<boolean>;
}
