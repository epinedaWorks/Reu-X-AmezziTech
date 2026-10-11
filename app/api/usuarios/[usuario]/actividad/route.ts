import { exigirSesion } from "@/lib/autorizacion";
import { bitacora } from "@/lib/actividad";
import { respuestaErrorAws } from "@/lib/aws";
import { obtener, publico, validarUsuario } from "@/lib/usuarios";

// Bitácora de un usuario (accesos y reuniones procesadas). Solo administradores.
export async function GET(_req: Request, ctx: RouteContext<"/api/usuarios/[usuario]/actividad">) {
  const a = await exigirSesion(["admin"]);
  if (!a.ok) return a.respuesta;
  const { usuario } = await ctx.params;
  if (validarUsuario(usuario)) return Response.json({ error: "Usuario inválido." }, { status: 400 });
  try {
    const [b, registro] = await Promise.all([bitacora(usuario), obtener(usuario)]);
    const principal = usuario === process.env.REUX_USUARIO;
    return Response.json({ bitacora: b, usuario: registro ? publico(registro) : null, principal });
  } catch (e) {
    return respuestaErrorAws(e);
  }
}
