"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, CircleAlert, FileAudio, FileText, LoaderCircle, LogIn, RefreshCw, X } from "lucide-react";
import type { Bitacora, Etapa, Proceso } from "@/lib/actividad";

const ZONA = "America/Guatemala";

function fechaHora(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-GT", { timeZone: ZONA, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function hora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-GT", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function lapso(desde?: string, hasta?: string) {
  if (!desde || !hasta) return "—";
  const s = Math.max(0, Math.round((Date.parse(hasta) - Date.parse(desde)) / 1000));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m} min ${String(s % 60).padStart(2, "0")} s` : `${Math.floor(m / 60)} h ${m % 60} min`;
}

const en = (p: Proceso, tipo: Etapa["tipo"]) => p.etapas.find((e) => e.tipo === tipo)?.en;

// Duración de cada etapa de una reunión a partir de los eventos registrados.
function tiempos(p: Proceso) {
  return {
    subida: lapso(en(p, "subida"), en(p, "transcripcion_iniciada")),
    transcripcion: lapso(en(p, "transcripcion_iniciada"), en(p, "transcripcion_lista")),
    redaccion: lapso(en(p, "redaccion_iniciada"), en(p, "minuta")),
    total: lapso(p.inicio, p.fin),
  };
}

const ESTADO: Record<Proceso["estado"], { texto: string; clase: string }> = {
  completado: { texto: "Completado", clase: "border-exito/30 bg-exito/5 text-exito" },
  fallido: { texto: "Con error", clase: "border-peligro/30 bg-peligro/5 text-peligro" },
  en_curso: { texto: "Sin terminar", clase: "border-acento/40 bg-acento/5 text-acento" },
};

export function ActividadUsuario({ usuario, onCerrar }: { usuario: string; onCerrar: () => void }) {
  const [datos, setDatos] = useState<{ bitacora: Bitacora; usuario: { nombre: string; activo: boolean } | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const r = await fetch(`/api/usuarios/${encodeURIComponent(usuario)}/actividad`);
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? `Error ${r.status}`);
      setDatos(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [usuario]);

  useEffect(() => {
    queueMicrotask(cargar);
  }, [cargar]);

  const b = datos?.bitacora;
  const tarjetas = b
    ? [
        { valor: b.totales.procesos, titulo: "Reuniones procesadas" },
        { valor: b.totales.completados, titulo: "Completadas", clase: "text-exito" },
        { valor: b.totales.fallidos, titulo: "Con error", clase: b.totales.fallidos ? "text-peligro" : "" },
        { valor: b.totales.minutas, titulo: "Minutas generadas" },
        { valor: b.totales.visuales, titulo: "Visuales generados" },
        { valor: `${b.totales.mb.toLocaleString("es")} MB`, titulo: "Archivos subidos" },
        { valor: b.accesos.total, titulo: "Inicios de sesión" },
      ]
    : [];

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-fondo">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-borde bg-white px-4 py-3 sm:px-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-acento">Bitácora de actividad</p>
          <h2 className="font-serif text-[19px] font-semibold text-marca">
            {usuario}
            {datos?.usuario && datos.usuario.nombre !== usuario && <span className="ml-2 text-[14px] font-normal text-tenue">{datos.usuario.nombre}</span>}
            {datos?.usuario && !datos.usuario.activo && <span className="ml-2 align-middle text-[12px] font-semibold text-peligro">· deshabilitado</span>}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={cargar} className="inline-flex items-center gap-1.5 border border-marca/35 bg-marca-suave/60 px-3 py-1.5 text-[13px] font-semibold text-marca transition hover:bg-marca hover:text-white">
            <RefreshCw size={14} /> Actualizar
          </button>
          <button onClick={onCerrar} className="inline-flex items-center gap-1.5 border border-borde bg-white px-3 py-1.5 text-[13px] font-semibold text-tinta transition hover:border-marca hover:text-marca">
            <X size={14} /> Cerrar
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="m-4 flex items-start gap-2 border border-peligro/30 bg-peligro/5 px-3 py-2 text-[13px] text-peligro">
          <CircleAlert size={16} className="mt-0.5 shrink-0" /> {error}
        </p>
      )}

      {!b && !error && (
        <p className="p-10 text-center text-tenue">
          <LoaderCircle size={16} className="mr-2 inline animate-spin" /> Cargando actividad…
        </p>
      )}

      {b && (
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[auto_auto] overflow-y-auto lg:grid-cols-[minmax(0,1fr)_260px] lg:grid-rows-1 lg:overflow-hidden">
          <section className="flex flex-col p-4 sm:p-6 lg:min-h-0">
            <div className="mb-4 grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
              {tarjetas.map((t) => (
                <div key={t.titulo} className="border border-borde bg-white px-3 py-2">
                  <p className={`text-[20px] font-semibold tabular-nums leading-tight text-marca ${t.clase ?? ""}`}>{t.valor}</p>
                  <p className="text-[11px] uppercase tracking-wider text-tenue">{t.titulo}</p>
                </div>
              ))}
            </div>

            <div className="panel-scroll max-h-[70vh] flex-1 overflow-auto border border-borde bg-white lg:max-h-none lg:min-h-0">
              <table className="w-full min-w-[860px] border-collapse text-[13px]">
                <thead className="sticky top-0 z-[1]">
                  <tr className="bg-marca-suave text-left text-[11px] uppercase tracking-wider text-marca">
                    <th className="w-6 px-2 py-2" />
                    <th className="px-2 py-2 font-semibold">Inicio</th>
                    <th className="px-2 py-2 font-semibold">Fin</th>
                    <th className="px-2 py-2 font-semibold">Carga</th>
                    <th className="px-2 py-2 font-semibold">Subida</th>
                    <th className="px-2 py-2 font-semibold">Transcripción</th>
                    <th className="px-2 py-2 font-semibold">Redacción</th>
                    <th className="px-2 py-2 font-semibold">Total</th>
                    <th className="px-2 py-2 font-semibold">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {b.procesos.map((p) => {
                    const t = tiempos(p);
                    const e = ESTADO[p.estado];
                    const desplegado = abierto === p.id;
                    return (
                      <Fragment key={p.id}>
                        <tr onClick={() => setAbierto(desplegado ? null : p.id)} className={`cursor-pointer border-t border-linea align-top hover:bg-marca-suave/30 ${desplegado ? "bg-marca-suave/40" : ""}`}>
                          <td className="px-2 py-2 text-tenue">{desplegado ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</td>
                          <td className="whitespace-nowrap px-2 py-2 tabular-nums">{fechaHora(p.inicio)}</td>
                          <td className="whitespace-nowrap px-2 py-2 tabular-nums">{p.fin ? fechaHora(p.fin) : "—"}</td>
                          <td className="max-w-[220px] px-2 py-2">
                            <span className="flex items-start gap-1.5">
                              {p.fuente === "archivo" ? <FileAudio size={14} className="mt-0.5 shrink-0 text-acento" /> : <FileText size={14} className="mt-0.5 shrink-0 text-acento" />}
                              <span className="min-w-0">
                                <span className="block truncate" title={p.archivo?.nombre}>{p.archivo?.nombre ?? "Texto pegado"}</span>
                                <span className="block text-[11.5px] text-tenue">
                                  {[p.archivo && `${p.archivo.mb} MB`, p.caracteres && `${p.caracteres.toLocaleString("es")} caract.`, p.idioma].filter(Boolean).join(" · ")}
                                </span>
                              </span>
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 tabular-nums">{p.fuente === "archivo" ? t.subida : "—"}</td>
                          <td className="whitespace-nowrap px-2 py-2 tabular-nums">{p.fuente === "archivo" ? t.transcripcion : "—"}</td>
                          <td className="whitespace-nowrap px-2 py-2 tabular-nums">{t.redaccion}</td>
                          <td className="whitespace-nowrap px-2 py-2 font-semibold tabular-nums">{t.total}</td>
                          <td className="max-w-[260px] px-2 py-2">
                            <span className={`inline-block border px-1.5 py-px text-[11px] font-semibold ${e.clase}`}>{e.texto}</span>
                            <span className="mt-0.5 block truncate text-[12px] text-tenue" title={p.titulo ?? p.error}>
                              {p.titulo ?? p.error ?? ""}
                              {p.visuales.length > 0 && ` · ${p.visuales.length} visual${p.visuales.length > 1 ? "es" : ""}`}
                            </span>
                          </td>
                        </tr>
                        {desplegado && (
                          <tr className="bg-fondo/70">
                            <td />
                            <td colSpan={8} className="px-2 pb-3 pt-1">
                              <ol className="border-l-2 border-acento/40 pl-3">
                                {p.etapas.map((et, i) => (
                                  <li key={i} className="py-0.5 text-[12.5px]">
                                    <span className="mr-2 font-mono text-[11.5px] tabular-nums text-tenue">{hora(et.en)}</span>
                                    <span className={et.tipo === "fallo" ? "font-semibold text-peligro" : "font-medium text-tinta"}>{et.etapa}</span>
                                    {et.detalle && <span className="text-tenue"> — {et.detalle}</span>}
                                  </li>
                                ))}
                              </ol>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                  {b.procesos.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-3 py-10 text-center text-tenue">Este usuario aún no ha procesado reuniones.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-2 shrink-0 text-[11.5px] text-tenue">
              Horas de Guatemala. Haga clic en una fila para ver cada etapa. Se conservan las últimas 300 reuniones; los totales cuentan todas.
            </p>
          </section>

          <aside className="panel-scroll min-h-0 overflow-auto border-t border-borde bg-white p-5 lg:border-l lg:border-t-0">
            <h3 className="border-b border-linea pb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-marca">Accesos</h3>
            <dl className="mt-3 space-y-2 text-[13px]">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-tenue">Último inicio de sesión</dt>
                <dd className="font-medium">{fechaHora(b.accesos.ultimo)}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-tenue">Última actividad</dt>
                <dd className="font-medium">{fechaHora(b.ultimaActividad)}</dd>
              </div>
            </dl>
            <h4 className="mb-1.5 mt-5 text-[11px] font-semibold uppercase tracking-wider text-tenue">Inicios de sesión recientes</h4>
            <ul className="space-y-1 text-[12.5px] tabular-nums">
              {b.accesos.recientes.map((a) => (
                <li key={a} className="flex items-center gap-2">
                  <LogIn size={12} className="text-acento" /> {fechaHora(a)}
                </li>
              ))}
              {b.accesos.recientes.length === 0 && <li className="text-tenue">Sin registros.</li>}
            </ul>
          </aside>
        </div>
      )}
    </div>
  );
}
