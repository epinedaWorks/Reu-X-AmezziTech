// Sesión simple firmada con HMAC-SHA256 (Web Crypto, sirve en el proxy y en las rutas).
// El acceso se activa solo si están definidas REUX_USUARIO, REUX_CLAVE y REUX_SECRETO;
// sin ellas (desarrollo local) la app queda abierta.

export const COOKIE_SESION = "reux_sesion";
// Cookie visible para el navegador, solo para mostrar el botón "Salir".
export const COOKIE_ACTIVA = "reux_activa";
export const DURACION_SESION_S = 12 * 60 * 60;

export function accesoActivo(): boolean {
  return Boolean(process.env.REUX_USUARIO && process.env.REUX_CLAVE && process.env.REUX_SECRETO);
}

const codificador = new TextEncoder();

function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function firmar(datos: string): Promise<string> {
  const clave = await crypto.subtle.importKey(
    "raw",
    codificador.encode(process.env.REUX_SECRETO ?? ""),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64url(await crypto.subtle.sign("HMAC", clave, codificador.encode(datos)));
}

// Comparación en tiempo constante para no filtrar información por tiempos de respuesta.
export function iguales(a: string, b: string): boolean {
  const x = codificador.encode(a);
  const y = codificador.encode(b);
  let dif = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) dif |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return dif === 0;
}

export type Sesion = { usuario: string; rol: "admin" | "usuario" | "participante"; principal: boolean };

export async function crearSesion(s: Sesion): Promise<string> {
  const datos = `${base64url(codificador.encode(JSON.stringify(s)))}.${Math.floor(Date.now() / 1000) + DURACION_SESION_S}`;
  return `${datos}.${await firmar(datos)}`;
}

// Devuelve la sesión si la firma es válida y no venció.
export async function leerSesion(token: string | undefined): Promise<Sesion | null> {
  if (!token) return null;
  const partes = token.split(".");
  if (partes.length !== 3) return null;
  const datos = `${partes[0]}.${partes[1]}`;
  if (!iguales(partes[2], await firmar(datos))) return null;
  if (Number(partes[1]) <= Date.now() / 1000) return null;
  try {
    const b = atob(partes[0].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(b, (c) => c.charCodeAt(0)))) as Sesion;
  } catch {
    return null;
  }
}
