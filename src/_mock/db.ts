import { randomUUID } from "node:crypto";
import type { AppointmentRecord, AppointmentStatus, DataApi, DocumentRecord, PatientRecord, WorkingBlock } from "@/lib/data/types";
import { at, MOCK_APPOINTMENTS, MOCK_PATIENTS, MOCK_USERS, MOCK_WORKING_HOURS, miniPdf, ROLE_PERMISSIONS } from "./data";

type MPatient = PatientRecord & { deletedAt: string | null };
type MAppt = Omit<AppointmentRecord, "patient" | "docs"> & { deletedAt: string | null };
type MDoc = DocumentRecord & { appointmentId: string; bytes: Uint8Array };

type State = { patients: MPatient[]; appts: MAppt[]; docs: MDoc[]; hours: WorkingBlock[]; googleConnected: boolean };

const SLOT_MIN = 30;

function seed(): State {
  const patients: MPatient[] = MOCK_PATIENTS.map((p) => ({
    ...p, identificationId: null, notes: null, createdAt: at(-60, "09:00"), deletedAt: null,
  }));
  const appts: MAppt[] = [];
  const docs: MDoc[] = [];
  for (const s of MOCK_APPOINTMENTS) {
    const start = at(s.day, s.time);
    const id = randomUUID();
    const type = s.type ?? "PRESENCIAL";
    appts.push({
      id, patientId: patients[s.patient].id, type, startTime: start, endTime: new Date(new Date(start).getTime() + SLOT_MIN * 60_000).toISOString(),
      status: s.status, mainReason: s.reason, goals: s.goals ?? null,
      meetLink: type === "VIRTUAL" && s.status !== "CANCELLED" ? "https://meet.google.com/mock-demo-call" : null,
      googleEventId: s.status === "CANCELLED" ? null : `mock_evt_${id.slice(0, 8)}`, syncStatus: s.status === "CANCELLED" ? "SKIPPED" : "SYNCED",
      uploadToken: randomUUID(), deletedAt: null,
    });
    for (const name of s.docs ?? []) {
      const bytes = miniPdf(name.replace(/\.pdf$/, "").replace(/-/g, " "));
      docs.push({ id: randomUUID(), appointmentId: id, name, mime: "application/pdf", size: bytes.length, ref: name, bytes });
    }
  }
  return { patients, appts, docs, hours: MOCK_WORKING_HOURS.map((h) => ({ ...h })), googleConnected: true };
}

// Un único estado por proceso (sobrevive al HMR de desarrollo).
const g = globalThis as unknown as { __onTimeMock?: State };
export const mockState = () => (g.__onTimeMock ??= seed());
export const resetMock = () => (g.__onTimeMock = seed());

const active = <T extends { deletedAt: string | null }>(x: T) => !x.deletedAt;
const digits = (s: string) => s.replace(/\D/g, "");
const DAY = 86400_000;

function hydrate(s: State, a: MAppt): AppointmentRecord {
  const patient = s.patients.find((p) => p.id === a.patientId)!;
  const { deletedAt: _pd, ...pat } = patient;
  void _pd;
  const { deletedAt: _ad, ...rest } = a;
  void _ad;
  return { ...rest, patient: pat, docs: s.docs.filter((d) => d.appointmentId === a.id).map(({ bytes: _b, appointmentId: _i, ...d }) => (void _b, void _i, d)) };
}

