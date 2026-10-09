"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download, ImagePlus, LayoutTemplate, ListChecks, LoaderCircle, Network, RefreshCw, Workflow, X, type LucideIcon,
} from "lucide-react";
import { Diagrama } from "./Diagrama";
import { Infografia, TEMAS } from "./Infografia";
import { MapaMental } from "./MapaMental";
import type { Flujo, Infografia as DatosInfografia, Mapa, Minuta } from "@/lib/esquemas";
import { descargar, nombreArchivo, svgAPng } from "@/lib/exportar";
import { diagramaFlujo, diagramaTareas } from "@/lib/mermaid";

export type Imagen = { png: Uint8Array; ancho: number; alto: number };
type Tipo = "mapa" | "infografia" | "flujo" | "tareas";

const TIPOS: { id: Tipo; nombre: string; descripcion: string; icono: LucideIcon }[] = [
  { id: "mapa", nombre: "Mapa mental", descripcion: "Ideas clave organizadas en ramas", icono: Network },
  { id: "infografia", nombre: "Infografía", descripcion: "Resumen visual para compartir", icono: LayoutTemplate },
  { id: "flujo", nombre: "Flujo", descripcion: "Proceso y decisiones de la reunión", icono: Workflow },
  { id: "tareas", nombre: "Responsables", descripcion: "Quién hace qué y para cuándo", icono: ListChecks },
];

type Generados = { mapa?: Mapa; infografia?: DatosInfografia; flujo?: Flujo };

function leerImagen(f: File | undefined, set: (url: string) => void) {
  if (!f || !f.type.startsWith("image/")) return;
  const r = new FileReader();
  r.onload = () => set(String(r.result));
  r.readAsDataURL(f);
}

