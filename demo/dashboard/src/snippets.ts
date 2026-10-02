/**
 * Fuentes reales de la integración, embebidas con ?raw de vite — lo que se
 * muestra en /docs y en la tab Adopción es literalmente el código que corre.
 */
import gateCheckSrc from "../../services/gate-check.ts?raw";
import serviceZSrc from "../../services/service-z/src/index.ts?raw";

/**
 * Extrae del fuente real los bloques marcados `// ── INTEGRACIÓN …` —
 * el handler completo que un adoptante agrega a su servicio.
 */
export function extractIntegration(src: string): string {
  const out: string[] = [];
  let capture = false;
  for (const l of src.split("\n")) {
    if (/INTEGRACIÓN/.test(l)) {
      if (!capture && out.length > 0) out.push("    // …");
      capture = true;
      continue;
    }
    if (capture && /^\s*\/\/\s*─+\s*$/.test(l)) {
      capture = false;
      continue;
    }
    if (capture) out.push(l.replace(/^\s{4}/, "  "));
  }
  return out.join("\n").trim();
}

export const SERVICE_Z_SNIPPET = extractIntegration(serviceZSrc);
export const GATE_CHECK_SRC = gateCheckSrc;
export const SERVICE_Z_SRC = serviceZSrc;
