import { GetObjectCommand, PutObjectCommand, S3ServiceException } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { bucket, s3 } from "./aws";
import { idValido } from "./actividad";
import type { Minuta } from "./esquemas";

// Reuniones guardadas: reuniones/<usuario>/<id>/reunion.json con la transcripción, la minuta
// y los visuales ya generados, más la grabación original en la misma carpeta. Así el usuario
// puede volver a abrirlas sin transcribir ni redactar de nuevo. Esta carpeta no caduca.

export type Reunion = {
  id: string;
  usuario: string;
  creada: string;
  actualizada: string;
  titulo: string;
  fuente: "archivo" | "texto";
  grabacion?: { key: string; nombre: string; tipo: string; mb: number };
  transcripcion: string;
  minuta: Minuta;
  visuales: Record<string, unknown>; // mapa, infografia, flujo
};

export const carpeta = (usuario: string, id: string) => `reuniones/${usuario}/${id}/`;
const clave = (usuario: string, id: string) => `${carpeta(usuario, id)}reunion.json`;

// Grabación pendiente de asociar (se anota al autorizar la subida).
const claveGrabacion = (usuario: string, id: string) => `${carpeta(usuario, id)}grabacion.json`;

async function leerJSON<T>(key: string): Promise<{ datos: T; etag?: string } | null> {
  try {
    const r = await s3.send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
    return { datos: JSON.parse(await r.Body!.transformToString()) as T, etag: r.ETag };
  } catch (e) {
    // Sin s3:ListBucket, S3 responde 403 (no 404) cuando el objeto no existe.
    const status = e instanceof S3ServiceException ? e.$metadata.httpStatusCode : 0;
    if (e instanceof S3ServiceException && (e.name === "NoSuchKey" || status === 404 || status === 403)) return null;
    throw e;
  }
}

async function escribirJSON(key: string, datos: unknown, condicion: { IfMatch?: string; IfNoneMatch?: string }) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: JSON.stringify(datos),
      ContentType: "application/json",
      ServerSideEncryption: "AES256",
      ...condicion,
    }),
  );
}

export async function obtenerReunion(usuario: string, id: string): Promise<Reunion | null> {
  if (!idValido(id)) return null;
  return (await leerJSON<Reunion>(clave(usuario, id)))?.datos ?? null;
}

export function anotarGrabacion(usuario: string, id: string, g: NonNullable<Reunion["grabacion"]>) {
  return escribirJSON(claveGrabacion(usuario, id), g, {});
}

// Lee, modifica y guarda con If-Match (reintenta si hubo otra escritura en medio).
async function modificar(usuario: string, id: string, cambio: (r: Reunion | null) => Reunion | null) {
  for (let intento = 0; intento < 5; intento++) {
    const actual = await leerJSON<Reunion>(clave(usuario, id));
    const nueva = cambio(actual?.datos ?? null);
    if (!nueva) return;
    nueva.actualizada = new Date().toISOString();
    try {
      await escribirJSON(clave(usuario, id), nueva, actual?.etag ? { IfMatch: actual.etag } : { IfNoneMatch: "*" });
      return;
    } catch (e) {
      const status = e instanceof S3ServiceException ? e.$metadata.httpStatusCode : 0;
      if (status === 412 || status === 409) continue;
      throw e;
    }
  }
}

// Guardar nunca debe interrumpir al usuario: si falla, solo se anota en el log.
async function seguro(accion: string, fn: () => Promise<void>): Promise<boolean> {
  try {
    await fn();
    return true;
  } catch (e) {
    console.error(`[reuniones] no se pudo ${accion}:`, e);
    return false;
  }
}

// Guarda (o actualiza, si se regeneró) la minuta de una reunión.
export function guardarMinuta(usuario: string, id: unknown, transcripcion: string, minuta: Minuta) {
  if (!idValido(id)) return Promise.resolve(false);
  return seguro("guardar la minuta", async () => {
    const grabacion = (await leerJSON<NonNullable<Reunion["grabacion"]>>(claveGrabacion(usuario, id)))?.datos;
    await modificar(usuario, id, (r) => {
      const ahora = new Date().toISOString();
      return {
        id,
        usuario,
        creada: r?.creada ?? ahora,
        actualizada: ahora,
        fuente: (grabacion ?? r?.grabacion) ? "archivo" : "texto",
        grabacion: grabacion ?? r?.grabacion,
        titulo: minuta.titulo,
        transcripcion,
        minuta,
        // Una minuta nueva deja obsoletos los visuales anteriores.
        visuales: r && r.minuta.titulo === minuta.titulo && JSON.stringify(r.minuta) === JSON.stringify(minuta) ? r.visuales : {},
      };
    });
  });
}

export function guardarVisual(usuario: string, id: unknown, tipo: string, datos: unknown) {
  if (!idValido(id)) return Promise.resolve(false);
  return seguro("guardar el visual", () =>
    modificar(usuario, id, (r) => (r ? { ...r, visuales: { ...r.visuales, [tipo]: datos } } : null)),
  );
}

// Enlace temporal (1 h) para reproducir o descargar la grabación original.
export function urlGrabacion(g: NonNullable<Reunion["grabacion"]>, descargar = false) {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: bucket(),
      Key: g.key,
      ...(descargar ? { ResponseContentDisposition: `attachment; filename="${g.nombre.replace(/[^\w.-]+/g, "_")}"` } : {}),
    }),
    { expiresIn: 3600 },
  );
}
