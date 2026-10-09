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
