import { exigirSesion } from "@/lib/autorizacion";
import { respuestaErrorAws } from "@/lib/aws";
import { obtenerReunion, urlGrabacion } from "@/lib/reuniones";
import { validarUsuario } from "@/lib/usuarios";

// Una reunión guardada, tal como quedó: transcripción, minuta, visuales y enlace a la grabación.
export async function GET(req: Request, ctx: RouteContext<"/api/reuniones/[id]">) {
  const a = await exigirSesion();
  if (!a.ok) return a.respuesta;
  const { id } = await ctx.params;
  const pedido = new URL(req.url).searchParams.get("usuario");
  const usuario = pedido && a.datos.sesion.rol === "admin" ? pedido : a.datos.sesion.usuario;
  if (validarUsuario(usuario)) return Response.json({ error: "Usuario inválido." }, { status: 400 });
  try {
    const reunion = await obtenerReunion(usuario, id);
    if (!reunion) return Response.json({ error: "No se encontró la reunión." }, { status: 404 });
    const grabacion = reunion.grabacion
      ? { ...reunion.grabacion, url: await urlGrabacion(reunion.grabacion), descarga: await urlGrabacion(reunion.grabacion, true) }
      : null;
    return Response.json({ reunion: { ...reunion, grabacion } });
  } catch (e) {
    return respuestaErrorAws(e);
  }
}
