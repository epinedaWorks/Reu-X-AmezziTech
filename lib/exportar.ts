import type { Minuta } from "./esquemas";

export function descargar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function nombreArchivo(m: Minuta, ext: string): string {
  const base = (m.titulo || "minuta")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 60);
  return `${base || "minuta"}.${ext}`;
}

export function minutaMarkdown(m: Minuta): string {
  const l: string[] = [`# ${m.titulo || "Minuta de reunión"}`, ""];
  const datos = [
    m.fecha && `**Fecha:** ${m.fecha}`,
    m.hora && `**Hora:** ${m.hora}`,
    m.lugar && `**Lugar:** ${m.lugar}`,
  ].filter(Boolean);
  if (datos.length) l.push(datos.join("  \n"), "");
  if (m.participantes.length) {
    l.push("## Participantes", "");
    for (const p of m.participantes) l.push(`- ${p.nombre}${p.rol ? ` — ${p.rol}` : ""}`);
    l.push("");
  }
  if (m.objetivo) l.push("## Objetivo", "", m.objetivo, "");
  if (m.resumen_ejecutivo) l.push("## Resumen ejecutivo", "", m.resumen_ejecutivo, "");
  if (m.agenda.length) {
    l.push("## Agenda", "");
    m.agenda.forEach((a, i) => l.push(`${i + 1}. ${a}`));
    l.push("");
  }
  if (m.temas.length) {
    l.push("## Desarrollo", "");
    m.temas.forEach((t, i) => {
      l.push(`### ${i + 1}. ${t.titulo}`, "", t.resumen, "");
      for (const p of t.puntos) l.push(`- ${p}`);
      l.push("");
    });
  }
  if (m.acuerdos.length) {
    l.push("## Acuerdos", "");
    m.acuerdos.forEach((a, i) => l.push(`${i + 1}. ${a}`));
    l.push("");
  }
  if (m.tareas.length) {
    l.push("## Tareas", "", "| Tarea | Responsable | Fecha límite |", "|---|---|---|");
    for (const t of m.tareas) {
      l.push(`| ${t.tarea.replace(/\|/g, "/")} | ${t.responsable} | ${t.fecha_limite || "—"} |`);
    }
    l.push("");
  }
  if (m.pendientes.length) {
    l.push("## Temas pendientes", "");
    for (const p of m.pendientes) l.push(`- ${p}`);
    l.push("");
  }
  if (m.proxima_reunion) l.push("## Próxima reunión", "", m.proxima_reunion, "");
  return l.join("\n");
}

export async function minutaWord(m: Minuta, diagrama?: { png: Uint8Array; ancho: number; alto: number }) {
  const {
    Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
    WidthType, ImageRun, AlignmentType, ShadingType,
  } = await import("docx");

  const h = (texto: string) => new Paragraph({ text: texto, heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 120 } });
  const p = (texto: string) => new Paragraph({ children: [new TextRun(texto)], spacing: { after: 120 } });
  const viñeta = (texto: string) => new Paragraph({ text: texto, bullet: { level: 0 } });
  const numerada = (texto: string, i: number) => new Paragraph({ children: [new TextRun(`${i + 1}. ${texto}`)], spacing: { after: 80 } });
  const dato = (etiqueta: string, valor: string) =>
    new Paragraph({ children: [new TextRun({ text: `${etiqueta}: `, bold: true }), new TextRun(valor)] });

  const celda = (texto: string, encabezado = false) =>
    new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: texto, bold: encabezado, color: encabezado ? "FFFFFF" : undefined })] })],
      shading: encabezado ? { type: ShadingType.CLEAR, color: "auto", fill: "1E3A8A" } : undefined,
    });

  const hijos: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = [
    new Paragraph({ text: "MINUTA DE REUNIÓN", alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
    new Paragraph({ text: m.titulo || "Reunión", heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
  ];
  if (m.fecha) hijos.push(dato("Fecha", m.fecha));
  if (m.hora) hijos.push(dato("Hora", m.hora));
  if (m.lugar) hijos.push(dato("Lugar", m.lugar));

  if (m.participantes.length) {
    hijos.push(h("Participantes"));
    for (const x of m.participantes) hijos.push(viñeta(x.rol ? `${x.nombre} — ${x.rol}` : x.nombre));
  }
  if (m.objetivo) hijos.push(h("Objetivo"), p(m.objetivo));
  if (m.resumen_ejecutivo) hijos.push(h("Resumen ejecutivo"), p(m.resumen_ejecutivo));
  if (m.agenda.length) {
    hijos.push(h("Agenda"));
    m.agenda.forEach((a, i) => hijos.push(numerada(a, i)));
  }
  if (m.temas.length) {
    hijos.push(h("Desarrollo"));
    m.temas.forEach((t, i) => {
      hijos.push(new Paragraph({ text: `${i + 1}. ${t.titulo}`, heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 80 } }));
      if (t.resumen) hijos.push(p(t.resumen));
      for (const x of t.puntos) hijos.push(viñeta(x));
    });
  }
  if (m.acuerdos.length) {
    hijos.push(h("Acuerdos"));
    m.acuerdos.forEach((a, i) => hijos.push(numerada(a, i)));
  }
  if (m.tareas.length) {
    hijos.push(
      h("Tareas"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ tableHeader: true, children: [celda("Tarea", true), celda("Responsable", true), celda("Fecha límite", true)] }),
          ...m.tareas.map((t) => new TableRow({ children: [celda(t.tarea), celda(t.responsable), celda(t.fecha_limite || "—")] })),
        ],
      }),
    );
  }
  if (m.pendientes.length) {
    hijos.push(h("Temas pendientes"));
    for (const x of m.pendientes) hijos.push(viñeta(x));
  }
  if (m.proxima_reunion) hijos.push(h("Próxima reunión"), p(m.proxima_reunion));

  if (diagrama) {
    // Ancho útil de la página carta con márgenes de 1": ~6.5" ≈ 620 px.
    const escala = Math.min(1, 620 / diagrama.ancho);
    hijos.push(
      h("Diagrama"),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            type: "png",
            data: diagrama.png,
            transformation: { width: Math.round(diagrama.ancho * escala), height: Math.round(diagrama.alto * escala) },
          }),
        ],
      }),
    );
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{ children: hijos }],
  });
  return Packer.toBlob(doc);
}

// Convierte el SVG de Mermaid a PNG (fondo blanco, escala 2x para nitidez).
export async function svgAPng(svg: string, escala = 2): Promise<{ png: Uint8Array; blob: Blob; ancho: number; alto: number }> {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  const raiz = doc.documentElement;
  const vb = raiz.getAttribute("viewBox")?.split(/[\s,]+/).map(Number);
  const ancho = Math.ceil(vb?.[2] ?? Number.parseFloat(raiz.getAttribute("width") ?? "800"));
  const alto = Math.ceil(vb?.[3] ?? Number.parseFloat(raiz.getAttribute("height") ?? "600"));
  raiz.setAttribute("width", String(ancho));
  raiz.setAttribute("height", String(alto));
  raiz.removeAttribute("style");
  const texto = new XMLSerializer().serializeToString(raiz);

  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(texto)}`;
  await img.decode();

  const canvas = document.createElement("canvas");
  canvas.width = ancho * escala;
  canvas.height = alto * escala;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((ok, mal) =>
    canvas.toBlob((b) => (b ? ok(b) : mal(new Error("No se pudo generar el PNG"))), "image/png"),
  );
  return { png: new Uint8Array(await blob.arrayBuffer()), blob, ancho, alto };
}
