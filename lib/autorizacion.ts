import { cookies } from "next/headers";
import { COOKIE_SESION, accesoActivo, leerSesion, type Sesion } from "./sesion";
import { obtener, type Rol, type Usuario } from "./usuarios";

export type Autorizado = { sesion: Sesion; registro?: Usuario };

type Resultado = { ok: true; datos: Autorizado } | { ok: false; respuesta: Response };

const LOCAL: Sesion = { usuario: "local", rol: "admin", principal: true };

// Verifica la sesión en una ruta de la API. Para usuarios registrados consulta su estado
// actual (activo, rol y límites), así un cambio del administrador aplica de inmediato.
export async function exigirSesion(roles?: Rol[]): Promise<Resultado> {
  if (!accesoActivo()) return { ok: true, datos: { sesion: LOCAL } };

  const sesion = await leerSesion((await cookies()).get(COOKIE_SESION)?.value);
  if (!sesion) {
    return { ok: false, respuesta: Response.json({ error: "Su sesión venció. Recargue la página e inicie sesión de nuevo." }, { status: 401 }) };
  }

  let registro: Usuario | undefined;
  if (!sesion.principal) {
    registro = await obtener(sesion.usuario);
    if (!registro?.activo) {
      return { ok: false, respuesta: Response.json({ error: "Su usuario fue desactivado. Consulte con el administrador." }, { status: 401 }) };
    }
    sesion.rol = registro.rol;
  }

  if (roles && !roles.includes(sesion.rol)) {
    return { ok: false, respuesta: Response.json({ error: "No tiene permiso para esta acción." }, { status: 403 }) };
  }
  return { ok: true, datos: { sesion, registro } };
}