export const mockData: DataApi = {
  async getUser(id) {
    const u = MOCK_USERS.find((x) => x.id === id);
    return u ? { id: u.id, email: u.email, fullName: u.fullName, role: u.role, permissions: ROLE_PERMISSIONS[u.role] } : null;
  },

  async getWorkingHours() {
    return mockState().hours.map((h) => ({ ...h }));
  },
  async saveWorkingHours(blocks) {
    mockState().hours = blocks.map((b) => ({ ...b }));
    return true;
  },

  async getBookedRanges(from, to) {
    return mockState()
      .appts.filter((a) => active(a) && a.status !== "CANCELLED" && new Date(a.startTime) < to && new Date(a.endTime) > from)
      .map((a) => ({ start: new Date(a.startTime), end: new Date(a.endTime) }));
  },

  async book(p) {
    const s = mockState();
    let patient = s.patients.find((x) => active(x) && x.email.toLowerCase() === p.email.toLowerCase());

    if (p.existing) {
      if (!patient || digits(patient.phone).slice(-7) !== digits(p.phone).slice(-7)) return { ok: false, code: "PATIENT_NOT_FOUND" };
    }
    // Solapamiento con cualquier cita activa (equivale al EXCLUDE constraint).
    if (s.appts.some((a) => active(a) && a.status !== "CANCELLED" && new Date(a.startTime) < p.end && new Date(a.endTime) > p.start)) {
      return { ok: false, code: "SLOT_TAKEN" };
    }

    if (patient) {
      if (p.existing) patient.healthConditions = p.healthConditions ?? patient.healthConditions;
      else {
        patient.birthDate ??= p.birthDate;
        patient.identificationId ??= p.identificationId;
        patient.healthConditions ??= p.healthConditions;
      }
    } else {
      patient = {
        id: randomUUID(), fullName: p.fullName, email: p.email, phone: p.phone, birthDate: p.birthDate,
        identificationId: p.identificationId, healthConditions: p.healthConditions, notes: null, createdAt: new Date().toISOString(), deletedAt: null,
      };
      s.patients.push(patient);
    }

    const appt: MAppt = {
      id: randomUUID(), patientId: patient.id, type: p.type, startTime: p.start.toISOString(), endTime: p.end.toISOString(),
      status: "CONFIRMED", mainReason: p.mainReason, goals: p.goals, meetLink: null, googleEventId: null, syncStatus: "PENDING",
      uploadToken: randomUUID(), deletedAt: null,
    };
    s.appts.push(appt);
    return { ok: true, appointmentId: appt.id, patientId: patient.id, uploadToken: appt.uploadToken, patientName: patient.fullName };
  },

  async updateSync(id, v) {
    const a = mockState().appts.find((x) => x.id === id);
    if (a) Object.assign(a, { googleEventId: v.eventId, meetLink: v.meetLink, syncStatus: v.status });
  },

  async listAppointments(f) {
    const s = mockState();
    const q = f.q?.trim().toLowerCase();
    const from = f.from ? new Date(`${f.from}T00:00:00-04:00`).getTime() : null;
    const to = f.to ? new Date(`${f.to}T00:00:00-04:00`).getTime() + DAY : null;

    const rows = s.appts
      .filter((a) => active(a) && active(s.patients.find((p) => p.id === a.patientId)!))
      .filter((a) => !f.patientId || a.patientId === f.patientId)
      .filter((a) => !f.status || a.status === f.status)
      .filter((a) => !q || s.patients.find((p) => p.id === a.patientId)!.fullName.toLowerCase().includes(q))
      .filter((a) => from === null || new Date(a.startTime).getTime() >= from)
      .filter((a) => to === null || new Date(a.startTime).getTime() < to)
      .sort((a, b) => (new Date(a.startTime).getTime() - new Date(b.startTime).getTime()) * ((f.ascending ?? true) ? 1 : -1));

    const offset = f.offset ?? 0;
    return { total: rows.length, rows: rows.slice(offset, offset + (f.limit ?? 200)).map((a) => hydrate(s, a)) };
  },

  async getAppointmentByToken(token) {
    const s = mockState();
    const a = s.appts.find((x) => active(x) && x.uploadToken === token);
    if (!a) return null;
    return { id: a.id, patientId: a.patientId, startTime: a.startTime, endTime: a.endTime, patientName: s.patients.find((p) => p.id === a.patientId)!.fullName };
  },

  async countDocuments(appointmentId) {
    return mockState().docs.filter((d) => d.appointmentId === appointmentId).length;
  },

  async addDocument(appt, file) {
    mockState().docs.push({ id: randomUUID(), appointmentId: appt.id, name: file.name, mime: file.mime, size: file.size, ref: file.name, bytes: file.bytes });
    return true;
  },

  async documentUrls(docs) {
    return new Map(docs.map((d) => [d.id, `/api/mock-files/${d.id}`]));
  },

  async setStatus(id, status: AppointmentStatus) {
    const a = mockState().appts.find((x) => x.id === id && active(x));
    if (!a) return false;
    a.status = status;
    return true;
  },

  async softDeleteAppointment(id) {
    const a = mockState().appts.find((x) => x.id === id && active(x));
    if (!a) return false;
    a.deletedAt = new Date().toISOString();
    return true;
  },

  async getEventId(id) {
    return mockState().appts.find((x) => x.id === id)?.googleEventId ?? null;
  },

  async listPatients() {
    const s = mockState();
    return s.patients
      .filter(active)
      .sort((a, b) => a.fullName.localeCompare(b.fullName))
      .map(({ deletedAt: _d, ...p }) => (void _d, { ...p, appointmentCount: s.appts.filter((a) => a.patientId === p.id && active(a)).length }));
  },

  async getPatient(id) {
    const p = mockState().patients.find((x) => x.id === id && active(x));
    if (!p) return null;
    const { deletedAt: _d, ...rest } = p;
    void _d;
    return rest;
  },

  async softDeletePatient(id) {
    const s = mockState();
    const p = s.patients.find((x) => x.id === id && active(x));
    if (!p) return false;
    const now = new Date().toISOString();
    p.deletedAt = now;
    s.appts.filter((a) => a.patientId === id && active(a)).forEach((a) => (a.deletedAt = now)); // equivale al trigger de cascada
    return true;
  },
};

/** Archivo de ejemplo (para /api/mock-files/[id]). */
export function mockFile(id: string) {
  const d = mockState().docs.find((x) => x.id === id);
  return d ? { bytes: d.bytes, mime: d.mime, name: d.name } : null;
}
