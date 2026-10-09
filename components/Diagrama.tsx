"use client";

import { useEffect, useState } from "react";

let contador = 0;
let inicializado = false;

async function renderizar(codigo: string): Promise<string> {
  const mermaid = (await import("mermaid")).default;
  if (!inicializado) {
    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      // Etiquetas SVG puras (sin foreignObject) para poder exportar a PNG.
      htmlLabels: false,
      securityLevel: "strict",
      fontFamily: "Arial, Helvetica, sans-serif",
      themeVariables: {
        primaryColor: "#eef2ff",
        primaryBorderColor: "#4f46e5",
        primaryTextColor: "#1e1b4b",
        lineColor: "#64748b",
        fontSize: "15px",
      },
      mindmap: { padding: 14, maxNodeWidth: 220 },
    });
    inicializado = true;
  }
  const { svg } = await mermaid.render(`reux-diagrama-${++contador}`, codigo);
  return svg;
}

export function Diagrama({ codigo, onSvg }: { codigo: string; onSvg: (svg: string | null) => void }) {
  const [estado, setEstado] = useState<{ svg: string | null; error: string | null }>({ svg: null, error: null });

  useEffect(() => {
    let vigente = true;
    renderizar(codigo)
      .then((svg) => {
        if (!vigente) return;
        setEstado({ svg, error: null });
        onSvg(svg);
      })
      .catch((e: unknown) => {
        if (!vigente) return;
        setEstado({ svg: null, error: e instanceof Error ? e.message : String(e) });
        onSvg(null);
      });
    return () => {
      vigente = false;
    };
  }, [codigo, onSvg]);

  if (estado.error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        No se pudo dibujar el diagrama. Revisa el código Mermaid.
        <pre className="mt-2 whitespace-pre-wrap text-xs opacity-80">{estado.error}</pre>
      </div>
    );
  }
  if (!estado.svg) {
    return <div className="py-16 text-center text-sm text-slate-500">Dibujando diagrama…</div>;
  }
  return (
    <div
      className="diagrama overflow-x-auto rounded-lg bg-white p-4 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: estado.svg }}
    />
  );
}
