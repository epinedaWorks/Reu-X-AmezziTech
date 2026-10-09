import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { GetObjectCommand, PutObjectCommand, S3ServiceException } from "@aws-sdk/client-s3";
import { bucket, s3 } from "./aws";

// Usuarios guardados como un JSON en el bucket (config/usuarios.json), con escrituras
// condicionales (If-Match) para que dos cambios simultáneos no se pisen.
// El administrador principal vive en Parameter Store (REUX_USUARIO/REUX_CLAVE) y no está aquí.

export const ROLES = ["admin", "usuario", "participante"] as const;
export type Rol = (typeof ROLES)[number];

export const NOMBRE_ROL: Record<Rol, string> = {
  admin: "Administrador",
  usuario: "Usuario",
  participante: "Participante",
};

export type Usuario = {
  usuario: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  hash: string;
  limiteDiario: number; // minutas por día; 0 = sin límite
  maxMB: number; // tamaño máximo de archivo; 0 = el máximo del sistema
  creado: string;
  uso: { fecha: string; minutas: number };
};

export type UsuarioPublico = Omit<Usuario, "hash">;

const CLAVE_S3 = "config/usuarios.json";
type Archivo = { usuarios: Usuario[] };

export function publico(u: Usuario): UsuarioPublico {
  const { hash, ...resto } = u;
  void hash;
  return resto;
}

export function hashClave(clave: string): string {
  const sal = randomBytes(16);
  const h = scryptSync(clave, sal, 64);
  return `scrypt$${sal.toString("base64")}$${h.toString("base64")}`;
}

export function verificarClave(clave: string, hash: string): boolean {
  const [tipo, sal, h] = hash.split("$");
  if (tipo !== "scrypt" || !sal || !h) return false;
  const esperado = Buffer.from(h, "base64");
  const calculado = scryptSync(clave, Buffer.from(sal, "base64"), esperado.length);
  return timingSafeEqual(esperado, calculado);
}

export const hoy = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Guatemala" });

async function leer(): Promise<{ datos: Archivo; etag?: string }> {
  try {
    const r = await s3.send(new GetObjectCommand({ Bucket: bucket(), Key: CLAVE_S3 }));
    return { datos: JSON.parse(await r.Body!.transformToString()) as Archivo, etag: r.ETag };
  } catch (e) {
    if (e instanceof S3ServiceException && (e.name === "NoSuchKey" || e.$metadata.httpStatusCode === 404)) {
      return { datos: { usuarios: [] } };
    }
    throw e;
  }
}

// Lectura con caché breve: el proxy de sesiones no consulta S3, las rutas sí.
let cache: { datos: Archivo; hasta: number } | null = null;

export async function listar(): Promise<Usuario[]> {
  if (cache && cache.hasta > Date.now()) return cache.datos.usuarios;
  const { datos } = await leer();
  cache = { datos, hasta: Date.now() + 15_000 };
  return datos.usuarios;
}

export async function obtener(usuario: string): Promise<Usuario | undefined> {
  return (await listar()).find((u) => u.usuario === usuario);
}

export class ErrorUsuarios extends Error {}

// Lee, modifica y escribe con If-Match; reintenta si otro proceso escribió en medio.
export async function modificar<T>(cambio: (usuarios: Usuario[]) => T): Promise<T> {
  for (let intento = 0; intento < 5; intento++) {
    const { datos, etag } = await leer();
    const resultado = cambio(datos.usuarios);
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket(),
          Key: CLAVE_S3,
          Body: JSON.stringify(datos, null, 2),
          ContentType: "application/json",
          ServerSideEncryption: "AES256",
          ...(etag ? { IfMatch: etag } : { IfNoneMatch: "*" }),
        }),
      );
      cache = { datos, hasta: Date.now() + 15_000 };
      return resultado;
    } catch (e) {
      const status = e instanceof S3ServiceException ? e.$metadata.httpStatusCode : 0;
      if (status === 412 || status === 409) continue; // otro proceso escribió primero
      throw e;
    }
  }
  throw new ErrorUsuarios("No se pudo guardar el cambio por escrituras simultáneas. Intente de nuevo.");
}

// Registra una minuta en la cuota diaria. Devuelve un mensaje si se excedió el límite.
export async function consumirCuota(usuario: string): Promise<string | null> {
  return modificar((usuarios) => {
    const u = usuarios.find((x) => x.usuario === usuario);
    if (!u) return null; // administrador principal u otro caso sin registro
    const fecha = hoy();
    if (u.uso.fecha !== fecha) u.uso = { fecha, minutas: 0 };
    if (u.limiteDiario > 0 && u.uso.minutas >= u.limiteDiario) {
      return `Se alcanzó el límite de ${u.limiteDiario} minutas por día de este usuario. Intente mañana o pida a un administrador que lo amplíe.`;
    }
    u.uso.minutas++;
    return null;
  });
}

export function validarUsuario(nombreUsuario: string): string | null {
  if (!/^[a-z0-9._-]{3,32}$/.test(nombreUsuario)) {
    return "El usuario debe tener de 3 a 32 caracteres: letras minúsculas, números, punto, guion o guion bajo.";
  }
  return null;
}

export function validarClave(clave: string): string | null {
  return clave.length >= 8 ? null : "La contraseña debe tener al menos 8 caracteres.";
}

// Comprueba (sin descontar) si al usuario le quedan minutas hoy.
export function cuotaAgotada(u: Usuario | undefined): string | null {
  if (!u || u.limiteDiario <= 0) return null;
  const usadas = u.uso.fecha === hoy() ? u.uso.minutas : 0;
  return usadas >= u.limiteDiario
    ? `Se alcanzó el límite de ${u.limiteDiario} minutas por día de este usuario. Intente mañana o pida a un administrador que lo amplíe.`
    : null;
}
