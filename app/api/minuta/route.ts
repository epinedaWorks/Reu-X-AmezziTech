import { exigirSesion } from "@/lib/autorizacion";
import { MinutaSchema } from "@/lib/esquemas";
import { consumirCuota, cuotaAgotada } from "@/lib/usuarios";
import { TEXTO_MAXIMO } from "@/lib/formatos";
import { MINUTA_EJEMPLO } from "@/lib/ejemplo";
import { ErrorLLM, generarEstructurado, proveedor } from "@/lib/llm";

export const maxDuration = 300;

const SYSTEM = `Eres el secretario de actas de una organización y redactas minutas formales en español.

Recibirás la transcripción o las notas de una reunión. Las transcripciones automáticas identifican a las personas como "Hablante 1", "Hablante 2", etc.; si durante la conversación queda claro cómo se llama alguien (se presenta, lo saludan por su nombre, firma una intervención), usa su nombre real. Si no, conserva la etiqueta "Hablante N".

Reglas:
- Usa solo información presente en el contenido o en los datos que te dé el usuario. No inventes nombres, fechas, cifras ni acuerdos. Si un campo no se menciona, déjalo como cadena vacía o lista vacía.
- Escribe las fechas tal como se dijeron. No conviertas fechas relativas ("el próximo jueves", "en dos semanas") en fechas de calendario, ni agregues un año que no se mencionó.
- Un acuerdo es una decisión tomada por el grupo; una tarea es un compromiso concreto de alguien. No mezcles ambos.
- Si una tarea no tiene responsable claro, escribe "Por definir".
- Agrupa la discusión en temas coherentes en el orden en que se trataron. Los puntos clave deben ser frases cortas y concretas.
- Redacta en español formal, en tercera persona y en tiempo pasado, aunque la reunión haya sido en otro idioma.
- Corrige errores evidentes de la transcripción automática (palabras mal reconocidas) cuando el contexto lo deje claro.`;

export async function POST(req: Request) {
  const a = await exigirSesion();
  if (!a.ok) return a.respuesta;
  const agotada = cuotaAgotada(a.datos.registro);
  if (agotada) return Response.json({ error: agotada }, { status: 429 });

  const { texto, contexto } = (await req.json()) as {
    texto?: string;
    contexto?: { titulo?: string; fecha?: string; lugar?: string; participantes?: string; notas?: string };
  };
  if (!texto?.trim()) {
    return Response.json({ error: "No hay contenido para resumir." }, { status: 400 });
  }
  if (texto.length > TEXTO_MAXIMO) {
    return Response.json(
      { error: `El texto es muy largo (${texto.length.toLocaleString("es")} caracteres). El máximo es ${TEXTO_MAXIMO.toLocaleString("es")}.` },
      { status: 400 },
    );
  }

  const datos = [
    contexto?.titulo && `Título sugerido: ${contexto.titulo}`,
    contexto?.fecha && `Fecha: ${contexto.fecha}`,
    contexto?.lugar && `Lugar o plataforma: ${contexto.lugar}`,
    contexto?.participantes && `Participantes conocidos: ${contexto.participantes}`,
    contexto?.notas && `Indicaciones adicionales: ${contexto.notas}`,
  ].filter(Boolean);

  const prompt = `${datos.length ? `Datos proporcionados por el usuario:\n${datos.join("\n")}\n\n` : ""}<reunion>\n${texto}\n</reunion>\n\nRedacta la minuta de esta reunión.`;

  if (proveedor() === "demo") {
    return Response.json({ minuta: MINUTA_EJEMPLO, demo: true });
  }
  try {
    const minuta = await generarEstructurado({ system: SYSTEM, prompt, schema: MinutaSchema });
    if (a.datos.registro) await consumirCuota(a.datos.registro.usuario);
    return Response.json({ minuta });
  } catch (e) {
    if (e instanceof ErrorLLM) return Response.json({ error: e.message }, { status: 502 });
    throw e;
  }
}
