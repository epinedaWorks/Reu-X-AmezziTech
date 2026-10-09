import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, accesoActivo, sesionValida } from "@/lib/sesion";

// Protege toda la app con usuario y contraseña (cuando el acceso está configurado).
export async function proxy(req: NextRequest) {
  if (!accesoActivo()) return NextResponse.next();
  if (await sesionValida(req.cookies.get(COOKIE_SESION)?.value)) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Su sesión venció. Recargue la página e inicie sesión de nuevo." }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/acceso", req.url));
}

export const config = {
  // Todo excepto la pantalla de acceso, su API y los archivos estáticos.
  matcher: ["/((?!acceso|api/acceso|_next/static|_next/image|favicon.ico).*)"],
};
