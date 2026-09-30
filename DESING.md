
# DESIGN.md - Sistema de Diseño & UX (Dra. Mirian Galán)

## 1. Principios de Diseño Visual
* **Estética "Medical & Clinical Beauty":** Tono rosa palo suave (*Dusty Rose*), tonos nude/crema cálidos y acentos en oro rosa (*Rose Gold*). Transmite salud, cuidado nutricional premium, estética clínica y cercanía profesional.
* **Componentes Tipo "Bento Grid":** La landing page organiza credenciales, servicios, testimonios y el widget de agendamiento en bloques Bento con sombras suaves y bordes finos (`border-rose-100`).
* **Micro-Interacciones:** Animaciones fluidas utilizando `framer-motion` para transiciones de paso en el agendamiento y feedback táctil inmediato en los botones de horarios (*time slots*).


---

## 2. Paleta de Colores (Tailwind CSS Configuration)

```javascript
// tailwind.config.js - Extensión de colores
module.exports = {
  theme: {
    extend: {
      colors: {
        roseBrand: {
          50:  '#fdf8f9',
          100: '#f9eef1',
          200: '#f3dbe1',
          500: '#c87a8e', // Rosa Dusty Principal (Profesional)
          600: '#b06175', // Hover
          800: '#5a2d38', // Texto Oscuro Borgoña/Rosa Vino
          900: '#3d1c24',
        },
        nude: {
          50:  '#faf7f5', // Fondo cálido principal
          100: '#f4ede7',
          200: '#e8dbd1',
          300: '#d7c3b4',
        },
        surface: '#ffffff',
      }
    }
  }
}

```

---

## 3. Tipografía & Jerarquía

* **Titulares (Headings):** `Playfair Display` o `Cormorant Garamond` (Serif de alta gama) para transmitir elegancia clínica y credibilidad médica.
* **Cuerpo & UI:** `Plus Jakarta Sans` o `Outfit` (Sans-serif hiper-legible) para formularios, calendarios y textos secundarios.

---

## 4. Componentes Clave

### A. Widget de Agendamiento

* **Selector de Fechas:** Calendario compacto de vista mensual con días disponibles resaltados en `brand-500` e inactivos opacos (`opacity-40`).
* **Grilla de Horarios (*Time Slots*):** Botones tipo píldora (`rounded-xl`).
* *Estado Normal:* Fondo `sand-50`, texto `brand-800`, borde `sand-200`.
* *Estado Seleccionado:* Fondo `brand-500`, texto `white`, animación de escala `scale-[1.02]`.
* *Estado Ocupado:* Deshabilitado con `line-through` suave.



### B. Módulo de Modal de Confirmación

* Overlay con efecto *glassmorphism* (`backdrop-blur-md bg-brand-900/20`).
* Resumen claro de cita con ícono distintivo según modalidad:
* 🏥 **Presencial:** Muestra dirección y botón de navegación en Google Maps.
* 💻 **Virtual:** Resalta la autogeneración del enlace de Google Meet.



---

## 5. Íconos

* **Librería Standard:** **Iconify** usando `@iconify/react` (conjuntos `lucide:*` para interfaz y `logos:*` para marcas como Google Calendar).

---

## 6. Accesibilidad (a11y)

* Contraste `WCAG AA` verificado en combinación de textos `brand-800` sobre fondos `sand-50`.
* Navegación completa por teclado en el selector de horarios (`focus-visible:ring-2 focus-visible:ring-brand-500`).