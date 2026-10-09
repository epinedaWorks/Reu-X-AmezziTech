import { StartTranscriptionJobCommand } from "@aws-sdk/client-transcribe";
import { bucket, transcribe } from "@/lib/aws";

// Inicia un trabajo de Amazon Transcribe sobre un archivo ya subido a S3.
export async function POST(req: Request) {
  const { key } = (await req.json()) as { key?: string };
  if (!key?.startsWith("entradas/")) {
    return Response.json({ error: "Archivo inválido." }, { status: 400 });
  }

  const b = bucket();
  const trabajo = `reux-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  await transcribe.send(
    new StartTranscriptionJobCommand({
      TranscriptionJobName: trabajo,
      Media: { MediaFileUri: `s3://${b}/${key}` },
      // Detecta el idioma entre las opciones más comunes para las reuniones.
      IdentifyLanguage: true,
      LanguageOptions: ["es-US", "es-ES", "en-US"],
      Settings: { ShowSpeakerLabels: true, MaxSpeakerLabels: 10 },
      OutputBucketName: b,
      OutputKey: `transcripciones/${trabajo}.json`,
    }),
  );
  return Response.json({ trabajo });
}
