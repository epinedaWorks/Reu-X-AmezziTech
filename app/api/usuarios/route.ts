import { exigirSesion } from "@/lib/autorizacion";
import { respuestaErrorAws } from "@/lib/aws";
import {
  ErrorUsuarios, ROLES, hashClave, hoy, listar, modificar, publico, validarClave, validarUsuario, type Rol,
} from "@/lib/usuarios";

export async function GET() {
  const a = await exigirSesion(["admin"]);
  if (!a.ok) return a.respuesta;
  try {
    return Response.json({ usuarios: (await listar()).map(publico), principal: process.env.REUX_USUARIO ?? null });
  } catch (e) {
    return respuestaErrorAws(e);
  }
}

export async function POST(req: Request) {
  const a = await exigirSesion(["admin"]);
  if (!a.ok) return a.respuesta;

  const c = (await req.json().catch(() => ({}))) as {
    usuario?: string; nombre?: string; clave?: string; rol?: Rol; limiteDiario?: number; maxMB?: number;
  };
  const usuario = (c.usuario ?? "").trim().toLowerCase();
  const error =
    validarUsuario(usuario) ??
    validarClave(c.clave ?? "") ??
    (ROLES.includes(c.rol as Rol) ? null : "Rol inválido.") ??
    (usuario === process.env.REUX_USUARIO ? "Ese usuario está reservado para el administrador principal." : null);
  if (error) return Response.json({ error }, { status: 400 });

  try {
    const creado = await modificar((usuarios) => {
      if (usuarios.some((u) => u.usuario === usuario)) throw new ErrorUsuarios(`El usuario "${usuario}" ya existe.`);
      const nuevo = {
        usuario,
        nombre: (c.nombre ?? "").trim() || usuario,
        rol: c.rol as Rol,
        activo: true,
        hash: hashClave(c.clave!),
        limiteDiario: Math.max(0, Math.floor(Number(c.limiteDiario) || 0)),
        maxMB: Math.max(0, Math.floor(Number(c.maxMB) || 0)),
        creado: new Date().toISOString(),
        uso: { fecha: hoy(), minutas: 0 },
      };
      usuarios.push(nuevo);
      return publico(nuevo);
    });
    return Response.json({ usuario: creado });
  } catch (e) {
    if (e instanceof ErrorUsuarios) return Response.json({ error: e.message }, { status: 409 });
    return respuestaErrorAws(e);
  }
}
