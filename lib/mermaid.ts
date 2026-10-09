import type { Flujo, Minuta } from "./esquemas";

// Texto para etiquetas entre comillas (diagramas de flujo).
function cita(t: string, max = 80): string {
  let s = t.replace(/"/g, "'").replace(/[<>]/g, " ").replace(/\s+/g, " ").trim();
  if (s.length > max) s = `${s.slice(0, max - 1).trimEnd()}…`;
  return s || "—";
}

const idSeguro = (id: string) => `n_${id.replace(/\W/g, "_")}`;

export function diagramaFlujo(f: Flujo): string {
  const l = ["flowchart TD"];
  for (const n of f.nodos) {
    const id = idSeguro(n.id);
    const t = cita(n.texto);
    if (n.tipo === "decision") l.push(`  ${id}{"${t}"}`);
    else if (n.tipo === "inicio" || n.tipo === "fin") l.push(`  ${id}(["${t}"])`);
    else l.push(`  ${id}["${t}"]`);
  }
  const ids = new Set(f.nodos.map((n) => n.id));
  for (const c of f.conexiones) {
    if (!ids.has(c.desde) || !ids.has(c.hacia)) continue;
    const flecha = c.etiqueta ? `-->|"${cita(c.etiqueta, 30)}"|` : "-->";
    l.push(`  ${idSeguro(c.desde)} ${flecha} ${idSeguro(c.hacia)}`);
  }
  for (const n of f.nodos) {
    if (n.tipo === "inicio" || n.tipo === "fin") l.push(`  class ${idSeguro(n.id)} extremo`);
    if (n.tipo === "decision") l.push(`  class ${idSeguro(n.id)} decision`);
  }
  l.push("  classDef extremo fill:#1b2a41,stroke:#1b2a41,color:#ffffff");
  l.push("  classDef decision fill:#f6efe4,stroke:#9a7b4f,color:#5c4526");
  return l.join("\n");
}

export function diagramaTareas(m: Minuta): string {
  const l = ["flowchart LR", `  raiz(["${cita(m.titulo || "Reunión", 50)}"])`];
  const porResponsable = new Map<string, Minuta["tareas"]>();
  for (const t of m.tareas) {
    const r = t.responsable.trim() || "Por definir";
    porResponsable.set(r, [...(porResponsable.get(r) ?? []), t]);
  }
  if (!porResponsable.size) {
    l.push(`  vacio["No se registraron tareas"]`, "  raiz --> vacio");
  }
  let i = 0;
  let j = 0;
  for (const [responsable, tareas] of porResponsable) {
    const rid = `r${i++}`;
    l.push(`  ${rid}["${cita(responsable, 40)}"]`, `  raiz --> ${rid}`, `  class ${rid} persona`);
    for (const t of tareas) {
      const tid = `t${j++}`;
      const fecha = t.fecha_limite ? `<br/>Fecha: ${cita(t.fecha_limite, 30)}` : "";
      l.push(`  ${tid}["${cita(t.tarea, 70)}${fecha}"]`, `  ${rid} --> ${tid}`);
    }
  }
  l.push("  classDef persona fill:#e8ecf2,stroke:#1b2a41,color:#1b2a41");
  l.push("  class raiz raizc", "  classDef raizc fill:#1b2a41,stroke:#1b2a41,color:#ffffff");
  return l.join("\n");
}
