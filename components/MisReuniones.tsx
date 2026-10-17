"use client";

import { useEffect, useState } from "react";
import { CircleAlert, FileAudio, FileText, FolderOpen, LoaderCircle, Search, X } from "lucide-react";

export type ResumenReunion = {
  id: string;
  titulo?: string;
  inicio: string;
  fin?: string;
  fuente: "archivo" | "texto";
  archivo?: { nombre: string; mb: number };
  visuales: string[];
};

const ZONA = "America/Guatemala";
const fecha = (iso: string) =>
  new Date(iso).toLocaleString("es-GT", { timeZone: ZONA, day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

// Lista de reuniones ya procesadas por el usuario; abrir una no vuelve a transcribir ni a redactar.
export function MisReuniones({ abriendo, onAbrir, onCerrar }: { abriendo: string | null; onAbrir: (id: string) => void; onCerrar: () => void }) {
  const [reuniones, setReuniones] = useState<ResumenReunion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    let vigente = true;
    fetch("/api/reuniones")
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error ?? `Error ${r.status}`);
        if (vigente) setReuniones(d.reuniones);
      })
      .catch((e) => vigente && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      vigente = false;
    };
  }, []);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onCerrar]);

  const texto = filtro.trim().toLowerCase();
  const visibles = (reuniones ?? []).filter(
    (r) => !texto || `${r.titulo ?? ""} ${r.archivo?.nombre ?? ""}`.toLowerCase().includes(texto),
  );

  return (
    <div className="no-print fixed inset-0 z-30 flex items-start justify-center bg-marca/30 p-3 pt-[76px] sm:p-6 sm:pt-[84px]" onClick={onCerrar}>
      <div
        role="dialog"
        aria-label="Mis reuniones"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-3xl flex-col border border-borde bg-white shadow-[0_12px_40px_rgba(16,24,40,0.18)]"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-linea px-5 py-3.5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-acento">Historial</p>
            <h2 className="font-serif text-[20px] font-semibold leading-tight text-marca">Mis reuniones</h2>
          </div>
          <button onClick={onCerrar} aria-label="Cerrar" className="text-tenue transition hover:text-marca">
            <X size={18} />
          </button>
        </div>

        <div className="shrink-0 border-b border-linea px-5 py-2.5">
          <label className="relative block">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tenue" />
            <input
              autoFocus
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar por título o archivo"
              className="w-full border border-borde bg-white py-1.5 pl-8 pr-2.5 text-[13.5px] outline-none transition focus:border-marca focus:ring-2 focus:ring-marca/10"
            />
          </label>
        </div>

        <div className="panel-scroll min-h-0 flex-1 overflow-y-auto">
          {error && (
            <p role="alert" className="m-4 flex items-start gap-2 border border-peligro/30 bg-peligro/5 px-3 py-2 text-[13px] text-peligro">
              <CircleAlert size={16} className="mt-0.5 shrink-0" /> {error}
            </p>
          )}
          {!reuniones && !error && (
            <p className="p-10 text-center text-[13.5px] text-tenue">
              <LoaderCircle size={16} className="mr-2 inline animate-spin" /> Cargando reuniones…
            </p>
          )}
          {reuniones && visibles.length === 0 && (
            <p className="p-10 text-center text-[13.5px] text-tenue">
              {reuniones.length === 0 ? "Aún no hay reuniones guardadas. Las que procese a partir de ahora aparecerán aquí." : "Ninguna reunión coincide con la búsqueda."}
            </p>
          )}
          <ul>
            {visibles.map((r) => (
              <li key={r.id} className="border-b border-linea last:border-b-0">
                <button
                  onClick={() => onAbrir(r.id)}
                  disabled={Boolean(abriendo)}
                  className="group flex w-full items-center gap-3.5 px-5 py-3 text-left transition hover:bg-marca-suave/40 disabled:opacity-60"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center border border-acento/30 bg-acento/5 text-acento">
                    {r.fuente === "archivo" ? <FileAudio size={16} /> : <FileText size={16} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-tinta">{r.titulo || "Reunión sin título"}</span>
                    <span className="block truncate text-[12px] text-tenue">
                      {[
                        fecha(r.inicio),
                        r.archivo ? `${r.archivo.nombre} · ${r.archivo.mb} MB` : "Texto",
                        r.visuales.length > 0 && `${new Set(r.visuales).size} visual${new Set(r.visuales).size > 1 ? "es" : ""}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-[12.5px] font-semibold text-marca opacity-70 group-hover:opacity-100">
                    {abriendo === r.id ? <LoaderCircle size={14} className="animate-spin" /> : <FolderOpen size={14} />} Abrir
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
