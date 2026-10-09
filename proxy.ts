import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, accesoActivo, leerSesion } from "@/lib/sesion";

// Protege toda la app con usuario y contraseña (cuando el acceso está configurado).
// La administración de usuarios es solo para administradores.
export async function proxy(req: NextRequest) {
  if (!accesoActivo()) return NextResponse.next();
  const ruta = req.nextUrl.pathname;
  const sesion = await leerSesion(req.cookies.get(COOKIE_SESION)?.value);

  if (!sesion) {
    if (ruta.startsWith("/api/")) {
      return NextResponse.json({ error: "Su sesión venció. Recargue la página e inicie sesión de nuevo." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/acceso", req.url));
  }

  const soloAdmin = ruta.startsWith("/admin") || ruta.startsWith("/api/usuarios");
  if (soloAdmin && sesion.rol !== "admin") {
    if (ruta.startsWith("/api/")) return NextResponse.json({ error: "No tiene permiso para esta acción." }, { status: 403 });
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  // Todo excepto la pantalla de acceso, su API y los archivos estáticos.
  matcher: ["/((?!acceso|api/acceso|_next/static|_next/image|favicon.ico).*)"],
};
