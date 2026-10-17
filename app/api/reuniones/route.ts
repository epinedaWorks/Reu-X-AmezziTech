import { exigirSesion } from "@/lib/autorizacion";
import { bitacora } from "@/lib/actividad";
import { respuestaErrorAws } from "@/lib/aws";
import { validarUsuario } from "@/lib/usuarios";

// Reuniones guardadas del usuario (o de otro, si quien consulta es administrador).
export async function GET(req: Request) {
  const a = await exigirSesion();
  if (!a.ok) return a.respuesta;
  const pedido = new URL(req.url).searchParams.get("usuario");
  const usuario = pedido && a.datos.sesion.rol === "admin" ? pedido : a.datos.sesion.usuario;
  if (validarUsuario(usuario)) return Response.json({ error: "Usuario inválido." }, { status: 400 });
  try {
    const reuniones = (await bitacora(usuario)).procesos
      .filter((p) => p.guardada)
      .map(({ id, titulo, inicio, fin, fuente, archivo, visuales }) => ({ id, titulo, inicio, fin, fuente, archivo, visuales }));
    return Response.json({ usuario, reuniones });
  } catch (e) {
    return respuestaErrorAws(e);
  }
}
