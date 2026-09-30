import Image from "next/image";
import { Navbar } from "@/components/landing/Navbar";
import { RevealObserver } from "@/components/landing/RevealObserver";
import { Icon } from "@/components/ui/Icon";
import { DOCTOR } from "@/lib/booking";
import { CONTACT, whatsappLink } from "@/lib/site";

const label = "text-xs font-bold uppercase tracking-[.2em] text-roseBrand-700 dark:text-roseBrand-200";
const h2 = "mt-4 font-display text-4xl leading-tight text-roseBrand-900 sm:text-5xl dark:text-white";
const muted = "text-roseBrand-800/80 dark:text-[#eadde0]/75";
const ring = "focus-visible:ring-2 focus-visible:ring-roseBrand-600 focus-visible:ring-offset-2 focus-visible:outline-none";
const wrap = "mx-auto max-w-7xl px-5 sm:px-8 lg:px-10";

// TODO: contenido de ejemplo; reemplazar por los datos reales de la doctora.
const SPECIALTIES = [
  { icon: "lucide:heart-pulse", title: "Nutrición clínica", text: "Acompañamiento nutricional adaptado a tus necesidades de salud." },
  { icon: "lucide:sparkles", title: "Nutrición estética", text: "Alimentación para piel, cabello y bienestar integral." },
  { icon: "lucide:scale", title: "Composición corporal", text: "Objetivos de peso y composición abordados desde una perspectiva saludable." },
  { icon: "lucide:video", title: "Consulta online", text: "Recibe acompañamiento profesional estés donde estés." },
];

const STEPS = [
  { n: "01", title: "Conocerte", text: "Conversamos sobre tus hábitos, antecedentes, objetivos, rutina y relación con la alimentación." },
  { n: "02", title: "Evaluarte", text: "Analizamos la información relevante para entender dónde estás y qué necesitas." },
  { n: "03", title: "Diseñar", text: "Creamos una estrategia nutricional personalizada, práctica y compatible con tu día a día." },
  { n: "04", title: "Acompañarte", text: "Revisamos avances, resolvemos obstáculos y ajustamos el plan cuando sea necesario." },
];

// TODO: testimonios de ejemplo; sustituir por experiencias reales (con permiso de las pacientes).
const TESTIMONIALS = [
  { q: "Por primera vez sentí que el plan estaba hecho para mi rutina y no al revés.", who: "Ana M.", ini: "AM", ctx: "Paciente · Consulta online" },
  { q: "Me ayudó a entender qué necesitaba para entrenar mejor sin obsesionarme con la comida.", who: "José R.", ini: "JR", ctx: "Paciente · Consulta presencial" },
  { q: "La diferencia fue tener acompañamiento y poder ajustar el plan a lo que realmente me pasaba.", who: "Laura C.", ini: "LC", ctx: "Paciente · Consulta presencial" },
];

const TRUST = [["100%", "Personalizado"], ["1:1", "Acompañamiento"], ["Online", "Desde donde estés"], ["Salud", "Como prioridad"]];

function Photo({ icon, title, text, big }: { icon: string; title: string; text: string; big?: boolean }) {
  return (
    <div className="photo-placeholder absolute inset-0 flex flex-col items-center justify-center text-center">
      <div className={`flex items-center justify-center rounded-full bg-white/70 text-roseBrand-700 shadow-sm backdrop-blur dark:bg-black/15 ${big ? "h-16 w-16" : "h-14 w-14"}`}>
        <Icon icon={icon} className={big ? "h-7 w-7" : "h-6 w-6"} />
      </div>
      <p className="mt-4 text-sm font-semibold text-roseBrand-800 dark:text-[#f5e8eb]">{title}</p>
      <p className="mt-1 max-w-[220px] text-xs leading-5 text-roseBrand-800/75 dark:text-[#eadde0]/70">{text}</p>
    </div>
  );
}

