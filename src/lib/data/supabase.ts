import "server-only";
import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { AppointmentRecord, DataApi, DocumentRecord, PatientRecord, PermissionCode, Role } from "./types";

type PatientRow = {
  id: string; full_name: string; email: string; phone: string; birth_date: string | null;
  identification_id: string | null; health_conditions: string | null; notes: string | null; created_at: string;
};
type ApptRow = {
  id: string; patient_id: string; start_time: string; end_time: string; status: AppointmentRecord["status"];
  appointment_type: AppointmentRecord["type"]; main_reason: string | null; goals: string | null; meet_link: string | null;
  google_event_id: string | null; google_sync_status: AppointmentRecord["syncStatus"]; upload_token: string;
  patients: PatientRow;
  appointment_documents: { id: string; file_name: string; mime_type: string; size_bytes: number; storage_path: string; deleted_at: string | null }[];
};

const toPatient = (p: PatientRow): PatientRecord => ({
  id: p.id, fullName: p.full_name, email: p.email, phone: p.phone, birthDate: p.birth_date,
  identificationId: p.identification_id, healthConditions: p.health_conditions, notes: p.notes, createdAt: p.created_at,
});

const PATIENT_COLS = "id, full_name, email, phone, birth_date, identification_id, health_conditions, notes, created_at";
const DAY = 86400_000;

