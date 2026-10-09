"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Icono, Mapa } from "@/lib/esquemas";
import { ICONO_COMPONENTE } from "@/lib/iconos";

// Mapa mental dibujado a mano en SVG puro (sin foreignObject), con ramas a la
// izquierda y derecha del centro, para que se vea bien y se pueda exportar a PNG.
// Los detalles de cada idea van dentro de su tarjeta para que el mapa no sea tan ancho.

const FUENTE = "Arial, Helvetica, sans-serif";
const COLORES = ["#2563eb", "#16a34a", "#ea580c", "#9333ea", "#db2777", "#0891b2"];

type Estilo = { peso: number; tam: number; maxAncho: number; padX: number; padY: number };
const ESTILOS: Record<"centro" | "rama" | "idea" | "detalle", Estilo> = {
  centro: { peso: 700, tam: 21, maxAncho: 230, padX: 22, padY: 16 },
  rama: { peso: 700, tam: 15, maxAncho: 170, padX: 14, padY: 10 },
  idea: { peso: 600, tam: 14, maxAncho: 210, padX: 12, padY: 8 },
  detalle: { peso: 400, tam: 13, maxAncho: 200, padX: 0, padY: 0 },
};
const ICONO_TAM = 18;
const SEP_H = { rama: 64, idea: 46 };
const SEP_V = { rama: 30, idea: 12 };
const DET_SANGRIA = 14;
const DET_SEP = 3;

type Caja = { lineas: string[]; w: number; h: number; tam: number; peso: number; padX: number; padY: number };
type Nodo = { caja: Caja; hijos: Nodo[]; x: number; y: number; icono?: Icono; detalles?: Caja[] };

// Tarjeta de idea: el texto principal y, debajo, sus detalles con viñeta.
function tarjetaIdea(texto: string, detalles: string[]): Nodo {
  const c = caja(texto, ESTILOS.idea);
  const dets = detalles.map((d) => caja(d, ESTILOS.detalle));
  if (dets.length) {
    const anchoDet = Math.max(...dets.map((d) => d.w)) + DET_SANGRIA + c.padX * 2;
    c.w = Math.max(c.w, Math.ceil(anchoDet));
    c.h += 4 + dets.reduce((t, d) => t + d.h, 0) + DET_SEP * (dets.length - 1);
  }
  return { caja: c, detalles: dets, hijos: [], x: 0, y: 0 };
}

let ctx: CanvasRenderingContext2D | null = null;
function medir(texto: string, peso: number, tam: number): number {
  ctx ??= document.createElement("canvas").getContext("2d");
  if (!ctx) return texto.length * tam * 0.55;
  ctx.font = `${peso} ${tam}px ${FUENTE}`;
  return ctx.measureText(texto).width;
}

function caja(texto: string, e: Estilo, extra = 0): Caja {
  const palabras = texto.trim().split(/\s+/);
  const lineas: string[] = [];
  let actual = "";
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p;
    if (actual && medir(prueba, e.peso, e.tam) > e.maxAncho) {
      lineas.push(actual);
      actual = p;
    } else actual = prueba;
  }
  if (actual) lineas.push(actual);
  const ancho = Math.max(...lineas.map((l) => medir(l, e.peso, e.tam)));
  return {
    lineas,
    w: Math.ceil(ancho + extra + e.padX * 2),
    h: Math.ceil(lineas.length * e.tam * 1.3 + e.padY * 2),
    tam: e.tam,
    peso: e.peso,
    padX: e.padX,
    padY: e.padY,
  };
}

function altoSubarbol(n: Nodo, sep: number[]): number {
  if (!n.hijos.length) return n.caja.h;
  const s = sep[0] ?? 0;
  const hijos = n.hijos.reduce((t, h) => t + altoSubarbol(h, sep.slice(1)), 0) + s * (n.hijos.length - 1);
  return Math.max(n.caja.h, hijos);
}

