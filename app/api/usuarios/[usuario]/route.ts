import { exigirSesion } from "@/lib/autorizacion";
import { respuestaErrorAws } from "@/lib/aws";
import { ErrorUsuarios, ROLES, hashClave, modificar, publico, validarClave, type Rol } from "@/lib/usuarios";

// Actualiza nombre, rol, estado, límites o contraseña de un usuario.
export async function PATCH(req: Request, ctx: RouteContext<"/api/usuarios/[usuario]">) {
  const a = await exigirSesion(["admin"]);
  if (!a.ok) return a.respuesta;
  const { usuario } = await ctx.params;

  const c = (await req.json().catch(() => ({}))) as {
    nombre?: string; rol?: Rol; activo?: boolean; limiteDiario?: number; maxMB?: number; clave?: string; reiniciarUso?: boolean;
  };
  if (c.rol !== undefined && !ROLES.includes(c.rol)) return Response.json({ error: "Rol inválido." }, { status: 400 });
  if (c.clave !== undefined) {
    const e = validarClave(c.clave);
    if (e) return Response.json({ error: e }, { status: 400 });
  }
  // Evita que un administrador se quite a sí mismo el acceso por error.
  if (usuario === a.datos.sesion.usuario && (c.activo === false || (c.rol && c.rol !== "admin"))) {
    return Response.json({ error: "No puede desactivar ni quitarle el rol de administrador a su propio usuario." }, { status: 400 });
  }

  try {
    const actualizado = await modificar((usuarios) => {
      const u = usuarios.find((x) => x.usuario === usuario);
      if (!u) throw new ErrorUsuarios("El usuario no existe.");
      if (c.nombre !== undefined) u.nombre = c.nombre.trim() || u.usuario;
      if (c.rol !== undefined) u.rol = c.rol;
      if (c.activo !== undefined) u.activo = Boolean(c.activo);
      if (c.limiteDiario !== undefined) u.limiteDiario = Math.max(0, Math.floor(Number(c.limiteDiario) || 0));
      if (c.maxMB !== undefined) u.maxMB = Math.max(0, Math.floor(Number(c.maxMB) || 0));
      if (c.clave !== undefined) u.hash = hashClave(c.clave);
      if (c.reiniciarUso) u.uso.minutas = 0;
      return publico(u);
    });
    return Response.json({ usuario: actualizado });
  } catch (e) {
    if (e instanceof ErrorUsuarios) return Response.json({ error: e.message }, { status: 404 });
    return respuestaErrorAws(e);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/usuarios/[usuario]">) {
  const a = await exigirSesion(["admin"]);
  if (!a.ok) return a.respuesta;
  const { usuario } = await ctx.params;
  if (usuario === a.datos.sesion.usuario) {
    return Response.json({ error: "No puede eliminar su propio usuario." }, { status: 400 });
  }
  try {
    await modificar((usuarios) => {
      const i = usuarios.findIndex((x) => x.usuario === usuario);
      if (i < 0) throw new ErrorUsuarios("El usuario no existe.");
      usuarios.splice(i, 1);
    });
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof ErrorUsuarios) return Response.json({ error: e.message }, { status: 404 });
    return respuestaErrorAws(e);
  }
}