export const supabaseData: DataApi = {
  async getUser(id) {
    const { data: row } = await supabaseAdmin()
      .from("users")
      .select("id, email, full_name, is_active, roles(name, role_permissions(permissions(code)))")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    if (!row || !row.is_active) return null;
    const role = row.roles as unknown as { name: Role; role_permissions: { permissions: { code: PermissionCode } }[] };
    return { id: row.id, email: row.email, fullName: row.full_name, role: role.name, permissions: role.role_permissions.map((rp) => rp.permissions.code) };
  },

  async getWorkingHours() {
    const { data } = await supabaseAdmin().from("working_hours").select("day_of_week, start_time, end_time").eq("is_active", true).is("deleted_at", null).order("start_time");
    return (data ?? []).map((r) => ({ day: r.day_of_week as number, start: String(r.start_time).slice(0, 5), end: String(r.end_time).slice(0, 5) }));
  },

  async saveWorkingHours(blocks) {
    const db = supabaseAdmin();
    const del = await db.from("working_hours").update({ deleted_at: new Date().toISOString() }).is("deleted_at", null);
    if (del.error) return false;
    if (!blocks.length) return true;
    const ins = await db.from("working_hours").insert(blocks.map((b) => ({ day_of_week: b.day, start_time: b.start, end_time: b.end })));
    return !ins.error;
  },

  async getBookedRanges(from, to) {
    const { data } = await supabaseAdmin()
      .from("appointments")
      .select("start_time, end_time")
      .neq("status", "CANCELLED")
      .is("deleted_at", null)
      .lt("start_time", to.toISOString())
      .gt("end_time", from.toISOString());
    return (data ?? []).map((a) => ({ start: new Date(a.start_time), end: new Date(a.end_time) }));
  },

  async book(p) {
    const { data, error } = await supabaseAdmin()
      .rpc("book_appointment", {
        p_existing: p.existing,
        p_full_name: p.fullName,
        p_email: p.email,
        p_phone: p.phone,
        p_birth_date: p.birthDate,
        p_identification_id: p.identificationId,
        p_health_conditions: p.healthConditions,
        p_type: p.type,
        p_start: p.start.toISOString(),
        p_end: p.end.toISOString(),
        p_main_reason: p.mainReason,
        p_goals: p.goals,
      })
      .single();
    if (error || !data) {
      if (error?.code === "23P01") return { ok: false, code: "SLOT_TAKEN" };
      if (error?.code === "P0002") return { ok: false, code: "PATIENT_NOT_FOUND" };
      console.error("[data] rpc book_appointment falló:", error);
      return { ok: false, code: "ERROR" };
    }
    const r = data as { appointment_id: string; patient_id: string; upload_token: string; patient_name: string };
    return { ok: true, appointmentId: r.appointment_id, patientId: r.patient_id, uploadToken: r.upload_token, patientName: r.patient_name };
  },

  async updateSync(id, v) {
    await supabaseAdmin().from("appointments").update({ google_event_id: v.eventId, meet_link: v.meetLink, google_sync_status: v.status }).eq("id", id);
  },

  async listAppointments(f) {
    const db = supabaseAdmin();
    const limit = f.limit ?? 200;
    const offset = f.offset ?? 0;

    let query = db
      .from("appointments")
      .select(
        `id, patient_id, start_time, end_time, status, appointment_type, main_reason, goals, meet_link, google_event_id, google_sync_status, upload_token, patients!inner(${PATIENT_COLS}), appointment_documents(id, file_name, mime_type, size_bytes, storage_path, deleted_at)`,
        { count: "exact" },
      )
      .is("deleted_at", null)
      .is("patients.deleted_at", null);

    if (f.patientId) query = query.eq("patient_id", f.patientId);
    if (f.status) query = query.eq("status", f.status);
    if (f.q) query = query.ilike("patients.full_name", `%${f.q.replace(/[%_,()]/g, " ").trim()}%`);
    if (f.from) query = query.gte("start_time", new Date(`${f.from}T00:00:00-04:00`).toISOString());
    if (f.to) query = query.lt("start_time", new Date(new Date(`${f.to}T00:00:00-04:00`).getTime() + DAY).toISOString());

    const { data, count } = await query
      .order("start_time", { ascending: f.ascending ?? true })
      .range(offset, offset + limit - 1)
      .overrideTypes<ApptRow[], { merge: false }>();

    const rows = (data ?? []).map<AppointmentRecord>((r) => ({
      id: r.id, patientId: r.patient_id, patient: toPatient(r.patients), type: r.appointment_type,
      startTime: r.start_time, endTime: r.end_time, status: r.status, mainReason: r.main_reason, goals: r.goals,
      meetLink: r.meet_link, googleEventId: r.google_event_id, syncStatus: r.google_sync_status, uploadToken: r.upload_token,
      docs: r.appointment_documents.filter((d) => !d.deleted_at).map((d) => ({ id: d.id, name: d.file_name, mime: d.mime_type, size: d.size_bytes, ref: d.storage_path })),
    }));
    return { rows, total: count ?? rows.length };
  },

  async getAppointmentByToken(token) {
    const { data } = await supabaseAdmin()
      .from("appointments")
      .select("id, patient_id, start_time, end_time, patients(full_name)")
      .eq("upload_token", token)
      .is("deleted_at", null)
      .maybeSingle();
    if (!data) return null;
    return { id: data.id, patientId: data.patient_id, startTime: data.start_time, endTime: data.end_time, patientName: (data.patients as unknown as { full_name: string }).full_name };
  },

  async countDocuments(appointmentId) {
    const { count } = await supabaseAdmin().from("appointment_documents").select("id", { count: "exact", head: true }).eq("appointment_id", appointmentId).is("deleted_at", null);
    return count ?? 0;
  },

  async addDocument(appt, file) {
    const db = supabaseAdmin();
    const storagePath = `${appt.patientId}/${appt.id}/${randomUUID()}.${file.ext}`;
    const up = await db.storage.from("patient-documents").upload(storagePath, file.bytes, { contentType: file.mime });
    if (up.error) {
      console.error("[data] storage:", up.error);
      return false;
    }
    const ins = await db.from("appointment_documents").insert({
      appointment_id: appt.id, patient_id: appt.patientId, storage_path: storagePath,
      file_name: file.name.slice(0, 255), mime_type: file.mime, size_bytes: file.size,
    });
    if (ins.error) {
      await db.storage.from("patient-documents").remove([storagePath]);
      return false;
    }
    return true;
  },

  async documentUrls(docs: DocumentRecord[]) {
    if (!docs.length) return new Map();
    const { data } = await supabaseAdmin().storage.from("patient-documents").createSignedUrls(docs.map((d) => d.ref), 3600);
    const byPath = new Map((data ?? []).map((s) => [s.path, s.signedUrl]));
    return new Map(docs.flatMap((d) => (byPath.get(d.ref) ? [[d.id, byPath.get(d.ref)!] as const] : [])));
  },

  async setStatus(id, status) {
    const { error } = await supabaseAdmin().from("appointments").update({ status }).eq("id", id).is("deleted_at", null);
    return !error;
  },

  async softDeleteAppointment(id) {
    const { error } = await supabaseAdmin().from("appointments").update({ deleted_at: new Date().toISOString() }).eq("id", id).is("deleted_at", null);
    return !error;
  },

  async getEventId(id) {
    const { data } = await supabaseAdmin().from("appointments").select("google_event_id").eq("id", id).maybeSingle();
    return data?.google_event_id ?? null;
  },

  async listPatients() {
    const { data } = await supabaseAdmin().from("patients").select(`${PATIENT_COLS}, appointments(id, deleted_at)`).is("deleted_at", null).order("full_name");
    return (data ?? []).map((p) => ({
      ...toPatient(p as unknown as PatientRow),
      appointmentCount: (p.appointments as { deleted_at: string | null }[]).filter((a) => !a.deleted_at).length,
    }));
  },

  async getPatient(id) {
    const { data } = await supabaseAdmin().from("patients").select(PATIENT_COLS).eq("id", id).is("deleted_at", null).maybeSingle();
    return data ? toPatient(data as PatientRow) : null;
  },

  async softDeletePatient(id) {
    // El trigger trg_cascade_patient_soft_delete propaga el soft-delete a sus citas.
    const { error } = await supabaseAdmin().from("patients").update({ deleted_at: new Date().toISOString() }).eq("id", id).is("deleted_at", null);
    return !error;
  },
};
