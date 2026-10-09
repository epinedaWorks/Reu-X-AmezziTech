import { z } from "zod";

// Estructura de la minuta que devuelve el modelo. Todos los campos son
// obligatorios (cadena o lista vacía cuando la reunión no lo menciona) para
// que la salida estructurada sea estricta y la UI no tenga que adivinar.
export const MinutaSchema = z.object({
  titulo: z.string().describe("Título breve y descriptivo de la reunión"),
  fecha: z.string().describe("Fecha de la reunión tal como se conozca, o cadena vacía"),
  hora: z.string().describe("Hora o rango de horas, o cadena vacía"),
  lugar: z.string().describe("Lugar físico o plataforma virtual, o cadena vacía"),
  participantes: z.array(
    z.object({
      nombre: z.string(),
      rol: z.string().describe("Cargo o papel en la reunión, o cadena vacía"),
    }),
  ),
  objetivo: z.string().describe("Propósito principal de la reunión"),
  resumen_ejecutivo: z.string().describe("Resumen de 3 a 6 oraciones"),
  agenda: z.array(z.string()),
  temas: z.array(
    z.object({
      titulo: z.string(),
      resumen: z.string(),
      puntos: z.array(z.string()).describe("Puntos clave discutidos en el tema"),
    }),
  ),
  acuerdos: z.array(z.string()),
  tareas: z.array(
    z.object({
      tarea: z.string(),
      responsable: z.string().describe("Persona o área responsable, o 'Por definir'"),
      fecha_limite: z.string().describe("Fecha límite mencionada, o cadena vacía"),
    }),
  ),
  pendientes: z.array(z.string()).describe("Temas abiertos o sin resolver"),
  proxima_reunion: z.string().describe("Fecha o indicación de la próxima reunión, o cadena vacía"),
});

export type Minuta = z.infer<typeof MinutaSchema>;

// Diagrama de flujo: el modelo describe nodos y conexiones y la app arma el
// código Mermaid, así el texto queda siempre bien escapado.
export const FlujoSchema = z.object({
  titulo: z.string(),
  nodos: z.array(
    z.object({
      id: z.string().describe("Identificador corto sin espacios, p. ej. n1"),
      texto: z.string().describe("Texto del nodo, máximo ~8 palabras"),
      tipo: z.enum(["inicio", "proceso", "decision", "fin"]),
    }),
  ),
  conexiones: z.array(
    z.object({
      desde: z.string(),
      hacia: z.string(),
      etiqueta: z.string().describe("Texto de la flecha (p. ej. 'Sí' o 'No'), o cadena vacía"),
    }),
  ),
});

export type Flujo = z.infer<typeof FlujoSchema>;

// Íconos disponibles para mapas mentales e infografías (la UI los dibuja).
export const ICONOS = [
  "objetivo", "personas", "idea", "acuerdo", "tarea", "fecha", "dinero", "alerta",
  "tecnologia", "datos", "crecimiento", "pregunta", "proceso", "comunicacion", "documento", "meta",
] as const;
export type Icono = (typeof ICONOS)[number];
const icono = z.enum(ICONOS);

export const MapaSchema = z.object({
  centro: z.string().describe("Idea central, máximo 6 palabras"),
  ramas: z
    .array(
      z.object({
        titulo: z.string().describe("Máximo 4 palabras"),
        icono,
        ideas: z.array(
          z.object({
            texto: z.string().describe("Máximo 8 palabras"),
            detalles: z.array(z.string()).describe("0 a 3 detalles de máximo 8 palabras"),
          }),
        ),
      }),
    )
    .describe("Entre 4 y 6 ramas"),
});

export type Mapa = z.infer<typeof MapaSchema>;

export const InfografiaSchema = z.object({
  titulo: z.string().describe("Título llamativo, máximo 8 palabras"),
  subtitulo: z.string().describe("Complemento del título, máximo 12 palabras"),
  evento: z.string().describe("Nombre del evento, proyecto u organización si se menciona; si no, cadena vacía"),
  frase_clave: z.string().describe("Idea principal de la reunión en máximo 25 palabras"),
  bloques: z
    .array(
      z.object({
        titulo: z.string().describe("Máximo 5 palabras"),
        icono,
        texto: z.string().describe("Máximo 35 palabras"),
        puntos: z.array(z.string()).describe("2 a 4 puntos de máximo 10 palabras"),
      }),
    )
    .describe("3 o 4 bloques"),
  cifras: z
    .array(z.object({ valor: z.string().describe("Número o dato corto, p. ej. '15 nov' o '$12,000'"), etiqueta: z.string() }))
    .describe("0 a 3 cifras o fechas clave que aparezcan literalmente en la minuta"),
  destacados: z.array(z.object({ texto: z.string().describe("Máximo 4 palabras"), icono })).describe("3 a 5 etiquetas"),
  conclusion: z.string().describe("Cierre 'En resumen', máximo 45 palabras"),
});

export type Infografia = z.infer<typeof InfografiaSchema>;
