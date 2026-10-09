import { GetObjectCommand } from "@aws-sdk/client-s3";
import { GetTranscriptionJobCommand } from "@aws-sdk/client-transcribe";
import { exigirSesion } from "@/lib/autorizacion";
import { bucket, s3, transcribe, respuestaErrorAws } from "@/lib/aws";
import { formatearTranscripcion, type SalidaTranscribe } from "@/lib/transcripcion";

// Consulta el estado de un trabajo de Transcribe. Cuando termina devuelve el
// texto ya formateado por hablante.
export async function POST(req: Request) {
  try {
    return await manejar(req);
  } catch (e) {
    return respuestaErrorAws(e);
  }
}

async function manejar(req: Request) {
  const a = await exigirSesion();
  if (!a.ok) return a.respuesta;
  const { trabajo } = (await req.json()) as { trabajo?: string };
  if (!trabajo || !/^reux-[\w-]+$/.test(trabajo)) {
    return Response.json({ error: "Trabajo inválido." }, { status: 400 });
  }

  const { TranscriptionJob: job } = await transcribe.send(
    new GetTranscriptionJobCommand({ TranscriptionJobName: trabajo }),
  );
  const estado = job?.TranscriptionJobStatus;
  if (estado === "FAILED") {
    return Response.json({ estado: "fallo", error: job?.FailureReason ?? "Transcribe no pudo procesar el archivo." });
  }
  if (estado !== "COMPLETED") {
    return Response.json({ estado: "procesando" });
  }

  const obj = await s3.send(
    new GetObjectCommand({ Bucket: bucket(), Key: `transcripciones/${trabajo}.json` }),
  );
  const salida = JSON.parse(await obj.Body!.transformToString()) as SalidaTranscribe;
  return Response.json({
    estado: "listo",
    idioma: job?.LanguageCode ?? "",
    texto: formatearTranscripcion(salida),
  });
}
