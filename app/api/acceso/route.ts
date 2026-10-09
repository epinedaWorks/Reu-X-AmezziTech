import { NextResponse } from "next/server";
import { COOKIE_ACTIVA, COOKIE_SESION, DURACION_SESION_S, accesoActivo, crearSesion, iguales, type Sesion } from "@/lib/sesion";
import { obtener, verificarClave } from "@/lib/usuarios";

// Límite simple de intentos por IP (en memoria del servidor).
const INTENTOS_MAX = 8;
const VENTANA_MS = 15 * 60 * 1000;
const intentos = new Map<string, { n: number; desde: number }>();

function bloqueado(ip: string): boolean {
  const r = intentos.get(ip);
  if (!r || Date.now() - r.desde > VENTANA_MS) return false;
  return r.n >= INTENTOS_MAX;
}

function registrarFallo(ip: string) {
  const r = intentos.get(ip);
  if (!r || Date.now() - r.desde > VENTANA_MS) intentos.set(ip, { n: 1, desde: Date.now() });
  else r.n++;
}

// Administrador principal (Parameter Store) o usuario registrado en config/usuarios.json.
async function autenticar(usuario: string, clave: string): Promise<Sesion | null> {
  if (iguales(usuario, process.env.REUX_USUARIO ?? "") && iguales(clave, process.env.REUX_CLAVE ?? "")) {
    return { usuario, rol: "admin", principal: true };
  }
  const u = await obtener(usuario);
  if (u?.activo && verificarClave(clave, u.hash)) return { usuario, rol: u.rol, principal: false };
  return null;
}

export async function POST(req: Request) {
  if (!accesoActivo()) return NextResponse.json({ ok: true });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (bloqueado(ip)) {
    return NextResponse.json({ error: "Demasiados intentos. Espere 15 minutos e intente de nuevo." }, { status: 429 });
  }

  const cuerpo = (await req.json().catch(() => ({}))) as { usuario?: string; clave?: string };
  const usuario = (cuerpo.usuario ?? "").trim().toLowerCase();
  const sesion = await autenticar(usuario, cuerpo.clave ?? "");
  if (!sesion) {
    registrarFallo(ip);
    return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
  }

  intentos.delete(ip);
  const seguro = new URL(req.url).protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_SESION, await crearSesion(sesion), {
    httpOnly: true,
    secure: seguro,
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SESION_S,
  });
  // Visible para el navegador solo para adaptar la interfaz (el servidor no confía en ella).
  res.cookies.set(COOKIE_ACTIVA, sesion.rol, { secure: seguro, sameSite: "lax", path: "/", maxAge: DURACION_SESION_S });
  return res;
}

// Cerrar sesión.
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_SESION);
  res.cookies.delete(COOKIE_ACTIVA);
  return res;
}
