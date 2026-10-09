import { S3Client } from "@aws-sdk/client-s3";
import { TranscribeClient } from "@aws-sdk/client-transcribe";

// California (N. California) por defecto.
export const REGION = process.env.REUX_AWS_REGION ?? "us-west-1";

export function bucket(): string {
  const b = process.env.REUX_BUCKET;
  if (!b) throw new Error("Falta la variable REUX_BUCKET en .env.local");
  return b;
}

// Las credenciales salen de la cadena estándar de AWS (variables de entorno,
// perfil de ~/.aws o rol de la instancia).
export const s3 = new S3Client({ region: REGION });
export const transcribe = new TranscribeClient({ region: REGION });

const CODIGOS_CREDENCIALES = ["ExpiredToken", "ExpiredTokenException", "TokenRefreshRequired", "InvalidToken", "UnrecognizedClientException"];

// Convierte errores de credenciales de AWS en una respuesta clara para la interfaz.
export function respuestaErrorAws(e: unknown): Response {
  const nombre = (e as { name?: string })?.name ?? "";
  const mensaje = e instanceof Error ? e.message : String(e);
  if (CODIGOS_CREDENCIALES.includes(nombre) || /token.*expired|expired.*token/i.test(mensaje)) {
    return Response.json(
      { error: "Las credenciales de AWS del servidor vencieron. Renuévelas (en local: aws login --profile reux) y vuelva a intentar." },
      { status: 503 },
    );
  }
  return Response.json({ error: `Error de AWS: ${mensaje}` }, { status: 502 });
}
