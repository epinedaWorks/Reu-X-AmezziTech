import type { Minuta } from "@/lib/esquemas";

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-7 break-inside-avoid-page">
      <h3 className="mb-2 border-b border-slate-200 pb-1 text-sm font-semibold uppercase tracking-wider text-indigo-900">
        {titulo}
      </h3>
      <div className="text-[15px] leading-relaxed text-slate-800">{children}</div>
    </section>
  );
}

// Minuta con formato de documento formal; también es lo que se imprime a PDF.
export function MinutaVista({ m }: { m: Minuta }) {
  const datos = [
    ["Fecha", m.fecha],
    ["Hora", m.hora],
    ["Lugar", m.lugar],
  ].filter(([, v]) => v);

  return (
    <article id="minuta" className="mx-auto max-w-3xl bg-white px-6 py-8 sm:px-12 sm:py-12">
      <header className="border-b-4 border-indigo-900 pb-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Minuta de reunión</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{m.titulo || "Reunión"}</h2>
        {datos.length > 0 && (
          <p className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-slate-600">
            {datos.map(([k, v]) => (
              <span key={k}>
                <strong className="font-semibold text-slate-800">{k}:</strong> {v}
              </span>
            ))}
          </p>
        )}
      </header>

      {m.participantes.length > 0 && (
        <Seccion titulo="Participantes">
          <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {m.participantes.map((p, i) => (
              <li key={i}>
                <span className="font-medium">{p.nombre}</span>
                {p.rol && <span className="text-slate-500"> — {p.rol}</span>}
              </li>
            ))}
          </ul>
        </Seccion>
      )}

      {m.objetivo && (
        <Seccion titulo="Objetivo">
          <p>{m.objetivo}</p>
        </Seccion>
      )}

      {m.resumen_ejecutivo && (
        <Seccion titulo="Resumen ejecutivo">
          <p className="rounded-md border-l-4 border-indigo-300 bg-indigo-50/60 px-4 py-3">{m.resumen_ejecutivo}</p>
        </Seccion>
      )}

      {m.agenda.length > 0 && (
        <Seccion titulo="Agenda">
          <ol className="list-decimal space-y-0.5 pl-6">
            {m.agenda.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ol>
        </Seccion>
      )}

      {m.temas.length > 0 && (
        <Seccion titulo="Desarrollo">
          <div className="space-y-4">
            {m.temas.map((t, i) => (
              <div key={i}>
                <h4 className="font-semibold text-slate-900">
                  {i + 1}. {t.titulo}
                </h4>
                {t.resumen && <p className="mt-1">{t.resumen}</p>}
                {t.puntos.length > 0 && (
                  <ul className="mt-1 list-disc space-y-0.5 pl-6 text-slate-700">
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
        <Seccion titulo="Acuerdos">
          <ol className="list-decimal space-y-1 pl-6">
            {m.acuerdos.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ol>
        </Seccion>
      )}

      {m.tareas.length > 0 && (
        <Seccion titulo="Tareas y responsables">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-indigo-900 text-left text-white">
                  <th className="px-3 py-2 font-semibold">Tarea</th>
                  <th className="px-3 py-2 font-semibold">Responsable</th>
                  <th className="whitespace-nowrap px-3 py-2 font-semibold">Fecha límite</th>
                </tr>
              </thead>
              <tbody>
                {m.tareas.map((t, i) => (
                  <tr key={i} className="border-b border-slate-200 odd:bg-slate-50">
                    <td className="px-3 py-2">{t.tarea}</td>
                    <td className="px-3 py-2">{t.responsable}</td>
                    <td className="whitespace-nowrap px-3 py-2">{t.fecha_limite || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Seccion>
      )}

      {m.pendientes.length > 0 && (
        <Seccion titulo="Temas pendientes">
          <ul className="list-disc space-y-0.5 pl-6">
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
    </article>
  );
}
