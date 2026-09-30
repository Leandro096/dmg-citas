import "server-only";
import { google } from "googleapis";
import { decrypt, encrypt } from "@/lib/crypto";
import { mockBusyRanges, mockCreateEvent, mockGoogleConnected } from "@/_mock/google";
import { isMock } from "@/lib/mode";
import { supabaseAdmin } from "@/lib/supabase/server";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.freebusy",
];

export function oauthClient() {
  return new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
}

export function googleConfigured() {
  return !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET && !!process.env.GOOGLE_REDIRECT_URI;
}

type TokenRow = { id: string; access_token: string; refresh_token: string; token_expires_at: string; calendar_id: string };

async function loadTokens(): Promise<TokenRow | null> {
  const { data } = await supabaseAdmin()
    .from("doctor_oauth_tokens")
    .select("id, access_token, refresh_token, token_expires_at, calendar_id")
    .eq("provider", "google")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

/** ¿Está disponible la integración? En modo demo es una simulación. */
export function googleAvailable() {
  return isMock() || googleConfigured();
}

export async function isGoogleConnected() {
  if (isMock()) return mockGoogleConnected();
  return googleConfigured() && !!(await loadTokens());
}

/**
 * Cliente de Calendar autenticado. Si el access_token expiró, googleapis usa el
 * refresh_token (desencriptado solo aquí, en el servidor) y persistimos el nuevo.
 */
async function calendarClient() {
  if (!googleConfigured()) return null;
  const row = await loadTokens();
  if (!row) return null;

  const auth = oauthClient();
  auth.setCredentials({
    access_token: decrypt(row.access_token),
    refresh_token: decrypt(row.refresh_token),
    expiry_date: new Date(row.token_expires_at).getTime(),
  });
  auth.on("tokens", async (t) => {
    if (!t.access_token) return;
    await supabaseAdmin()
      .from("doctor_oauth_tokens")
      .update({
        access_token: encrypt(t.access_token),
        ...(t.refresh_token ? { refresh_token: encrypt(t.refresh_token) } : {}),
        token_expires_at: new Date(t.expiry_date ?? Date.now() + 3500_000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
  });
  return { calendar: google.calendar({ version: "v3", auth }), calendarId: row.calendar_id };
}

/** Rangos ocupados en el calendario de la doctora. `null` si Google no está conectado. */
export async function getBusyRanges(from: Date, to: Date): Promise<{ start: Date; end: Date }[] | null> {
  if (isMock()) return mockBusyRanges(from, to);
  const c = await calendarClient();
  if (!c) return null;
  const res = await c.calendar.freebusy.query({
    requestBody: { timeMin: from.toISOString(), timeMax: to.toISOString(), items: [{ id: c.calendarId }] },
  });
  const busy = res.data.calendars?.[c.calendarId]?.busy ?? [];
  return busy.map((b) => ({ start: new Date(b.start!), end: new Date(b.end!) }));
}

export async function createCalendarEvent(input: {
  appointmentId: string;
  summary: string;
  description: string;
  start: Date;
  end: Date;
  attendeeEmail: string;
  virtual: boolean;
  location?: string;
}): Promise<{ eventId: string; meetLink?: string } | null> {
  if (isMock()) return mockCreateEvent(input.virtual);
  const c = await calendarClient();
  if (!c) return null;
  const tz = "America/Santo_Domingo";
  const res = await c.calendar.events.insert({
    calendarId: c.calendarId,
    sendUpdates: "all",
    conferenceDataVersion: input.virtual ? 1 : 0,
    requestBody: {
      summary: input.summary,
      description: input.description,
      location: input.virtual ? undefined : input.location,
      start: { dateTime: input.start.toISOString(), timeZone: tz },
      end: { dateTime: input.end.toISOString(), timeZone: tz },
      attendees: [{ email: input.attendeeEmail }],
      reminders: { useDefault: false, overrides: [{ method: "email", minutes: 24 * 60 }, { method: "popup", minutes: 60 }] },
      ...(input.virtual
        ? { conferenceData: { createRequest: { requestId: input.appointmentId, conferenceSolutionKey: { type: "hangoutsMeet" } } } }
        : {}),
    },
  });
  return { eventId: res.data.id!, meetLink: res.data.hangoutLink ?? undefined };
}

export async function deleteCalendarEvent(eventId: string) {
  if (isMock()) return;
  const c = await calendarClient();
  if (!c) return;
  await c.calendar.events.delete({ calendarId: c.calendarId, eventId, sendUpdates: "all" }).catch((e) => {
    if (e?.code !== 404 && e?.code !== 410) throw e;
  });
}
