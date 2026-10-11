import { exigirSesion } from "@/lib/autorizacion";
import { registrar } from "@/lib/actividad";

// El navegador reporta errores que el servidor no ve (por ejemplo, una subida a S3 que falló).
export async function POST(req: Request) {
  const a = await exigirSesion();
  if (!a.ok) return a.respuesta;
  const { proceso, etapa, error } = (await req.json().catch(() => ({}))) as { proceso?: string; etapa?: string; error?: string };
  if (!error) return Response.json({ error: "Falta el error." }, { status: 400 });
  await registrar(a.datos.sesion.usuario, proceso, { tipo: "fallo", etapa: etapa?.slice(0, 40), error: String(error) });
  return Response.json({ ok: true });
}
