// Empaqueta solo los íconos usados (lucide:* y logos:*) para no depender de la API de Iconify en runtime.
// Uso: npm run icons   (ejecutar al añadir íconos nuevos)
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getIcons } from "@iconify/utils";
import lucide from "@iconify-json/lucide/icons.json" with { type: "json" };
import logos from "@iconify-json/logos/icons.json" with { type: "json" };
import simple from "@iconify-json/simple-icons/icons.json" with { type: "json" };

const sets = { lucide, logos, "simple-icons": simple };
const used = { lucide: new Set(), logos: new Set(), "simple-icons": new Set() };

function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (f === "node_modules" || f === ".next") continue;
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|mjs)$/.test(f) && !p.endsWith("icon-data.ts")) {
      for (const m of readFileSync(p, "utf8").matchAll(/["'`](lucide|logos|simple-icons):([a-z0-9-]+)["'`]/g)) used[m[1]].add(m[2]);
    }
  }
}
["src"].forEach(walk);

const collections = Object.entries(used).map(([prefix, names]) => {
  const data = getIcons(sets[prefix], [...names].sort(), true);
  const missing = [...names].filter((n) => !data?.icons?.[n] && !data?.aliases?.[n]);
  if (missing.length) console.warn(`Íconos no encontrados en ${prefix}:`, missing.join(", "));
  return data;
});

writeFileSync("src/lib/icon-data.ts", `// Generado por scripts/build-icons.mjs — no editar a mano.\nimport type { IconifyJSON } from "@iconify/react";\nexport const iconData: IconifyJSON[] = ${JSON.stringify(collections)};\n`);
console.log("Íconos:", Object.fromEntries(Object.entries(used).map(([k, v]) => [k, v.size])));
