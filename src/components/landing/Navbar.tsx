"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { DOCTOR } from "@/lib/booking";
import { whatsappLink } from "@/lib/site";

const LINKS = [
  { href: "#sobre-mi", label: "Sobre mí" },
  { href: "#especialidades", label: "Especialidades" },
  { href: "#proceso", label: "Mi enfoque" },
  { href: "#testimonios", label: "Experiencias" },
];

const ring = "focus-visible:ring-2 focus-visible:ring-roseBrand-600 focus-visible:outline-none";
const roundBtn = `flex h-11 w-11 items-center justify-center rounded-full border border-roseBrand-200 bg-white/70 text-roseBrand-800 transition hover:bg-roseBrand-50 dark:border-white/10 dark:bg-white/5 dark:text-[#f5dfe4] dark:hover:bg-white/10 ${ring}`;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => {
    const dark = document.documentElement.classList.toggle("dark");
    try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch { /* sin almacenamiento */ }
  };

  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${scrolled ? "nav-scrolled border-roseBrand-200/70 bg-nude-50/85 dark:border-white/10 dark:bg-[#21171a]/80" : "border-transparent"}`}>
      <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10" aria-label="Principal">
        <a href="#inicio" className={`group flex items-center gap-3 rounded-full ${ring}`}>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-roseBrand-700 text-white shadow-sm transition group-hover:scale-105">
            <Icon icon="lucide:heart-pulse" className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-semibold tracking-tight">{DOCTOR.name}</span>
            <span className="hidden text-[10px] font-medium uppercase tracking-[.18em] text-roseBrand-700 sm:block dark:text-roseBrand-200">Nutrición clínica & estética</span>
          </span>
        </a>

        <div className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className={`rounded text-sm font-medium text-roseBrand-800/80 transition hover:text-roseBrand-700 dark:text-[#eadde0]/80 dark:hover:text-roseBrand-200 ${ring}`}>{l.label}</a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={toggleTheme} aria-label="Cambiar tema" className={roundBtn}>
            <Icon icon="lucide:sun" className="hidden h-4 w-4 dark:block" />
            <Icon icon="lucide:moon" className="h-4 w-4 dark:hidden" />
          </button>
          <a href={whatsappLink()} className={`hidden rounded-full bg-roseBrand-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-roseBrand-800 sm:inline-flex ${ring}`}>Solicitar consulta</a>
          <button type="button" onClick={() => setOpen((o) => !o)} aria-label="Abrir menú" aria-expanded={open} aria-controls="mobile-menu" className={`${roundBtn} lg:hidden`}>
            <Icon icon="lucide:menu" className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-roseBrand-100 bg-nude-50/95 px-5 py-5 backdrop-blur-xl lg:hidden dark:border-white/10 dark:bg-[#21171a]/95">
          <div className="mx-auto max-w-7xl space-y-1">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className={`block rounded-xl px-4 py-3 text-sm font-medium hover:bg-roseBrand-100 dark:hover:bg-white/5 ${ring}`}>{l.label}</a>
            ))}
            <a href={whatsappLink()} onClick={() => setOpen(false)} className={`mt-2 flex items-center justify-center rounded-xl bg-roseBrand-700 px-4 py-3 text-sm font-semibold text-white ${ring}`}>Solicitar consulta</a>
          </div>
        </div>
      )}
    </header>
  );
}
