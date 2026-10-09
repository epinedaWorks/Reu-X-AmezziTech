"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Diagrama } from "./Diagrama";
import { Infografia, TEMAS } from "./Infografia";
import { MapaMental } from "./MapaMental";
import type { Flujo, Infografia as DatosInfografia, Mapa, Minuta } from "@/lib/esquemas";
import { descargar, nombreArchivo, svgAPng } from "@/lib/exportar";
import { diagramaFlujo, diagramaTareas } from "@/lib/mermaid";

export type Imagen = { png: Uint8Array; ancho: number; alto: number };
type Tipo = "mapa" | "infografia" | "flujo" | "tareas";

const TIPOS: { id: Tipo; nombre: string; descripcion: string }[] = [
  { id: "mapa", nombre: "Mapa mental", descripcion: "Ideas clave en ramas de colores (IA)" },
  { id: "infografia", nombre: "Infografía", descripcion: "Resumen visual para compartir (IA)" },
  { id: "flujo", nombre: "Diagrama de flujo", descripcion: "Proceso y decisiones (IA)" },
  { id: "tareas", nombre: "Responsables y tareas", descripcion: "Quién hace qué y para cuándo" },
];

type Generados = { mapa?: Mapa; infografia?: DatosInfografia; flujo?: Flujo };

function leerImagen(f: File | undefined, set: (url: string) => void) {
  if (!f || !f.type.startsWith("image/")) return;
  const r = new FileReader();
  r.onload = () => set(String(r.result));
  r.readAsDataURL(f);
}

// Escala la infografía (900 px de ancho) al espacio disponible sin afectar la exportación.
function Escalado({ children }: { children: React.ReactNode }) {
  const caja = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(1);
  const [alto, setAlto] = useState<number>();
  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      const interno = el.firstElementChild as HTMLElement | null;
      const e = Math.min(1, el.clientWidth / 900);
      setEscala(e);
      if (interno) setAlto(interno.offsetHeight * e);
    });
    obs.observe(el);
    if (el.firstElementChild) obs.observe(el.firstElementChild);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={caja} className="mx-auto max-w-[900px] overflow-hidden" style={{ height: alto }}>
      <div style={{ transform: `scale(${escala})`, transformOrigin: "top left", width: 900 }}>{children}</div>
    </div>
  );
}

