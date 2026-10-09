import { exigirSesion } from "@/lib/autorizacion";
import { NOMBRE_ROL, hoy } from "@/lib/usuarios";

// Datos del usuario de la sesión: perfil y uso del día.
export async function GET() {
  const a = await exigirSesion();
  if (!a.ok) return a.respuesta;
  const { sesion, registro } = a.datos;
  return Response.json({
    usuario: sesion.usuario,
    nombre: registro?.nombre ?? sesion.usuario,
    rol: sesion.rol,
    nombreRol: NOMBRE_ROL[sesion.rol],
    limiteDiario: registro?.limiteDiario ?? 0,
    usadasHoy: registro && registro.uso.fecha === hoy() ? registro.uso.minutas : 0,
    maxMB: registro?.maxMB ?? 0,
  });
}
