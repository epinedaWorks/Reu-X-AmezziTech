import type { z } from "zod";
import { exigirSesion } from "@/lib/autorizacion";
import { FlujoSchema, InfografiaSchema, MapaSchema, type Minuta } from "@/lib/esquemas";
import { FLUJO_EJEMPLO, INFOGRAFIA_EJEMPLO, MAPA_EJEMPLO } from "@/lib/ejemplo";
import { ErrorLLM, generarEstructurado, proveedor } from "@/lib/llm";

export const maxDuration = 300;

const COMUN = `Reglas comunes:
- Escribe en español, con frases cortas y claras.
- Usa solo información de la minuta. No inventes nombres, fechas, cifras ni acuerdos.
- Respeta los límites de palabras indicados en cada campo: el resultado se dibuja en una imagen y los textos largos no caben.`;

const VISUALES: Record<string, { system: string; pedido: string; schema: z.ZodType; demo: unknown }> = {
  flujo: {
    schema: FlujoSchema,
    demo: FLUJO_EJEMPLO,
    pedido: "Genera el diagrama de flujo.",
    system: `Conviertes minutas de reunión en diagramas de flujo claros.

El diagrama debe mostrar el proceso que se acordó o se discutió en la reunión: los pasos en orden, las decisiones (con sus ramas "Sí"/"No" u opciones) y los responsables cuando aporten claridad. Si la reunión no describe un proceso, muestra el recorrido de la reunión: del objetivo, pasando por los temas y decisiones, hasta los acuerdos y siguientes pasos.

- Entre 6 y 18 nodos. Un único nodo "inicio" y al menos un nodo "fin".
- Texto de cada nodo: máximo 8 palabras.
- Cada nodo "decision" debe tener al menos dos conexiones de salida con etiqueta.
- Todas las conexiones deben referirse a ids de nodos existentes.

${COMUN}`,
  },
  mapa: {
    schema: MapaSchema,
    demo: MAPA_EJEMPLO,
    pedido: "Genera el mapa mental.",
    system: `Conviertes minutas de reunión en mapas mentales fáciles de leer de un vistazo.

- La idea central resume de qué trató la reunión.
- Cada rama es un eje temático (por ejemplo: objetivo, cada tema importante, acuerdos, tareas, pendientes). Elige el ícono que mejor la represente.
- Las ideas son palabras clave o frases muy cortas, no oraciones completas. Usa "detalles" solo cuando aporten un dato concreto (responsable, fecha, cifra).
- Entre 2 y 5 ideas por rama.

${COMUN}`,
  },
  infografia: {
    schema: InfografiaSchema,
    demo: INFOGRAFIA_EJEMPLO,
    pedido: "Genera el contenido de la infografía.",
    system: `Redactas el contenido de una infografía que resume una reunión para compartirla en redes sociales o por correo.

- El título debe ser atractivo pero fiel a la reunión. No exageres: si algo quedó condicionado o pendiente, no lo presentes como un hecho.
- Cada bloque cubre un aspecto distinto (por ejemplo: contexto o perfil, temas principales, decisiones, siguientes pasos). Elige el ícono que mejor lo represente.
- Las cifras solo pueden ser números, montos o fechas que aparezcan en la minuta; si no hay, deja la lista vacía.
- Los destacados son etiquetas muy breves con las ideas fuerza.
- La conclusión es un cierre que se entiende sin leer lo demás.

${COMUN}`,
  },
};

export async function POST(req: Request) {
  const a = await exigirSesion();
  if (!a.ok) return a.respuesta;
  const { minuta, tipo } = (await req.json()) as { minuta?: Minuta; tipo?: string };
  const visual = tipo ? VISUALES[tipo] : undefined;
  if (!minuta || !visual) {
    return Response.json({ error: "Falta la minuta o el tipo de visual." }, { status: 400 });
  }
  if (proveedor() === "demo") {
    return Response.json({ datos: visual.demo, demo: true });
  }
  try {
    const datos = await generarEstructurado({
      system: visual.system,
      prompt: `<minuta>\n${JSON.stringify(minuta, null, 2)}\n</minuta>\n\n${visual.pedido}`,
      schema: visual.schema,
    });
    return Response.json({ datos });
  } catch (e) {
    if (e instanceof ErrorLLM) return Response.json({ error: e.message }, { status: 502 });
    throw e;
  }
}
