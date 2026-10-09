"use client";

import { forwardRef } from "react";
import { CalendarDays, Check, FileText, Lightbulb, MapPin, Quote, Target, Users } from "lucide-react";
import type { Infografia as Datos, Minuta } from "@/lib/esquemas";
import { IconoReuX } from "@/lib/iconos";

export type Tema = {
  nombre: string;
  primario: string;
  acento: string;
  suave: string;
  destaque: string;
  oscuro: string;
};

export const TEMAS: Record<string, Tema> = {
  azul: { nombre: "Azul", primario: "#1e3a8a", acento: "#2563eb", suave: "#eff6ff", destaque: "#facc15", oscuro: "#0f1f4d" },
  verde: { nombre: "Verde", primario: "#14532d", acento: "#16a34a", suave: "#f0fdf4", destaque: "#facc15", oscuro: "#0b2e1a" },
  morado: { nombre: "Morado", primario: "#4c1d95", acento: "#7c3aed", suave: "#f5f3ff", destaque: "#f472b6", oscuro: "#25104f" },
  naranja: { nombre: "Naranja", primario: "#7c2d12", acento: "#ea580c", suave: "#fff7ed", destaque: "#0ea5e9", oscuro: "#3b1307" },
  grafito: { nombre: "Grafito", primario: "#0f172a", acento: "#0891b2", suave: "#f1f5f9", destaque: "#22d3ee", oscuro: "#020617" },
};

const COLORES_BLOQUE = ["#2563eb", "#16a34a", "#9333ea", "#ea580c"];
const COLORES_ETIQUETA = [
  { fondo: "#fde047", texto: "#422006" },
  { fondo: "#4ade80", texto: "#052e16" },
  { fondo: "#60a5fa", texto: "#172554" },
  { fondo: "#c084fc", texto: "#3b0764" },
  { fondo: "#fb923c", texto: "#431407" },
];

// Texto que el usuario puede corregir directamente sobre la infografía.
function Editable({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <span contentEditable suppressContentEditableWarning spellCheck={false} className={`outline-none focus:bg-yellow-100/60 ${className ?? ""}`} style={style}>
      {children}
    </span>
  );
}

type Props = { datos: Datos; minuta: Minuta; tema: Tema; foto: string | null; logo: string | null };

