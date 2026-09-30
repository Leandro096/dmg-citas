// Google Calendar simulado: bloquea horarios con eventos personales de ejemplo y "crea" eventos con Meet falso.
import { randomUUID } from "node:crypto";
import { at, MOCK_BUSY } from "./data";
import { mockState } from "./db";

export const mockGoogleConnected = () => mockState().googleConnected;
export const setMockGoogleConnected = (v: boolean) => (mockState().googleConnected = v);

export function mockBusyRanges(from: Date, to: Date) {
  if (!mockState().googleConnected) return null;
  return MOCK_BUSY.map((b) => ({ start: new Date(at(b.day, b.from)), end: new Date(at(b.day, b.to)) })).filter((r) => r.start < to && r.end > from);
}

export function mockCreateEvent(virtual: boolean) {
  if (!mockState().googleConnected) return null;
  const eventId = `mock_evt_${randomUUID().slice(0, 8)}`;
  return { eventId, meetLink: virtual ? `https://meet.google.com/mock-${eventId.slice(-6)}` : undefined };
}
