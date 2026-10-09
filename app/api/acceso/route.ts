import { NextResponse } from "next/server";
import { COOKIE_ACTIVA, COOKIE_SESION, DURACION_SESION_S, accesoActivo, crearSesion, iguales } from "@/lib/sesion";

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

export async function POST(req: Request) {
  if (!accesoActivo()) return NextResponse.json({ ok: true });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (bloqueado(ip)) {
    return NextResponse.json({ error: "Demasiados intentos. Espere 15 minutos e intente de nuevo." }, { status: 429 });
  }

  const { usuario = "", clave = "" } = (await req.json().catch(() => ({}))) as { usuario?: string; clave?: string };
  const ok = iguales(usuario.trim(), process.env.REUX_USUARIO ?? "") && iguales(clave, process.env.REUX_CLAVE ?? "");
  if (!ok) {
    registrarFallo(ip);
    return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
  }

  intentos.delete(ip);
  const seguro = new URL(req.url).protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_SESION, await crearSesion(usuario.trim()), {
    httpOnly: true,
    secure: seguro,
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SESION_S,
  });
  res.cookies.set(COOKIE_ACTIVA, "1", { secure: seguro, sameSite: "lax", path: "/", maxAge: DURACION_SESION_S });
  return res;
}

// Cerrar sesión.
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_SESION);
  res.cookies.delete(COOKIE_ACTIVA);
  return res;
}