// Escala la infografía (900 px de ancho) para que quepa completa en el área
// visible, sin barras de desplazamiento y sin afectar la exportación.
function Ajustado({ children, completa }: { children: React.ReactNode; completa: boolean }) {
  const caja = useRef<HTMLDivElement>(null);
  const interno = useRef<HTMLDivElement>(null);
  const [medida, setMedida] = useState({ escala: 1, alto: 0 });
  useEffect(() => {
    const el = caja.current;
    const hijo = interno.current;
    if (!el || !hijo) return;
    const medir = () => {
      const alto = hijo.offsetHeight;
      const porAncho = (el.clientWidth - 32) / 900;
      const escala = Math.min(1, porAncho, completa ? (el.clientHeight - 32) / Math.max(alto, 1) : Infinity);
      setMedida({ escala: Math.max(escala, 0.1), alto });
    };
    // Primera medición inmediata (diferida fuera del efecto); luego, en cada cambio de tamaño.
    queueMicrotask(medir);
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    obs.observe(hijo);
    return () => obs.disconnect();
  }, [completa]);
  return (
    <div
      ref={caja}
      className={`panel-scroll absolute inset-0 grid justify-items-center p-4 ${completa ? "place-items-center overflow-hidden" : "items-start overflow-y-auto"}`}
    >
      <div
        className="overflow-hidden shadow-[0_2px_12px_rgba(16,24,40,0.12)]"
        style={{ width: 900 * medida.escala, height: medida.alto * medida.escala }}
      >
        <div ref={interno} style={{ transform: `scale(${medida.escala})`, transformOrigin: "top left", width: 900 }}>
          {children}
        </div>
      </div>
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
  const [completa, setCompleta] = useState(true);
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

  const accion =
    "inline-flex items-center gap-1.5 border border-marca/35 bg-marca-suave/60 px-2.5 py-1.5 font-semibold text-marca shadow-[0_1px_1px_rgba(16,24,40,0.06)] transition hover:border-marca hover:bg-marca hover:text-white disabled:cursor-not-allowed disabled:opacity-40";
  const mensajeCarga =
    tipo === "infografia" ? "Diseñando la infografía…" : tipo === "mapa" ? "Organizando las ideas del mapa mental…" : "Diseñando el diagrama de flujo…";

  return (
    <div className="flex h-full flex-col">
      {/* Selector de visual y acciones */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-borde bg-fondo px-5 py-2.5">
        <div className="flex flex-wrap border border-borde bg-white text-[13px] font-medium">
          {TIPOS.map((t, i) => (
            <button
              key={t.id}
              onClick={() => elegir(t.id)}
              title={t.descripcion}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 transition ${i > 0 ? "border-l border-borde" : ""} ${
                tipo === t.id ? "bg-marca text-white" : "text-tenue hover:bg-fondo hover:text-tinta"
              }`}
            >
              <t.icono size={14} /> {t.nombre}
            </button>
          ))}
        </div>
        {listo && cargando !== tipo && (
          <div className="flex flex-wrap gap-1.5 text-[12.5px]">
            <button onClick={descargarPng} className={accion}>
              <Download size={14} /> PNG
            </button>
            {tipo !== "infografia" && (
              <button onClick={descargarSvg} className={accion}>
                <Download size={14} /> SVG
              </button>
            )}
            {tipo !== "tareas" && (
              <button onClick={() => generar(tipo, true)} className={accion}>
                <RefreshCw size={14} /> Regenerar
              </button>
            )}
          </div>
        )}
      </div>

      {tipo === "infografia" && generados.infografia && cargando !== tipo && (
        <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2 border-b border-borde bg-white px-5 py-2 text-[12.5px]">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-tenue">Tema</span>
            {Object.entries(TEMAS).map(([id, t]) => (
              <button
                key={id}
                title={t.nombre}
                aria-label={`Tema ${t.nombre}`}
                onClick={() => setTema(id)}
                className={`h-5 w-5 ring-offset-2 transition ${tema === id ? "ring-2 ring-marca" : ""}`}
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
            <div key={nombre} className="flex items-center gap-1.5">
              <label className="inline-flex cursor-pointer items-center gap-1.5 font-medium text-marca hover:underline">
                <ImagePlus size={14} /> {valor ? `Cambiar ${nombre.toLowerCase()}` : `Agregar ${nombre.toLowerCase()}`}
                <input type="file" accept="image/*" hidden onChange={(e) => leerImagen(e.target.files?.[0], set)} />
              </label>
              {valor && (
                <button onClick={() => set(null)} aria-label={`Quitar ${nombre.toLowerCase()}`} className="text-tenue hover:text-peligro">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-tenue">Vista</span>
            <div className="flex border border-borde">
              {([[true, "Completa"], [false, "Ancho"]] as const).map(([v, nombre], i) => (
                <button
                  key={nombre}
                  onClick={() => setCompleta(v)}
                  className={`px-2 py-0.5 ${i > 0 ? "border-l border-borde" : ""} ${completa === v ? "bg-marca text-white" : "text-tenue hover:text-tinta"}`}
                >
                  {nombre}
                </button>
              ))}
            </div>
          </div>
          <span className="text-tenue">Haga clic en cualquier texto para editarlo.</span>
        </div>
      )}

      {/* Lienzo: cada visual se ajusta al espacio disponible */}
      <div className="relative min-h-[420px] flex-1 bg-[#eef0f3]">
        {cargando === tipo ? (
          <div className="absolute inset-0 grid place-items-center text-[13px] text-tenue">
            <span className="inline-flex items-center gap-2">
              <LoaderCircle size={16} className="animate-spin" /> {mensajeCarga}
            </span>
          </div>
        ) : tipo === "mapa" && generados.mapa ? (
          <div className="absolute inset-4 grid place-items-center border border-borde bg-white p-3">
            <MapaMental mapa={generados.mapa} onSvg={alSvg} />
          </div>
        ) : tipo === "infografia" && generados.infografia ? (
          <Ajustado completa={completa}>
            <Infografia ref={infografia} datos={generados.infografia} minuta={minuta} tema={TEMAS[tema]} foto={foto} logo={logo} />
          </Ajustado>
        ) : codigo ? (
          <div className="absolute inset-4 flex flex-col border border-borde bg-white">
            <div className="relative min-h-0 flex-1">
              <Diagrama codigo={codigo} onSvg={alSvg} />
            </div>
            <details className="shrink-0 border-t border-borde px-4 py-2 text-[12.5px]">
              <summary className="cursor-pointer text-tenue">Editar código del diagrama (Mermaid)</summary>
              <textarea
                value={codigo}
                onChange={(e) => setCodigoEditado(e.target.value)}
                rows={8}
                spellCheck={false}
                className="panel-scroll mt-2 w-full border border-borde bg-fondo p-2.5 font-mono text-xs"
              />
              {codigoEditado !== null && (
                <button onClick={() => setCodigoEditado(null)} className="text-marca hover:underline">
                  Restaurar original
                </button>
              )}
            </details>
          </div>
        ) : (
          <div className="absolute inset-0 grid place-items-center text-[13px]">
            <button onClick={() => generar(tipo, true)} className={accion}>
              Generar {TIPOS.find((t) => t.id === tipo)?.nombre.toLowerCase()}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