export function Visuales({
  minuta,
  activo,
  onImagen,
  onError,
}: {
  minuta: Minuta;
  activo: boolean;
  onImagen: (obtener: (() => Promise<Imagen>) | null) => void;
  onError: (e: string) => void;
}) {
  const [tipo, setTipo] = useState<Tipo>("mapa");
  const [generados, setGenerados] = useState<Generados>({});
  const [cargando, setCargando] = useState<Tipo | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [codigoEditado, setCodigoEditado] = useState<string | null>(null);
  const [tema, setTema] = useState("azul");
  const [foto, setFoto] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const infografia = useRef<HTMLDivElement>(null);

  const generar = useCallback(
    async (t: Tipo, forzar = false) => {
      if (t === "tareas") return;
      if (!forzar && generados[t]) return;
      setCargando(t);
      try {
        const r = await fetch("/api/diagrama", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ minuta, tipo: t }),
        });
        const d = await r.json();
        if (!r.ok || d.error) throw new Error(d.error ?? `Error ${r.status}`);
        setGenerados((g) => ({ ...g, [t]: d.datos }));
      } catch (e) {
        onError(e instanceof Error ? e.message : String(e));
      } finally {
        setCargando(null);
      }
    },
    [generados, minuta, onError],
  );

  // El mapa mental es la primera vista: se genera la primera vez que se abre
  // la pestaña (diferido para no actualizar estado durante el efecto).
  const iniciado = useRef(false);
  useEffect(() => {
    if (!activo || iniciado.current) return;
    iniciado.current = true;
    queueMicrotask(() => generar("mapa"));
  }, [activo, generar]);

  function elegir(t: Tipo) {
    setTipo(t);
    setSvg(null);
    setCodigoEditado(null);
    generar(t);
  }

  const codigoBase =
    tipo === "tareas" ? diagramaTareas(minuta) : tipo === "flujo" && generados.flujo ? diagramaFlujo(generados.flujo) : "";
  const codigo = codigoEditado ?? codigoBase;
  const alSvg = useCallback((s: string | null) => setSvg(s), []);

  const exportarInfografia = useCallback(async (escala: number): Promise<{ blob: Blob; ancho: number; alto: number }> => {
    const nodo = infografia.current;
    if (!nodo) throw new Error("La infografía no está lista.");
    const { toBlob } = await import("html-to-image");
    const blob = await toBlob(nodo, { pixelRatio: escala, backgroundColor: "#ffffff", cacheBust: true });
    if (!blob) throw new Error("No se pudo generar la imagen.");
    return { blob, ancho: nodo.offsetWidth, alto: nodo.offsetHeight };
  }, []);

  // Informa al padre cómo obtener la imagen actual (para incluirla en el Word).
  const listo = tipo === "infografia" ? Boolean(generados.infografia) : Boolean(svg);
  useEffect(() => {
    if (!listo) return onImagen(null);
    if (tipo === "infografia") {
      onImagen(async () => {
        const { blob, ancho, alto } = await exportarInfografia(1.5);
        return { png: new Uint8Array(await blob.arrayBuffer()), ancho, alto };
      });
    } else if (svg) {
      onImagen(() => svgAPng(svg));
    }
  }, [listo, tipo, svg, onImagen, exportarInfografia]);

  async function descargarPng() {
    try {
      const sufijo = `-${tipo}.png`;
      if (tipo === "infografia") {
        const { blob } = await exportarInfografia(2);
        descargar(blob, nombreArchivo(minuta, "png").replace(".png", sufijo));
      } else if (svg) {
        const { blob } = await svgAPng(svg);
        descargar(blob, nombreArchivo(minuta, "png").replace(".png", sufijo));
      }
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  }

  function descargarSvg() {
    if (!svg) return;
    descargar(new Blob([svg], { type: "image/svg+xml" }), nombreArchivo(minuta, "svg").replace(".svg", `-${tipo}.svg`));
  }

  const btn = "rounded-lg bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm ring-1 ring-slate-300 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TIPOS.map((t) => (
          <button
            key={t.id}
            onClick={() => elegir(t.id)}
            className={`rounded-xl border p-4 text-left transition ${tipo === t.id ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-300"}`}
          >
            <p className="font-semibold text-slate-900">{t.nombre}</p>
            <p className="mt-0.5 text-xs text-slate-500">{t.descripcion}</p>
          </button>
        ))}
      </div>

      {tipo === "infografia" && generados.infografia && (
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl bg-slate-50 px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-600">Tema:</span>
            {Object.entries(TEMAS).map(([id, t]) => (
              <button
                key={id}
                title={t.nombre}
                aria-label={`Tema ${t.nombre}`}
                onClick={() => setTema(id)}
                className={`h-7 w-7 rounded-full ring-offset-2 transition ${tema === id ? "ring-2 ring-slate-900" : ""}`}
                style={{ background: `linear-gradient(135deg, ${t.primario} 50%, ${t.destaque} 50%)` }}
              />
            ))}
          </div>
          {(
            [
              ["Foto", foto, setFoto],
              ["Logo", logo, setLogo],
            ] as const
          ).map(([nombre, valor, set]) => (
            <div key={nombre} className="flex items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 font-medium text-indigo-700 hover:underline">
                <ImagePlus size={16} /> {valor ? `Cambiar ${nombre.toLowerCase()}` : `Agregar ${nombre.toLowerCase()}`}
                <input type="file" accept="image/*" hidden onChange={(e) => leerImagen(e.target.files?.[0], set)} />
              </label>
              {valor && (
                <button onClick={() => set(null)} aria-label={`Quitar ${nombre.toLowerCase()}`} className="text-slate-500 hover:text-red-600">
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
          <span className="text-xs text-slate-500">Haz clic en cualquier texto de la infografía para editarlo.</span>
        </div>
      )}

      <div className="mt-5 min-h-[320px] overflow-hidden rounded-xl border border-slate-200 bg-white">
        {cargando === tipo ? (
          <div className="py-28 text-center text-sm text-slate-500">
            {tipo === "infografia" ? "Diseñando la infografía…" : tipo === "mapa" ? "Organizando las ideas del mapa mental…" : "Diseñando el diagrama de flujo…"}
          </div>
        ) : tipo === "mapa" && generados.mapa ? (
          <div className="overflow-x-auto p-4">
            <MapaMental mapa={generados.mapa} onSvg={alSvg} />
          </div>
        ) : tipo === "infografia" && generados.infografia ? (
          <div className="bg-slate-100 p-4">
            <Escalado>
              <Infografia ref={infografia} datos={generados.infografia} minuta={minuta} tema={TEMAS[tema]} foto={foto} logo={logo} />
            </Escalado>
          </div>
        ) : codigo ? (
          <Diagrama codigo={codigo} onSvg={alSvg} />
        ) : (
          <div className="py-28 text-center text-sm">
            <button onClick={() => generar(tipo, true)} className="font-medium text-indigo-700 hover:underline">
              Generar {TIPOS.find((t) => t.id === tipo)?.nombre.toLowerCase()}
            </button>
          </div>
        )}
      </div>

      {listo && cargando !== tipo && (
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <button onClick={descargarPng} className={btn}>Descargar PNG</button>
          {tipo !== "infografia" && (
            <button onClick={descargarSvg} className={btn}>Descargar SVG</button>
          )}
          {tipo !== "tareas" && (
            <button onClick={() => generar(tipo, true)} className={btn}>Regenerar con IA</button>
          )}
        </div>
      )}

      {(tipo === "flujo" || tipo === "tareas") && codigo && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-slate-600">Editar código del diagrama (Mermaid)</summary>
          <textarea
            value={codigo}
            onChange={(e) => setCodigoEditado(e.target.value)}
            rows={12}
            spellCheck={false}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-xs"
          />
          {codigoEditado !== null && (
            <button onClick={() => setCodigoEditado(null)} className="text-indigo-700 hover:underline">
              Restaurar original
            </button>
          )}
        </details>
      )}
    </div>
  );
}
