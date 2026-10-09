import type { Minuta } from "@/lib/esquemas";

function Titulo({ n, children }: { n?: number; children: React.ReactNode }) {
  return (
    <h3 className="mb-2.5 flex items-baseline gap-2 border-b border-borde pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-marca">
      {n !== undefined && <span className="font-serif text-[13px] text-acento">{n}.</span>}
      {children}
    </h3>
  );
}

function Seccion({ titulo, n, children }: { titulo: string; n?: number; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid-page">
      <Titulo n={n}>{titulo}</Titulo>
      <div className="text-[14.5px] leading-relaxed text-tinta">{children}</div>
    </section>
  );
}

// Minuta con formato de acta formal. En pantalla usa dos columnas; al imprimir, una.
export function MinutaVista({ m }: { m: Minuta }) {
  const datos = [
    ["Fecha", m.fecha],
    ["Hora", m.hora],
    ["Lugar", m.lugar],
  ] as const;

  // Numeración de las secciones presentes en la columna principal.
  const presentes = [
    Boolean(m.resumen_ejecutivo),
    m.temas.length > 0,
    m.acuerdos.length > 0,
    m.tareas.length > 0,
  ];
  const numero = (i: number) => presentes.slice(0, i + 1).filter(Boolean).length;
  const [nResumen, nDesarrollo, nAcuerdos, nTareas] = [0, 1, 2, 3].map(numero);

  return (
    <article id="minuta" className="imprimible mx-auto max-w-[1100px] border border-borde bg-white px-8 py-8 shadow-[0_1px_2px_rgba(16,24,40,0.05)] sm:px-10">
      <header className="border-b-2 border-marca pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-tenue">Minuta de reunión</p>
        <h2 className="mt-1.5 font-serif text-[28px] font-semibold leading-tight text-marca">{m.titulo || "Reunión"}</h2>
        <dl className="mt-4 grid grid-cols-3 border border-borde text-sm">
          {datos.map(([k, v], i) => (
            <div key={k} className={`px-3 py-2 ${i > 0 ? "border-l border-borde" : ""}`}>
              <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-tenue">{k}</dt>
              <dd className="mt-0.5 text-tinta">{v || "—"}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="mt-7 grid gap-x-10 gap-y-7 lg:grid-cols-[minmax(0,1fr)_290px] print:block">
        {/* Columna principal */}
        <div className="space-y-7 print:mb-7">
          {m.resumen_ejecutivo && (
            <Seccion titulo="Resumen ejecutivo" n={nResumen}>
              <p className="border-l-2 border-acento pl-4 font-serif text-[15.5px] leading-relaxed">{m.resumen_ejecutivo}</p>
            </Seccion>
          )}

          {m.temas.length > 0 && (
            <Seccion titulo="Desarrollo" n={nDesarrollo}>
              <div className="space-y-4">
                {m.temas.map((t, i) => (
                  <div key={i}>
                    <h4 className="font-semibold text-marca">
                      {nDesarrollo}.{i + 1} {t.titulo}
                    </h4>
                    {t.resumen && <p className="mt-1">{t.resumen}</p>}
                    {t.puntos.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5 pl-5 text-tenue marker:text-acento [list-style-type:'–__']">
                        {t.puntos.map((p, j) => (
                          <li key={j}>{p}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </Seccion>
          )}

          {m.acuerdos.length > 0 && (
            <Seccion titulo="Acuerdos" n={nAcuerdos}>
              <ol className="space-y-1.5">
                {m.acuerdos.map((a, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-px font-serif font-semibold text-acento">A{i + 1}</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ol>
            </Seccion>
          )}

          {m.tareas.length > 0 && (
            <Seccion titulo="Tareas y responsables" n={nTareas}>
              <table className="w-full border-collapse border border-borde text-[13.5px]">
                <thead>
                  <tr className="bg-marca-suave text-left text-[11px] uppercase tracking-wider text-marca">
                    <th className="w-10 border-b border-borde px-3 py-2 font-semibold">#</th>
                    <th className="border-b border-borde px-3 py-2 font-semibold">Tarea</th>
                    <th className="border-b border-borde px-3 py-2 font-semibold">Responsable</th>
                    <th className="whitespace-nowrap border-b border-borde px-3 py-2 font-semibold">Fecha límite</th>
                  </tr>
                </thead>
                <tbody>
                  {m.tareas.map((t, i) => (
                    <tr key={i} className="border-b border-linea last:border-0">
                      <td className="px-3 py-2 align-top text-tenue">{i + 1}</td>
                      <td className="px-3 py-2 align-top">{t.tarea}</td>
                      <td className="px-3 py-2 align-top">{t.responsable}</td>
                      <td className="whitespace-nowrap px-3 py-2 align-top">{t.fecha_limite || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Seccion>
          )}
        </div>

        {/* Columna lateral */}
        <aside className="space-y-7 lg:border-l lg:border-linea lg:pl-8 print:border-0 print:pl-0">
          {m.objetivo && (
            <Seccion titulo="Objetivo">
              <p>{m.objetivo}</p>
            </Seccion>
          )}

          {m.participantes.length > 0 && (
            <Seccion titulo="Participantes">
              <ul className="space-y-1.5">
                {m.participantes.map((p, i) => (
                  <li key={i}>
                    <p className="font-medium">{p.nombre}</p>
                    {p.rol && <p className="text-[13px] text-tenue">{p.rol}</p>}
                  </li>
                ))}
              </ul>
            </Seccion>
          )}

          {m.agenda.length > 0 && (
            <Seccion titulo="Agenda">
              <ol className="list-decimal space-y-0.5 pl-5 marker:text-tenue">
                {m.agenda.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ol>
            </Seccion>
          )}

          {m.pendientes.length > 0 && (
            <Seccion titulo="Temas pendientes">
              <ul className="space-y-1 pl-5 [list-style-type:'–__']">
                {m.pendientes.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </Seccion>
          )}

          {m.proxima_reunion && (
            <Seccion titulo="Próxima reunión">
              <p>{m.proxima_reunion}</p>
            </Seccion>
          )}
        </aside>
      </div>
    </article>
  );
}
