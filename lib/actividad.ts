import { GetObjectCommand, PutObjectCommand, S3ServiceException } from "@aws-sdk/client-s3";
import { bucket, s3 } from "./aws";

// Bitácora de actividad por usuario: un JSON por usuario en registros/<usuario>.json con
// sus accesos y cada reunión que procesó (carga, transcripción, redacción y visuales).
// Las rutas de la API registran cada etapa; el navegador solo reporta errores propios
// (por ejemplo, una subida a S3 que falló). Escrituras condicionales como en usuarios.ts.

export type Etapa = { tipo: Evento["tipo"]; etapa: string; en: string; detalle?: string };

export type Proceso = {
  id: string;
  fuente: "archivo" | "texto";
  estado: "en_curso" | "completado" | "fallido";
  inicio: string;
  fin?: string;
  archivo?: { nombre: string; mb: number };
  idioma?: string;
  caracteres?: number;
  titulo?: string;
  error?: string;
  minutas: number; // 1 + regeneraciones
  guardada?: boolean; // la reunión se puede volver a abrir (lib/reuniones.ts)
  visuales: string[];
  etapas: Etapa[];
};

export type Bitacora = {
  usuario: string;
  totales: { procesos: number; completados: number; fallidos: number; minutas: number; visuales: number; mb: number };
  accesos: { total: number; ultimo?: string; recientes: string[] };
  ultimaActividad?: string;
  procesos: Proceso[]; // más recientes primero
};

const MAX_PROCESOS = 300;
const MAX_ACCESOS = 30;
const MAX_ETAPAS = 40;

const clave = (usuario: string) => `registros/${usuario}.json`;
export const idValido = (id: unknown): id is string => typeof id === "string" && /^[\w-]{8,64}$/.test(id);

function vacia(usuario: string): Bitacora {
  return {
    usuario,
    totales: { procesos: 0, completados: 0, fallidos: 0, minutas: 0, visuales: 0, mb: 0 },
    accesos: { total: 0, recientes: [] },
    procesos: [],
  };
}

async function leer(usuario: string): Promise<{ datos: Bitacora; etag?: string }> {
  try {
    const r = await s3.send(new GetObjectCommand({ Bucket: bucket(), Key: clave(usuario) }));
    return { datos: JSON.parse(await r.Body!.transformToString()) as Bitacora, etag: r.ETag };
  } catch (e) {
    // Sin s3:ListBucket, S3 responde 403 (no 404) cuando el objeto aún no existe.
    const status = e instanceof S3ServiceException ? e.$metadata.httpStatusCode : 0;
    if (e instanceof S3ServiceException && (e.name === "NoSuchKey" || status === 404 || status === 403)) {
      return { datos: vacia(usuario) };
    }
    throw e;
  }
}

export async function bitacora(usuario: string): Promise<Bitacora> {
  return (await leer(usuario)).datos;
}

async function modificar(usuario: string, cambio: (b: Bitacora) => void) {
  for (let intento = 0; intento < 5; intento++) {
    const { datos, etag } = await leer(usuario);
    cambio(datos);
    datos.procesos = datos.procesos.slice(0, MAX_PROCESOS);
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket(),
          Key: clave(usuario),
          Body: JSON.stringify(datos),
          ContentType: "application/json",
          ServerSideEncryption: "AES256",
          ...(etag ? { IfMatch: etag } : { IfNoneMatch: "*" }),
        }),
      );
      return;
    } catch (e) {
      const status = e instanceof S3ServiceException ? e.$metadata.httpStatusCode : 0;
      if (status === 412 || status === 409) continue;
      throw e;
    }
  }
}

// La bitácora nunca debe interrumpir el trabajo del usuario: los errores solo se anotan en el log.
async function seguro(usuario: string, cambio: (b: Bitacora) => void) {
  try {
    await modificar(usuario, (b) => {
      cambio(b);
      b.ultimaActividad = new Date().toISOString();
    });
  } catch (e) {
    console.error(`[actividad] no se pudo registrar para ${usuario}:`, e);
  }
}

