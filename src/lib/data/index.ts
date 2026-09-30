import "server-only";
import { mockData } from "@/_mock/db";
import { isMock } from "@/lib/mode";
import { supabaseData } from "./supabase";
import type { DataApi } from "./types";

/** Acceso a datos: Supabase en producción, `_mock` en modo demo. */
export function db(): DataApi {
  return isMock() ? mockData : supabaseData;
}

export * from "./types";