// Ubica verticalmente los nodos de una lista dentro de la franja [y0, y0+alto].
function ubicarVertical(nodos: Nodo[], centroY: number, sep: number[]) {
  const altos = nodos.map((n) => altoSubarbol(n, sep.slice(1)));
  const total = altos.reduce((a, b) => a + b, 0) + sep[0] * (nodos.length - 1);
  let y = centroY - total / 2;
  nodos.forEach((n, i) => {
    n.y = y + altos[i] / 2;
    if (n.hijos.length) ubicarVertical(n.hijos, n.y, sep.slice(1));
    y += altos[i] + sep[0];
  });
}

function construir(mapa: Mapa) {
  const centro: Nodo = { caja: caja(mapa.centro, ESTILOS.centro), hijos: [], x: 0, y: 0 };
  const ramas: (Nodo & { color: string; lado: 1 | -1 })[] = mapa.ramas.map((r, i) => ({
    caja: caja(r.titulo, ESTILOS.rama, ICONO_TAM + 8),
    icono: r.icono,
    x: 0,
    y: 0,
    color: COLORES[i % COLORES.length],
    lado: i < Math.ceil(mapa.ramas.length / 2) ? 1 : -1,
    hijos: r.ideas.map((idea) => tarjetaIdea(idea.texto, idea.detalles)),
  }));

  for (const lado of [1, -1] as const) {
    const delLado = ramas.filter((r) => r.lado === lado);
    // En el lado izquierdo el orden visual va de arriba hacia abajo igual que el derecho.
    ubicarVertical(delLado, 0, [SEP_V.rama, SEP_V.idea]);
    const anchoRama = Math.max(0, ...delLado.map((r) => r.caja.w));
    // x = borde más cercano al centro de cada columna.
    const xRama = centro.caja.w / 2 + SEP_H.rama;
    const xIdea = xRama + anchoRama + SEP_H.idea;
    for (const r of delLado) {
      r.x = lado * xRama;
      for (const idea of r.hijos) idea.x = lado * xIdea;
    }
  }
  return { centro, ramas };
}

// Rectángulo de un nodo: x guarda el borde cercano al centro; según el lado,
// la caja crece hacia la derecha o hacia la izquierda.
function rect(n: Nodo, lado: 1 | -1) {
  const x = lado === 1 ? n.x : n.x - n.caja.w;
  return { x, y: n.y - n.caja.h / 2, w: n.caja.w, h: n.caja.h };
}

function Texto({ c, x, y, color, anchor = "start" }: { c: Caja; x: number; y: number; color: string; anchor?: "start" | "middle" }) {
  const alto = c.tam * 1.3;
  return (
    <text x={x} y={y} fill={color} fontFamily={FUENTE} fontSize={c.tam} fontWeight={c.peso} textAnchor={anchor}>
      {c.lineas.map((l, i) => (
        <tspan key={i} x={x} y={y + i * alto + c.tam * 0.95}>
          {l}
        </tspan>
      ))}
    </text>
  );
}

function curva(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
}