export function registrarAcceso(usuario: string) {
  const ahora = new Date().toISOString();
  return seguro(usuario, (b) => {
    b.accesos.total++;
    b.accesos.ultimo = ahora;
    b.accesos.recientes = [ahora, ...b.accesos.recientes].slice(0, MAX_ACCESOS);
  });
}

export type Evento =
  | { tipo: "subida"; archivo: { nombre: string; mb: number } }
  | { tipo: "transcripcion_iniciada" }
  | { tipo: "transcripcion_lista"; idioma?: string; caracteres: number }
  | { tipo: "redaccion_iniciada"; caracteres: number }
  | { tipo: "minuta"; titulo: string; guardada?: boolean }
  | { tipo: "visual"; visual: string }
  | { tipo: "fallo"; error: string; etapa?: string };

const NOMBRE_ETAPA: Record<Evento["tipo"], string> = {
  subida: "Subida autorizada",
  transcripcion_iniciada: "Archivo subido · transcripción iniciada",
  transcripcion_lista: "Transcripción lista",
  redaccion_iniciada: "Redacción iniciada",
  minuta: "Minuta generada",
  visual: "Visual generado",
  fallo: "Error",
};

// Registra un evento de una reunión. Si el proceso no existe aún, lo crea.
export function registrar(usuario: string, id: unknown, ev: Evento) {
  if (!idValido(id)) return Promise.resolve();
  const ahora = new Date().toISOString();
  return seguro(usuario, (b) => {
    let p = b.procesos.find((x) => x.id === id);
    if (!p) {
      p = {
        id,
        fuente: ev.tipo === "subida" ? "archivo" : "texto",
        estado: "en_curso",
        inicio: ahora,
        minutas: 0,
        visuales: [],
        etapas: [],
      };
      b.procesos.unshift(p);
      b.totales.procesos++;
    }

    let detalle: string | undefined;
    switch (ev.tipo) {
      case "subida":
        p.archivo = ev.archivo;
        b.totales.mb = Math.round((b.totales.mb + ev.archivo.mb) * 10) / 10;
        detalle = `${ev.archivo.nombre} (${ev.archivo.mb} MB)`;
        break;
      case "transcripcion_lista":
        p.idioma = ev.idioma;
        p.caracteres = ev.caracteres;
        detalle = [ev.idioma, `${ev.caracteres.toLocaleString("es")} caracteres`].filter(Boolean).join(" · ");
        break;
      case "redaccion_iniciada":
        p.caracteres ??= ev.caracteres;
        if (p.minutas > 0) detalle = "regeneración";
        break;
      case "minuta":
        if (p.estado === "fallido") b.totales.fallidos--;
        if (p.estado !== "completado") b.totales.completados++;
        p.estado = "completado";
        p.fin = ahora;
        p.titulo = ev.titulo;
        if (ev.guardada) p.guardada = true;
        p.error = undefined;
        p.minutas++;
        b.totales.minutas++;
        detalle = ev.titulo;
        break;
      case "visual":
        p.visuales.push(ev.visual);
        b.totales.visuales++;
        detalle = ev.visual;
        break;
      case "fallo":
        // Un error después de tener minuta (por ejemplo, al generar un visual) no anula el proceso.
        if (p.estado === "en_curso") {
          p.estado = "fallido";
          p.fin = ahora;
          b.totales.fallidos++;
        }
        p.error = ev.error.slice(0, 300);
        detalle = [ev.etapa, p.error].filter(Boolean).join(": ");
        break;
    }
    if (p.etapas.length < MAX_ETAPAS) p.etapas.push({ tipo: ev.tipo, etapa: NOMBRE_ETAPA[ev.tipo], en: ahora, ...(detalle ? { detalle } : {}) });
  });
}
