"use client";

import { Icon } from "@/components/ui/Icon";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

type Props = {
  month: { year: number; month: number };
  onMonthChange: (m: { year: number; month: number }) => void;
  selected: string | null;
  onSelect: (date: string) => void;
  today: string;
  maxDate: string;
  workingDays: number[];
};

const navBtn =
  "rounded-lg p-2.5 text-roseBrand-800 transition-colors hover:bg-roseBrand-100 disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-roseBrand-500 focus-visible:outline-none";

export function Calendar({ month, onMonthChange, selected, onSelect, today, maxDate, workingDays }: Props) {
  const { year, month: m } = month;
  const offset = (new Date(year, m, 1).getDay() + 6) % 7; // semana inicia en lunes
  const total = new Date(year, m + 1, 0).getDate();
  const shift = (delta: number) => {
    const d = new Date(year, m + delta, 1);
    onMonthChange({ year: d.getFullYear(), month: d.getMonth() });
  };
  const canPrev = iso(year, m, 1) > today.slice(0, 8) + "01";
  const canNext = iso(year, m + 1, 1) <= maxDate;

  return (
    <div>
      <div className="my-3 flex items-center justify-between px-1">
        <button type="button" aria-label="Mes anterior" disabled={!canPrev} onClick={() => shift(-1)} className={navBtn}>
          <Icon icon="lucide:chevron-left" />
        </button>
        <span className="text-sm font-semibold text-roseBrand-900" aria-live="polite">{MONTHS[m]} {year}</span>
        <button type="button" aria-label="Mes siguiente" disabled={!canNext} onClick={() => shift(1)} className={navBtn}>
          <Icon icon="lucide:chevron-right" />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-roseBrand-800/75">
        {DAYS.map((d) => <span key={d}>{d}</span>)}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium">
        {Array.from({ length: offset }).map((_, i) => <span key={`e${i}`} />)}
        {Array.from({ length: total }, (_, i) => i + 1).map((d) => {
          const date = iso(year, m, d);
          const dow = (offset + d) % 7; // 0=Dom..6=Sáb
          const enabled = workingDays.includes(dow) && date >= today && date <= maxDate;
          const isSel = date === selected;
          return (
            <button key={d} type="button" disabled={!enabled} onClick={() => onSelect(date)} aria-pressed={isSel} aria-label={date}
              className={[
                "rounded-xl py-3 transition-all focus-visible:ring-2 focus-visible:ring-roseBrand-500 focus-visible:outline-none",
                isSel ? "scale-[1.02] bg-roseBrand-700 font-semibold text-white shadow-sm"
                  : enabled ? "bg-roseBrand-100 text-roseBrand-800 hover:bg-roseBrand-200"
                  : "cursor-not-allowed text-roseBrand-800 opacity-40",
              ].join(" ")}>
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
