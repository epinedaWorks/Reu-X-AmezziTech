import Anthropic from "@anthropic-ai/sdk";
import { AnthropicBedrock } from "@anthropic-ai/bedrock-sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { REGION } from "./aws";

// Proveedor del modelo:
//  - "bedrock"   → Claude en Amazon Bedrock (región de REUX_AWS_REGION).
//  - "anthropic" → API de Anthropic directa (requiere ANTHROPIC_API_KEY).
//  - "demo"      → respuestas fijas de ejemplo, para probar la interfaz sin modelo.
// Si REUX_LLM no está definido se usa Anthropic cuando hay API key, si no Bedrock.
type Proveedor = "bedrock" | "anthropic" | "demo";

export function proveedor(): Proveedor {
  const p = process.env.REUX_LLM;
  if (p === "bedrock" || p === "anthropic" || p === "demo") return p;
  return process.env.ANTHROPIC_API_KEY ? "anthropic" : "bedrock";
}

function cliente() {
  if (proveedor() === "anthropic") {
    return { client: new Anthropic(), model: process.env.REUX_MODEL ?? "claude-opus-5-5" };
  }
  return {
    client: new AnthropicBedrock({ awsRegion: REGION }),
    model: process.env.REUX_BEDROCK_MODEL ?? "us.anthropic.claude-opus-5-5",
  };
}

export class ErrorLLM extends Error {}

export async function generarEstructurado<T extends z.ZodType>(opts: {
  system: string;
  prompt: string;
  schema: T;
}): Promise<z.infer<T>> {
  const { client, model } = cliente();
  let respuesta;
  try {
    respuesta = await client.messages.parse({
      model,
      max_tokens: 16000,
      system: opts.system,
      output_config: { effort: "medium", format: zodOutputFormat(opts.schema) },
      messages: [{ role: "user", content: opts.prompt }],
    });
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      throw new ErrorLLM(explicarError(e));
    }
    throw e;
  }

  if (respuesta.stop_reason === "refusal") {
    throw new ErrorLLM("El modelo no pudo procesar este contenido. Revisa el texto e intenta de nuevo.");
  }
  if (respuesta.stop_reason === "max_tokens") {
    throw new ErrorLLM("La reunión es demasiado larga para procesarla de una sola vez.");
  }
  if (!respuesta.parsed_output) {
    throw new ErrorLLM("El modelo devolvió una respuesta con formato inválido. Intenta de nuevo.");
  }
  return respuesta.parsed_output as z.infer<T>;
}

function explicarError(e: InstanceType<typeof Anthropic.APIError>): string {
  const p = proveedor();
  if (p === "bedrock" && e.status === 404 && /use case/i.test(e.message)) {
    return "Amazon Bedrock pide completar el formulario de caso de uso de Anthropic (consola de Bedrock → Catálogo de modelos → un modelo Claude). Después de enviarlo, espera unos 15 minutos.";
  }
  if (p === "bedrock" && (e.status === 403 || e.status === 400)) {
    return `Amazon Bedrock rechazó la solicitud (${e.status}). La cuenta AWS no tiene acceso al modelo en ${REGION}: solicita acceso en la consola de Bedrock o define ANTHROPIC_API_KEY para usar la API de Anthropic. Detalle: ${e.message}`;
  }
  if (e.status === 401) return "Credenciales del modelo inválidas. Revisa ANTHROPIC_API_KEY.";
  if (e.status === 429) return "Demasiadas solicitudes al modelo. Espera un momento e intenta de nuevo.";
  return `Error del modelo (${e.status ?? "sin código"}): ${e.message}`;
}