export default function LandingPage() {
  const wa = whatsappLink();

  return (
    <div className="landing min-h-screen overflow-x-clip text-roseBrand-900 dark:text-[#f8edef]">
      <RevealObserver />
      <noscript><style>{`.reveal{opacity:1!important;transform:none!important}`}</style></noscript>
      <Navbar />

      <main>
        {/* ============ HERO ============ */}
        <section id="inicio" className="relative min-h-screen overflow-hidden pt-28">
          <div className="hero-grid absolute inset-0" />
          <div className="blob absolute -right-32 top-28 h-72 w-72 rounded-full bg-roseBrand-200/50 blur-2xl dark:bg-roseBrand-500/10" />
          <div className="blob blob-delay absolute -left-40 bottom-10 h-72 w-72 rounded-full bg-nude-200/70 blur-2xl dark:bg-roseBrand-800/20" />

          <div className={`${wrap} relative grid items-center gap-12 pb-16 pt-10 lg:grid-cols-[1.03fr_.97fr] lg:gap-16 lg:pb-24 lg:pt-16`}>
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-roseBrand-200 bg-white/65 px-3.5 py-2 text-xs font-semibold uppercase tracking-[.13em] text-roseBrand-700 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-roseBrand-200">
                <span className="h-1.5 w-1.5 rounded-full bg-roseBrand-500" />
                Nutrición clínica & estética
              </div>
              <h1 className="max-w-3xl font-display text-[3.25rem] leading-[.98] tracking-tight text-roseBrand-900 sm:text-6xl lg:text-[5.35rem] dark:text-[#fff7f8]">
                Alimentarte bien <span className="text-roseBrand-600 dark:text-roseBrand-300">también puede sentirse bien.</span>
              </h1>
              <p className={`mt-7 max-w-xl text-base leading-7 sm:text-lg sm:leading-8 ${muted}`}>
                Planes de nutrición personalizados para cuidar tu salud, mejorar tu composición corporal y acompañarte en tus objetivos sin dietas imposibles.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href={wa} className={`group inline-flex items-center justify-center gap-2 rounded-full bg-roseBrand-700 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(163,86,106,.25)] transition hover:-translate-y-0.5 hover:bg-roseBrand-800 ${ring}`}>
                  Solicitar mi consulta
                  <Icon icon="lucide:arrow-up-right" className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
                <a href="#sobre-mi" className={`inline-flex items-center justify-center gap-2 rounded-full border border-roseBrand-200 bg-white/60 px-6 py-3.5 text-sm font-semibold text-roseBrand-800 transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-[#f7e9ec] dark:hover:bg-white/10 ${ring}`}>
                  Conocer mi enfoque
                </a>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 border-t border-roseBrand-200/80 pt-6 dark:border-white/10">
                {[["lucide:video", "Consultas online"], ["lucide:map-pin", "Consultas presenciales"], ["lucide:sparkles", "Planes personalizados"]].map(([i, t]) => (
                  <div key={t} className={`flex items-center gap-2 text-xs font-medium ${muted}`}>
                    <Icon icon={i} className="h-4 w-4 text-roseBrand-700 dark:text-roseBrand-300" /> {t}
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-in relative mx-auto w-full max-w-[460px] lg:ml-auto" style={{ animationDelay: "120ms" }}>
              {/* Panel de color detrás: la doctora (PNG/WebP sin fondo) sobresale por arriba */}
              <div className="absolute inset-x-0 bottom-0 top-[24%] rounded-[2rem] border border-white/70 bg-gradient-to-b from-roseBrand-100 to-roseBrand-200/80 shadow-soft dark:border-white/10 dark:from-[#3a272c] dark:to-[#2b1d21]" />
              <div className="absolute -inset-4 rounded-[2.5rem] bg-roseBrand-200/50 blur-2xl dark:bg-roseBrand-500/10" />
              <Image src="/doctora.png" alt="Dra. Mirian Galán, nutricionista" width={631} height={957} priority sizes="(min-width: 1024px) 460px, 90vw"
                className="relative mx-auto h-auto w-[88%] drop-shadow-[0_20px_30px_rgba(90,45,56,.22)]" />
              <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/70 bg-white/85 p-4 shadow-card backdrop-blur-xl dark:border-white/10 dark:bg-[#2b1d21]/90">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[.14em] text-roseBrand-700 dark:text-roseBrand-200">Atención personalizada</p>
                    <p className="mt-1 text-sm font-semibold text-roseBrand-900 dark:text-white">Salud · Bienestar · Confianza</p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-roseBrand-100 text-roseBrand-700 dark:bg-roseBrand-500/15 dark:text-roseBrand-200">
                    <Icon icon="lucide:heart-pulse" className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ TRUST STRIP ============ */}
        <section className="border-y border-roseBrand-200/70 bg-white/45 dark:border-white/10 dark:bg-white/[.02]" aria-label="Datos clave">
          <div className={`${wrap} grid grid-cols-2 divide-x divide-y divide-roseBrand-200/70 sm:grid-cols-4 sm:divide-y-0 dark:divide-white/10`}>
            {TRUST.map(([big, small]) => (
              <div key={big} className="px-4 py-6 text-center sm:px-5">
                <p className="font-display text-2xl text-roseBrand-900 dark:text-white">{big}</p>
                <p className={`mt-1 text-[11px] font-medium uppercase tracking-wider ${muted}`}>{small}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ============ SOBRE MÍ ============ */}
        <section id="sobre-mi" className={`defer-render ${wrap} py-24 lg:py-32`}>
          <div className="grid items-center gap-14 lg:grid-cols-[.82fr_1.18fr] lg:gap-24">
            <div className="reveal relative mx-auto w-full max-w-md">
              <div className="absolute -bottom-5 -right-5 h-40 w-40 rounded-full bg-roseBrand-100 dark:bg-roseBrand-500/10" />
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-nude-100 dark:bg-[#34252a]">
                <Photo icon="lucide:image" title="Foto secundaria" text="Ideal para una fotografía natural en consulta." />
              </div>
              <div className="absolute -bottom-6 left-5 rounded-2xl border border-white bg-white/90 px-5 py-4 shadow-card dark:border-white/10 dark:bg-[#2b1d21]/90">
                <p className="font-display text-xl text-roseBrand-900 dark:text-white">Tu salud, primero.</p>
                <p className={`mt-1 text-xs ${muted}`}>Sin extremos. Sin culpa.</p>
              </div>
            </div>

            <div className="reveal">
              <p className={label}>Sobre la doctora</p>
              <h2 className={`${h2} max-w-2xl`}>Comer mejor no significa dejar de disfrutar.</h2>
              <div className={`mt-6 space-y-4 text-sm leading-7 sm:text-base ${muted}`}>
                <p>
                  Soy la <strong className="font-semibold text-roseBrand-800 dark:text-[#f5e8eb]">{DOCTOR.name}</strong>, especialista en nutrición clínica y estética. Mi objetivo es ayudarte a construir una alimentación que tenga sentido para tu cuerpo, tus objetivos y tu rutina.
                </p>
                <p>Trabajo desde un enfoque individualizado, práctico y basado en evidencia. No se trata de seguir una dieta perfecta, sino de encontrar una estrategia que puedas mantener en el tiempo.</p>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[["lucide:graduation-cap", "Formación profesional", "Especialización y actualización continua."], ["lucide:microscope", "Basada en evidencia", "Decisiones nutricionales con criterio clínico."]].map(([i, t, d]) => (
                  <div key={t} className="flex gap-3 rounded-2xl border border-roseBrand-200/80 bg-white/55 p-4 dark:border-white/10 dark:bg-white/[.03]">
                    <Icon icon={i} className="mt-0.5 h-5 w-5 shrink-0 text-roseBrand-700 dark:text-roseBrand-300" />
                    <div>
                      <p className="text-sm font-semibold">{t}</p>
                      <p className={`mt-1 text-xs leading-5 ${muted}`}>{d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============ ESPECIALIDADES ============ */}
        <section id="especialidades" className="defer-render bg-white/60 py-24 sm:py-28 dark:bg-white/[.025]">
          <div className={wrap}>
            <div className="reveal max-w-2xl">
              <p className={label}>Especialidades</p>
              <h2 className={h2}>Nutrición que se adapta a ti.</h2>
              <p className={`mt-5 text-sm leading-7 sm:text-base ${muted}`}>Cada proceso parte de tus necesidades reales. Elegimos el camino según tu estado de salud, tus objetivos y tu estilo de vida.</p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {SPECIALTIES.map((s) => (
                <article key={s.title} className="reveal group rounded-[1.5rem] border border-roseBrand-200/80 bg-nude-50 p-6 transition duration-300 hover:-translate-y-1 hover:shadow-card dark:border-white/10 dark:bg-[#2b1d21]">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-roseBrand-100 text-roseBrand-700 dark:bg-roseBrand-500/15 dark:text-roseBrand-200"><Icon icon={s.icon} className="h-5 w-5" /></span>
                  <h3 className="mt-7 font-semibold">{s.title}</h3>
                  <p className={`mt-2 text-sm leading-6 ${muted}`}>{s.text}</p>
                  <a href={wa} className={`mt-5 inline-flex items-center gap-1 rounded text-xs font-semibold text-roseBrand-700 dark:text-roseBrand-200 ${ring}`}>Consultar <Icon icon="lucide:arrow-up-right" className="h-3.5 w-3.5" /></a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============ ENFOQUE ============ */}
        <section id="proceso" className={`defer-render ${wrap} py-24 lg:py-32`}>
          <div className="grid gap-14 lg:grid-cols-[.75fr_1.25fr] lg:gap-24">
            <div className="reveal">
              <p className={label}>Mi enfoque</p>
              <h2 className={h2}>Un plan para tu vida real.</h2>
              <p className={`mt-5 text-sm leading-7 ${muted}`}>Tu alimentación no debería competir con tu vida. Por eso cada consulta busca convertir la nutrición en decisiones sencillas y sostenibles.</p>
            </div>
            <ol className="space-y-3">
              {STEPS.map((s, i) => (
                <li key={s.n} className="reveal group flex gap-5 rounded-2xl border border-roseBrand-200/70 bg-white/50 p-5 transition hover:bg-white dark:border-white/10 dark:bg-white/[.025] dark:hover:bg-white/[.045]">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${i === 0 ? "bg-roseBrand-700 text-white" : "bg-roseBrand-100 text-roseBrand-700 dark:bg-roseBrand-500/15 dark:text-roseBrand-200"}`}>{s.n}</span>
                  <div>
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className={`mt-1 text-sm leading-6 ${muted}`}>{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ============ TESTIMONIOS ============ */}
        <section id="testimonios" className="defer-render bg-roseBrand-800 py-24 text-white sm:py-28">
          <div className={wrap}>
            <div className="reveal flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-roseBrand-200">Experiencias</p>
                <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight sm:text-5xl">Lo que cambia cuando el plan también se adapta a ti.</h2>
              </div>
              <p className="max-w-xs text-sm leading-6 text-white/75">Testimonios de pacientes reales pueden colocarse aquí.</p>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <blockquote key={t.who} className="reveal rounded-[1.5rem] border border-white/10 bg-white/[.07] p-6">
                  <Icon icon="lucide:quote" className="h-6 w-6 text-roseBrand-200" />
                  <p className="mt-7 text-[15px] leading-7 text-white/90">“{t.q}”</p>
                  <footer className="mt-7 flex items-center gap-3 border-t border-white/10 pt-5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">{t.ini}</span>
                    <div>
                      <p className="text-sm font-semibold">{t.who}</p>
                      <p className="text-xs text-white/70">{t.ctx}</p>
                    </div>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        {/* ============ CONTACTO ============ */}
        <section id="contacto" className={`defer-render ${wrap} pb-24 lg:pb-32`}>
          <div className="relative overflow-hidden rounded-[2rem] bg-nude-100 px-6 py-12 sm:px-10 lg:px-16 lg:py-16 dark:bg-[#34252a]">
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-roseBrand-200/60 blur-2xl dark:bg-roseBrand-500/10" />
            <div className="absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-white/60 blur-2xl dark:bg-white/5" />
            <div className="relative grid gap-12 lg:grid-cols-[1fr_.8fr] lg:items-center">
              <div className="reveal">
                <p className={label}>Da el primer paso</p>
                <h2 className={`${h2} max-w-2xl`}>Tu nutrición puede empezar con una conversación.</h2>
                <p className={`mt-5 max-w-xl text-sm leading-7 sm:text-base ${muted}`}>Escríbeme por WhatsApp, cuéntame qué estás buscando y coordinamos tu cita y la modalidad de consulta que mejor se adapte a ti.</p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <a href={wa} className={`inline-flex items-center gap-2 rounded-full bg-roseBrand-700 px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-roseBrand-800 ${ring}`}>
                    <Icon icon="lucide:message-circle" className="h-4 w-4" /> Escribir por WhatsApp
                  </a>
                </div>
                <p className={`mt-5 text-sm ${muted}`}>
                  WhatsApp <strong className="font-semibold">{CONTACT.whatsappNumber}</strong> · <span>{CONTACT.whatsappUsername}</span>
                  <br />
                  Instagram <a href={CONTACT.instagram} target="_blank" rel="noreferrer" className="font-semibold underline">{CONTACT.instagramHandle}</a>
                </p>
              </div>

              <div className="reveal rounded-[1.5rem] border border-white/70 bg-white/75 p-6 shadow-card backdrop-blur dark:border-white/10 dark:bg-[#21171a]/50">
                <div className="flex items-center gap-3 border-b border-roseBrand-200/70 pb-5 dark:border-white/10">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-roseBrand-100 text-roseBrand-700 dark:bg-roseBrand-500/15 dark:text-roseBrand-200"><Icon icon="lucide:calendar-days" className="h-5 w-5" /></span>
                  <div>
                    <p className="text-sm font-semibold">Coordina tu consulta</p>
                    <p className={`text-xs ${muted}`}>La doctora agenda tu cita contigo.</p>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {[["lucide:building-2", "Consulta presencial"], ["lucide:video", "Consulta online"]].map(([i, t]) => (
                    <a key={t} href={whatsappLink(`Hola Dra. Galán, me gustaría agendar una ${t.toLowerCase()}.`)} className={`flex items-center justify-between rounded-xl border border-roseBrand-200/70 bg-white/70 p-4 transition hover:border-roseBrand-500 hover:bg-roseBrand-50 dark:border-white/10 dark:bg-white/[.03] dark:hover:bg-white/[.06] ${ring}`}>
                      <span className="flex items-center gap-3"><Icon icon={i} className="h-4 w-4 text-roseBrand-700 dark:text-roseBrand-300" /><span className="text-sm font-medium">{t}</span></span>
                      <Icon icon="lucide:chevron-right" className="h-4 w-4 text-roseBrand-700 dark:text-roseBrand-300" />
                    </a>
                  ))}
                </div>
                <p className={`mt-5 flex items-center gap-2 text-[11px] leading-5 ${muted}`}><Icon icon="lucide:clock-3" className="h-3.5 w-3.5" /> Horarios y disponibilidad sujetos a agenda de la doctora.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-roseBrand-200/70 bg-white/45 dark:border-white/10 dark:bg-white/[.02]">
        <div className={`${wrap} py-10`}>
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-roseBrand-700 text-white"><Icon icon="lucide:heart-pulse" className="h-4 w-4" /></span>
                <span className="font-semibold">{DOCTOR.name}</span>
              </div>
              <p className={`mt-3 max-w-sm text-xs leading-5 ${muted}`}>Nutrición clínica y estética · Consultas presenciales y online · Planes personalizados.</p>
            </div>
            <nav aria-label="Pie de página" className={`flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium ${muted}`}>
              {[["#inicio", "Inicio"], ["#sobre-mi", "Sobre mí"], ["#especialidades", "Especialidades"], ["#contacto", "Contacto"]].map(([h, t]) => (
                <a key={h} href={h} className={`rounded py-1 hover:text-roseBrand-700 ${ring}`}>{t}</a>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              {[["lucide:instagram", "Instagram", CONTACT.instagram], ["simple-icons:tiktok", "TikTok", CONTACT.tiktok], ["lucide:message-circle", "WhatsApp", wa]].map(([i, n, h]) => (
                <a key={n} href={h} aria-label={n} target="_blank" rel="noreferrer" className={`flex h-11 w-11 items-center justify-center rounded-full border border-roseBrand-200 text-roseBrand-700 transition hover:bg-roseBrand-50 dark:border-white/10 dark:text-roseBrand-200 dark:hover:bg-white/5 ${ring}`}>
                  <Icon icon={i} className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div className={`mt-8 flex flex-col gap-2 border-t border-roseBrand-200/60 pt-6 text-[11px] sm:flex-row sm:items-center sm:justify-between dark:border-white/10 ${muted}`}>
            <p>© 2026 {DOCTOR.name}. Todos los derechos reservados.</p>
            <p>La información de este sitio no sustituye una evaluación profesional individual.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
