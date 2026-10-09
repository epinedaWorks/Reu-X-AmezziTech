import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { bucket, s3 } from "@/lib/aws";
import { EXTENSIONES_MEDIA, TAMANO_MAXIMO } from "@/lib/formatos";

// Devuelve una URL firmada para que el navegador suba el archivo directo a S3
// (sin pasar el video por el servidor).
export async function POST(req: Request) {
  const { nombre, tipo, tamano } = (await req.json()) as {
    nombre?: string;
    tipo?: string;
    tamano?: number;
  };
  const ext = nombre?.split(".").pop()?.toLowerCase() ?? "";
  if (!nombre || !EXTENSIONES_MEDIA.includes(ext)) {
    return Response.json(
      { error: `Formato no soportado. Usa: ${EXTENSIONES_MEDIA.join(", ")}` },
      { status: 400 },
    );
  }
  if (!tamano || tamano > TAMANO_MAXIMO) {
    return Response.json({ error: "El archivo supera el máximo de 2 GB." }, { status: 400 });
  }

  const limpio = nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w.-]+/g, "_")
    .slice(-80);
  const key = `entradas/${crypto.randomUUID()}-${limpio}`;
  const url = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: tipo || "application/octet-stream" }),
    { expiresIn: 3600 },
  );
  return Response.json({ key, url });
}