export function MapaMental({ mapa, onSvg }: { mapa: Mapa; onSvg: (svg: string | null) => void }) {
  const ref = useRef<SVGSVGElement>(null);
  const { centro, ramas } = useMemo(() => construir(mapa), [mapa]);

  useEffect(() => {
    onSvg(ref.current ? new XMLSerializer().serializeToString(ref.current) : null);
  }, [mapa, onSvg]);

  // Límites del dibujo.
  const rects = [{ x: -centro.caja.w / 2, y: -centro.caja.h / 2, w: centro.caja.w, h: centro.caja.h }];
  for (const r of ramas) {
    rects.push(rect(r, r.lado));
    for (const i of r.hijos) rects.push(rect(i, r.lado));
  }
  const pad = 36;
  const minX = Math.min(...rects.map((r) => r.x)) - pad;
  const minY = Math.min(...rects.map((r) => r.y)) - pad;
  const ancho = Math.max(...rects.map((r) => r.x + r.w)) + pad - minX;
  const alto = Math.max(...rects.map((r) => r.y + r.h)) + pad - minY;

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`${minX} ${minY} ${ancho} ${alto}`}
      width={Math.round(ancho)}
      height={Math.round(alto)}
      className="mx-auto h-auto max-w-full"
      // En pantallas angostas se desplaza en vez de achicar el texto hasta volverlo ilegible.
      style={{ minWidth: Math.min(Math.round(ancho), 760) }}
    >
      <defs>
        <linearGradient id="reux-centro" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1e3a8a" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
        <filter id="reux-sombra" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.15" />
        </filter>
      </defs>
      <rect x={minX} y={minY} width={ancho} height={alto} fill="#ffffff" />

      {/* Conexiones */}
      {ramas.map((r, i) => {
        const cx = (r.lado * centro.caja.w) / 2 - r.lado * 8;
        return (
          <g key={`c${i}`} fill="none" stroke={r.color} strokeLinecap="round">
            <path d={curva(cx, 0, r.x, r.y)} strokeWidth={4.5} />
            {r.hijos.map((idea, j) => {
              const desde = r.x + r.lado * r.caja.w;
              return (
                <path key={j} d={curva(desde, r.y, idea.x, idea.y)} strokeWidth={2.4} />
              );
            })}
          </g>
        );
      })}

      {/* Centro */}
      <g filter="url(#reux-sombra)">
        <rect
          x={-centro.caja.w / 2}
          y={-centro.caja.h / 2}
          width={centro.caja.w}
          height={centro.caja.h}
          rx={20}
          fill="url(#reux-centro)"
        />
      </g>
      <Texto c={centro.caja} x={0} y={-centro.caja.h / 2 + centro.caja.padY} color="#ffffff" anchor="middle" />

      {/* Ramas, ideas y detalles */}
      {ramas.map((r, i) => {
        const rr = rect(r, r.lado);
        const Icono = r.icono ? ICONO_COMPONENTE[r.icono] : null;
        return (
          <g key={`n${i}`}>
            <g filter="url(#reux-sombra)">
              <rect x={rr.x} y={rr.y} width={rr.w} height={rr.h} rx={12} fill={r.color} />
            </g>
            {Icono && (
              <Icono
                x={rr.x + r.caja.padX}
                y={r.y - ICONO_TAM / 2}
                width={ICONO_TAM}
                height={ICONO_TAM}
                color="#ffffff"
                strokeWidth={2.2}
              />
            )}
            <Texto c={r.caja} x={rr.x + r.caja.padX + ICONO_TAM + 8} y={rr.y + r.caja.padY} color="#ffffff" />

            {r.hijos.map((idea, j) => {
              const ri = rect(idea, r.lado);
              return (
                <g key={j}>
                  <rect
                    x={ri.x}
                    y={ri.y}
                    width={ri.w}
                    height={ri.h}
                    rx={10}
                    fill={`${r.color}14`}
                    stroke={r.color}
                    strokeWidth={1.5}
                  />
                  <Texto c={idea.caja} x={ri.x + idea.caja.padX} y={ri.y + idea.caja.padY} color="#1e293b" />
                  {(() => {
                    // Los detalles empiezan debajo de las líneas del texto principal.
                    let y = ri.y + idea.caja.padY + idea.caja.lineas.length * idea.caja.tam * 1.3 + 4;
                    return idea.detalles?.map((d, k) => {
                      const top = y;
                      y += d.h + DET_SEP;
                      return (
                        <g key={k}>
                          <circle cx={ri.x + idea.caja.padX + 4} cy={top + d.tam * 0.62} r={3} fill={r.color} />
                          <Texto c={d} x={ri.x + idea.caja.padX + DET_SANGRIA} y={top} color="#475569" />
                        </g>
                      );
                    });
                  })()}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
