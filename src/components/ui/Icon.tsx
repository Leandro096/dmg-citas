import type { IconifyJSON } from "@iconify/react";
import { iconData } from "@/lib/icon-data";

// SVG inline generados desde el set empaquetado (lib/icon-data.ts, vía `npm run icons`).
// Sin runtime de Iconify ni peticiones de red; funciona en Server y Client Components.
type Def = { body: string; w: number; h: number };
const registry = new Map<string, Def>();
for (const set of iconData as (IconifyJSON & { prefix: string })[]) {
  for (const [name, icon] of Object.entries(set.icons)) {
    registry.set(`${set.prefix}:${name}`, { body: icon.body, w: icon.width ?? set.width ?? 16, h: icon.height ?? set.height ?? 16 });
  }
}

export function Icon({ icon, className }: { icon: string; className?: string }) {
  const def = registry.get(icon);
  if (!def) return null;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${def.w} ${def.h}`} width="1em" height="1em" aria-hidden="true" focusable="false"
      className={className} dangerouslySetInnerHTML={{ __html: def.body }} />
  );
}