export const Infografia = forwardRef<HTMLDivElement, Props>(function Infografia({ datos, minuta, tema, foto, logo }, ref) {
  const participantes = minuta.participantes.slice(0, 6);
  const extra = minuta.participantes.length - participantes.length;

  return (
    <div ref={ref} className="relative w-[900px] overflow-hidden bg-white font-sans text-slate-800" style={{ fontFamily: "var(--font-geist-sans), Arial, sans-serif" }}>
      {/* Encabezado */}
      <header className="relative overflow-hidden px-12 pb-10 pt-11" style={{ background: `linear-gradient(135deg, ${tema.suave} 0%, #ffffff 70%)` }}>
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-20" style={{ background: tema.acento }} />
        <div className="absolute -bottom-16 right-56 h-40 w-40 rounded-full opacity-25" style={{ background: tema.destaque }} />

        <div className="relative flex items-center gap-8">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest text-white" style={{ background: tema.primario }}>
                <FileText size={14} /> Minuta de reunión
              </span>
              {datos.evento && (
                <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: tema.destaque, color: tema.oscuro }}>
                  <Editable>{datos.evento}</Editable>
                </span>
              )}
              {logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" className="ml-auto max-h-12 max-w-[160px] object-contain" />
              )}
            </div>
            <h1 className="mt-5 text-[44px] font-extrabold leading-[1.08] tracking-tight" style={{ color: tema.primario }}>
              <Editable>{datos.titulo}</Editable>
            </h1>
            <p className="mt-3 text-[22px] font-semibold leading-snug" style={{ color: tema.acento }}>
              <Editable>{datos.subtitulo}</Editable>
            </p>
            {(minuta.fecha || minuta.lugar) && (
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-slate-600">
                {minuta.fecha && (
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays size={18} color={tema.acento} /> <Editable>{minuta.fecha}</Editable>
                  </span>
                )}
                {minuta.lugar && (
                  <span className="inline-flex items-center gap-2">
                    <MapPin size={18} color={tema.acento} /> <Editable>{minuta.lugar}</Editable>
                  </span>
                )}
              </div>
            )}
          </div>

          {foto && (
            <div className="relative h-[250px] w-[250px] shrink-0">
              <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[42%_58%_55%_45%/48%_42%_58%_52%]" style={{ background: tema.destaque }} />
              <div className="absolute inset-0 overflow-hidden rounded-[42%_58%_55%_45%/48%_42%_58%_52%] border-[6px] border-white shadow-xl" style={{ background: tema.acento }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={foto} alt="" className="h-full w-full object-cover" />
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="space-y-6 px-10 pb-8">
        {/* Frase clave */}
        <div className="flex gap-4 rounded-2xl px-6 py-5" style={{ background: tema.suave, borderLeft: `6px solid ${tema.destaque}` }}>
          <Quote size={30} color={tema.acento} className="shrink-0" />
          <p className="text-[19px] font-medium italic leading-relaxed" style={{ color: tema.oscuro }}>
            <Editable>{datos.frase_clave}</Editable>
          </p>
        </div>

        {/* Participantes y objetivo */}
        <div className="grid grid-cols-2 gap-6">
          <section className="rounded-2xl border border-slate-200 p-6">
            <h2 className="flex items-center gap-3 text-xl font-bold" style={{ color: tema.primario }}>
              <span className="grid h-11 w-11 place-items-center rounded-full text-white" style={{ background: tema.acento }}>
                <Users size={22} />
              </span>
              Participantes
            </h2>
            <ul className="mt-4 space-y-2 text-[15px]">
              {participantes.map((p, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full" style={{ background: tema.acento }} />
                  <span>
                    <strong className="font-semibold text-slate-900">{p.nombre}</strong>
                    {p.rol && <span className="text-slate-500"> — {p.rol}</span>}
                  </span>
                </li>
              ))}
              {extra > 0 && <li className="pl-4 text-slate-500">y {extra} más</li>}
              {participantes.length === 0 && <li className="text-slate-500">No se registraron participantes.</li>}
            </ul>
          </section>
          <section className="rounded-2xl border border-slate-200 p-6">
            <h2 className="flex items-center gap-3 text-xl font-bold" style={{ color: tema.primario }}>
              <span className="grid h-11 w-11 place-items-center rounded-full text-white" style={{ background: "#16a34a" }}>
                <Target size={22} />
              </span>
              Objetivo
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed">
              <Editable>{minuta.objetivo || datos.subtitulo}</Editable>
            </p>
          </section>
        </div>

        {/* Cifras */}
        {datos.cifras.length > 0 && (
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${datos.cifras.length}, minmax(0, 1fr))` }}>
            {datos.cifras.map((c, i) => (
              <div key={i} className="rounded-2xl px-5 py-5 text-center text-white" style={{ background: `linear-gradient(135deg, ${tema.primario}, ${tema.acento})` }}>
                <p className="text-[34px] font-extrabold leading-none">
                  <Editable>{c.valor}</Editable>
                </p>
                <p className="mt-2 text-sm font-medium opacity-90">
                  <Editable>{c.etiqueta}</Editable>
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Bloques */}
        <div className="grid grid-cols-2 gap-6">
          {datos.bloques.map((b, i) => {
            const color = COLORES_BLOQUE[i % COLORES_BLOQUE.length];
            return (
              <section key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white" style={{ background: color }}>
                    <IconoReuX nombre={b.icono} size={24} />
                    <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-slate-900 text-xs font-bold">
                      {i + 1}
                    </span>
                  </span>
                  <h3 className="text-lg font-bold leading-tight" style={{ color }}>
                    <Editable>{b.titulo}</Editable>
                  </h3>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
                  <Editable>{b.texto}</Editable>
                </p>
                <ul className="mt-3 space-y-1.5 text-[14px]">
                  {b.puntos.map((p, j) => (
                    <li key={j} className="flex gap-2">
                      <Check size={18} color={color} strokeWidth={3} className="mt-0.5 shrink-0" />
                      <Editable>{p}</Editable>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        {/* En resumen */}
        <section className="relative overflow-hidden rounded-3xl px-8 py-7 text-white" style={{ background: `linear-gradient(135deg, ${tema.oscuro}, ${tema.primario})` }}>
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-15" style={{ background: tema.destaque }} />
          <div className="relative flex gap-7">
            <div className="flex-1">
              <h2 className="flex items-center gap-3 text-2xl font-bold">
                <span className="grid h-12 w-12 place-items-center rounded-full" style={{ background: tema.destaque, color: tema.oscuro }}>
                  <Lightbulb size={26} />
                </span>
                En resumen…
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-white/90">
                <Editable>{datos.conclusion}</Editable>
              </p>
            </div>
            {datos.destacados.length > 0 && (
              <div className="flex w-[250px] shrink-0 flex-col justify-center gap-2.5">
                {datos.destacados.map((d, i) => {
                  const c = COLORES_ETIQUETA[i % COLORES_ETIQUETA.length];
                  return (
                    <span key={i} className="flex items-center gap-2.5 rounded-full px-4 py-2 text-[14px] font-semibold" style={{ background: c.fondo, color: c.texto }}>
                      <IconoReuX nombre={d.icono} size={18} strokeWidth={2.4} />
                      <Editable>{d.texto}</Editable>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      <footer className="flex items-center gap-4 px-10 pb-7 text-sm text-slate-500">
        <span className="h-[3px] flex-1 rounded" style={{ background: tema.acento }} />
        <span className="font-semibold" style={{ color: tema.primario }}>
          {datos.evento || minuta.titulo}
        </span>
        <span className="h-[3px] flex-1 rounded" style={{ background: tema.destaque }} />
      </footer>
    </div>
  );
});
