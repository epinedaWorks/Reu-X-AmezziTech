"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MinutaVista } from "./MinutaVista";
import { Visuales, type Imagen } from "./Visuales";
import { REUNION_EJEMPLO } from "@/lib/ejemplo";
import type { Minuta } from "@/lib/esquemas";
import { descargar, minutaMarkdown, minutaWord, nombreArchivo } from "@/lib/exportar";
import { EXTENSIONES_MEDIA, EXTENSIONES_TEXTO, TAMANO_MAXIMO } from "@/lib/formatos";

type Fuente = "archivo" | "texto";
type Etapa = "subiendo" | "transcribiendo" | "redactando";
type Contexto = { titulo: string; fecha: string; lugar: string; participantes: string; notas: string };
type Pestana = "minuta" | "diagrama" | "transcripcion";

const CONTEXTO_VACIO: Contexto = { titulo: "", fecha: "", lugar: "", participantes: "", notas: "" };

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const datos = await r.json().catch(() => ({}));
  if (!r.ok || datos.error) throw new Error(datos.error ?? `Error ${r.status} en ${url}`);
  return datos as T;
}

function subirConProgreso(url: string, archivo: File, onProgreso: (p: number) => void): Promise<void> {
  return new Promise((ok, mal) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", archivo.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgreso(e.loaded / e.total);
    xhr.onload = () => (xhr.status < 300 ? ok() : mal(new Error(`S3 rechazó la subida (${xhr.status}).`)));
    xhr.onerror = () => mal(new Error("No se pudo subir el archivo. Revisa la conexión y la configuración CORS del bucket."));
    xhr.send(archivo);
  });
}

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

function tamanoLegible(b: number) {
  if (b > 1e9) return `${(b / 1e9).toFixed(1)} GB`;
  if (b > 1e6) return `${(b / 1e6).toFixed(1)} MB`;
  return `${Math.ceil(b / 1e3)} KB`;
}

function duracion(seg: number) {
  return `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, "0")}`;
}

export function ReuX() {
  const [fuente, setFuente] = useState<Fuente>("archivo");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [texto, setTexto] = useState("");
  const [contexto, setContexto] = useState<Contexto>(CONTEXTO_VACIO);
  const [verContexto, setVerContexto] = useState(false);

  const [etapa, setEtapa] = useState<Etapa | null>(null);
  const [progreso, setProgreso] = useState(0);
  const [inicioEtapa, setInicioEtapa] = useState(0);
  const [ahora, setAhora] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [transcripcion, setTranscripcion] = useState("");
  const [minuta, setMinuta] = useState<Minuta | null>(null);
  const [demo, setDemo] = useState(false);
  const [pestana, setPestana] = useState<Pestana>("minuta");

  const [version, setVersion] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);

  const inputArchivo = useRef<HTMLInputElement>(null);
  const inputTexto = useRef<HTMLInputElement>(null);

  // Reloj para mostrar el tiempo transcurrido de cada etapa.
  useEffect(() => {
    if (!etapa) return;
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [etapa]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 2500);
    return () => clearTimeout(t);
  }, [aviso]);

  const iniciarEtapa = (e: Etapa) => {
    setEtapa(e);
    setInicioEtapa(Date.now());
    setAhora(Date.now());
  };

  function elegirArchivo(f: File | undefined) {
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    setError(null);
    if (EXTENSIONES_TEXTO.includes(ext)) {
      f.text().then((t) => {
        setFuente("texto");
        setTexto(t);
      });
      return;
    }
    if (!EXTENSIONES_MEDIA.includes(ext)) {
      setError(`Formato .${ext} no soportado. Audio/video: ${EXTENSIONES_MEDIA.join(", ")}. Texto: ${EXTENSIONES_TEXTO.join(", ")}.`);
      return;
    }
    if (f.size > TAMANO_MAXIMO) {
      setError("El archivo supera el máximo de 2 GB.");
      return;
    }
    setArchivo(f);
  }

  async function redactar(contenido: string) {
    iniciarEtapa("redactando");
    const r = await postJSON<{ minuta: Minuta; demo?: boolean }>("/api/minuta", { texto: contenido, contexto });
    setMinuta(r.minuta);
    setDemo(Boolean(r.demo));
    setVersion((v) => v + 1);
    setPestana("minuta");
  }

  async function procesar() {
    setError(null);
    try {
      let contenido = texto;
      if (fuente === "archivo") {
        if (!archivo) throw new Error("Selecciona un archivo de audio o video.");
        iniciarEtapa("subiendo");
        setProgreso(0);
        const { key, url } = await postJSON<{ key: string; url: string }>("/api/subir", {
          nombre: archivo.name,
          tipo: archivo.type,
          tamano: archivo.size,
        });
        await subirConProgreso(url, archivo, setProgreso);

        iniciarEtapa("transcribiendo");
        const { trabajo } = await postJSON<{ trabajo: string }>("/api/transcribir", { key });
        for (;;) {
          await espera(5000);
          const e = await postJSON<{ estado: string; texto?: string; error?: string }>("/api/transcribir/estado", { trabajo });
          if (e.estado === "listo") {
            contenido = e.texto ?? "";
            break;
          }
          if (e.estado === "fallo") throw new Error(`Transcribe no pudo procesar el archivo: ${e.error}`);
        }
        if (!contenido.trim()) throw new Error("La transcripción salió vacía. ¿El archivo tiene audio con voz?");
        setTranscripcion(contenido);
      } else {
        if (!contenido.trim()) throw new Error("Escribe o pega el contenido de la reunión.");
        setTranscripcion(contenido);
      }
      await redactar(contenido);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setEtapa(null);
    }
  }

  async function regenerar() {
    setError(null);
    try {
      await redactar(transcripcion);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setEtapa(null);
    }
  }

  function nuevaReunion() {
    setMinuta(null);
    setTranscripcion("");
    setArchivo(null);
    setTexto("");
    setContexto(CONTEXTO_VACIO);
    setError(null);
    setDemo(false);
  }

  // Visuales nos pasa una función que produce la imagen actual (para el Word).
  const imagenActual = useRef<(() => Promise<Imagen>) | null>(null);
  const alImagen = useCallback((f: (() => Promise<Imagen>) | null) => {
    imagenActual.current = f;
  }, []);

  async function exportarWord() {
    if (!minuta) return;
    try {
      // Incluye el último visual generado (mapa, infografía o diagrama), si hay uno.
      const img = imagenActual.current ? await imagenActual.current() : undefined;
      descargar(await minutaWord(minuta, img), nombreArchivo(minuta, "docx"));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const ocupado = etapa !== null;
  const segundos = Math.max(0, Math.round((ahora - inicioEtapa) / 1000));

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="no-print border-b border-indigo-950 bg-indigo-950 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 text-lg font-black">
              R
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">
                Reu<span className="text-sky-400">-X</span>
              </h1>
              <p className="text-xs text-indigo-200">by Amezzi · Minutas inteligentes</p>
            </div>
          </div>
          {minuta && (
            <button onClick={nuevaReunion} className="rounded-lg border border-indigo-400/40 px-3 py-1.5 text-sm hover:bg-white/10">
              + Nueva reunión
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {error && (
          <div role="alert" className="no-print mb-6 flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-semibold" aria-label="Cerrar">×</button>
          </div>
        )}

        {!minuta && (
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                De la reunión a la minuta, en minutos.
              </h2>
              <p className="mt-3 text-slate-600">
                Sube la grabación (audio o video) o pega la transcripción. Reu-X la transcribe, identifica a quienes hablan y
                redacta una minuta formal con acuerdos y tareas, más un mapa mental, diagramas y una infografía listos para compartir.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7">
              <div className="mb-5 inline-flex rounded-lg bg-slate-100 p-1 text-sm font-medium">
                {(["archivo", "texto"] as const).map((f) => (
                  <button
                    key={f}
                    disabled={ocupado}
                    onClick={() => setFuente(f)}
                    className={`rounded-md px-4 py-1.5 transition ${fuente === f ? "bg-white text-indigo-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    {f === "archivo" ? "🎙️ Audio o video" : "📝 Texto"}
                  </button>
                ))}
              </div>

              {fuente === "archivo" ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (!ocupado) elegirArchivo(e.dataTransfer.files[0]);
                  }}
                  onClick={() => !ocupado && inputArchivo.current?.click()}
                  className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 px-6 py-10 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40"
                >
                  <input
                    ref={inputArchivo}
                    type="file"
                    hidden
                    accept={[...EXTENSIONES_MEDIA, ...EXTENSIONES_TEXTO].map((e) => `.${e}`).join(",")}
                    onChange={(e) => elegirArchivo(e.target.files?.[0])}
                  />
                  {archivo ? (
                    <>
                      <p className="text-3xl">{archivo.type.startsWith("video") ? "🎬" : "🎧"}</p>
                      <p className="mt-2 font-semibold text-slate-900">{archivo.name}</p>
                      <p className="text-sm text-slate-500">{tamanoLegible(archivo.size)} · clic para cambiar</p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl">⬆️</p>
                      <p className="mt-2 font-semibold text-slate-900">Arrastra aquí la grabación o haz clic para elegirla</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {EXTENSIONES_MEDIA.join(", ").toUpperCase()} · hasta 2 GB / 4 horas
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div>
                  <textarea
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    disabled={ocupado}
                    rows={12}
                    placeholder="Pega aquí la transcripción, las notas o el chat de la reunión…"
                    className="w-full resize-y rounded-xl border border-slate-300 p-4 text-sm leading-relaxed outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div className="flex gap-3">
                      <input
                        ref={inputTexto}
                        type="file"
                        hidden
                        accept={EXTENSIONES_TEXTO.map((e) => `.${e}`).join(",")}
                        onChange={(e) => elegirArchivo(e.target.files?.[0])}
                      />
                      <button onClick={() => inputTexto.current?.click()} className="font-medium text-indigo-700 hover:underline">
                        Cargar .txt / .vtt / .srt
                      </button>
                      <button onClick={() => setTexto(REUNION_EJEMPLO)} className="font-medium text-indigo-700 hover:underline">
                        Usar reunión de ejemplo
                      </button>
                    </div>
                    <span className="text-slate-500">{texto.length.toLocaleString("es")} caracteres</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => setVerContexto((v) => !v)}
                className="mt-5 text-sm font-medium text-slate-700 hover:text-indigo-800"
              >
                {verContexto ? "▾" : "▸"} Datos de la reunión (opcional)
              </button>
              {verContexto && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["titulo", "Título", "Comité de proyecto semanal"],
                      ["fecha", "Fecha", "9 de octubre de 2026"],
                      ["lugar", "Lugar o plataforma", "Sala B / Zoom"],
                      ["participantes", "Participantes", "Laura Méndez (gerente), Carlos…"],
                    ] as const
                  ).map(([k, etiqueta, ph]) => (
                    <label key={k} className="text-sm">
                      <span className="mb-1 block text-slate-600">{etiqueta}</span>
                      <input
                        value={contexto[k]}
                        onChange={(e) => setContexto({ ...contexto, [k]: e.target.value })}
                        placeholder={ph}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                      />
                    </label>
                  ))}
                  <label className="text-sm sm:col-span-2">
                    <span className="mb-1 block text-slate-600">Indicaciones para la minuta</span>
                    <input
                      value={contexto.notas}
                      onChange={(e) => setContexto({ ...contexto, notas: e.target.value })}
                      placeholder="Ej.: enfatizar los acuerdos de presupuesto; omitir la charla inicial"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                    />
                  </label>
                </div>
              )}

              {ocupado ? (
                <Progreso etapa={etapa} fuente={fuente} progreso={progreso} segundos={segundos} />
              ) : (
                <button
                  onClick={procesar}
                  className="mt-6 w-full rounded-xl bg-indigo-700 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-800 disabled:opacity-50"
                  disabled={fuente === "archivo" ? !archivo : !texto.trim()}
                >
                  Generar minuta
                </button>
              )}
            </div>
          </div>
        )}

        {minuta && (
          <div>
            {demo && (
              <div className="no-print mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900">
                Modo demostración: esta es una minuta de ejemplo fija (REUX_LLM=demo). Configura Bedrock o la API de Anthropic para resultados reales.
              </div>
            )}

            <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
              <nav className="inline-flex rounded-lg bg-white p-1 text-sm font-medium shadow-sm ring-1 ring-slate-200">
                {(
                  [
                    ["minuta", "Minuta"],
                    ["diagrama", "Mapa mental e infografía"],
                    ["transcripcion", "Transcripción"],
                  ] as const
                ).map(([id, nombre]) => (
                  <button
                    key={id}
                    onClick={() => setPestana(id)}
                    className={`rounded-md px-3 py-1.5 sm:px-4 ${pestana === id ? "bg-indigo-700 text-white" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    {nombre}
                  </button>
                ))}
              </nav>

              {pestana === "minuta" && (
                <div className="flex flex-wrap gap-2 text-sm">
                  <Boton onClick={exportarWord} titulo="Incluye el último mapa, infografía o diagrama que hayas generado">Word</Boton>
                  <Boton onClick={() => window.print()}>PDF / Imprimir</Boton>
                  <Boton onClick={() => descargar(new Blob([minutaMarkdown(minuta)], { type: "text/markdown" }), nombreArchivo(minuta, "md"))}>
                    Markdown
                  </Boton>
                  <Boton
                    onClick={() => navigator.clipboard.writeText(minutaMarkdown(minuta)).then(() => setAviso("Minuta copiada"))}
                  >
                    Copiar
                  </Boton>
                </div>
              )}
            </div>

            {etapa === "redactando" && <Progreso etapa={etapa} fuente="texto" progreso={0} segundos={segundos} />}

            {pestana === "minuta" && (
              <div className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-slate-200 print:shadow-none print:ring-0">
                <MinutaVista m={minuta} />
              </div>
            )}

            {/* Se mantiene montado (fuera de pantalla, no con display:none) para no perder lo
                generado al cambiar de pestaña y poder exportarlo al Word desde la minuta. */}
            <div
              className={pestana === "diagrama" ? "no-print" : "no-print pointer-events-none fixed -left-[10000px] top-0 w-[1100px]"}
              aria-hidden={pestana !== "diagrama"}
              inert={pestana !== "diagrama"}
            >
              <Visuales key={version} minuta={minuta} activo={pestana === "diagrama"} onImagen={alImagen} onError={setError} />
            </div>

            {pestana === "transcripcion" && (
              <div className="no-print rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
                <p className="mb-3 text-sm text-slate-600">
                  Puedes corregir la transcripción (por ejemplo, cambiar “Hablante 1” por el nombre real) y volver a generar la minuta.
                </p>
                <textarea
                  value={transcripcion}
                  onChange={(e) => setTranscripcion(e.target.value)}
                  rows={20}
                  className="w-full resize-y rounded-xl border border-slate-300 p-4 text-sm leading-relaxed outline-none focus:border-indigo-500"
                />
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  <Boton onClick={regenerar} disabled={ocupado || !transcripcion.trim()} principal>
                    Regenerar minuta
                  </Boton>
                  <Boton onClick={() => descargar(new Blob([transcripcion], { type: "text/plain" }), nombreArchivo(minuta, "txt").replace(".txt", "-transcripcion.txt"))}>
                    Descargar .txt
                  </Boton>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {aviso && (
        <div className="no-print fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
          {aviso}
        </div>
      )}

      <footer className="no-print py-8 text-center text-xs text-slate-500">
        Reu-X · Amazon Transcribe + Claude en Amazon Bedrock · Los archivos se eliminan automáticamente del almacenamiento.
      </footer>
    </div>
  );
}

function Boton({
  children, onClick, disabled, principal, titulo,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  principal?: boolean;
  titulo?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={titulo}
      className={`rounded-lg px-3 py-1.5 font-medium shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
        principal ? "bg-indigo-700 text-white hover:bg-indigo-800" : "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function Progreso({ etapa, fuente, progreso, segundos }: { etapa: Etapa | null; fuente: Fuente; progreso: number; segundos: number }) {
  const pasos: { id: Etapa; nombre: string }[] =
    fuente === "archivo"
      ? [
          { id: "subiendo", nombre: "Subiendo archivo" },
          { id: "transcribiendo", nombre: "Transcribiendo con Amazon Transcribe" },
          { id: "redactando", nombre: "Redactando la minuta" },
        ]
      : [{ id: "redactando", nombre: "Redactando la minuta" }];
  const actual = pasos.findIndex((p) => p.id === etapa);

  return (
    <div className="no-print mt-6 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200" aria-live="polite">
      <ol className="space-y-2.5 text-sm">
        {pasos.map((p, i) => (
          <li key={p.id} className="flex items-center gap-3">
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                i < actual ? "bg-emerald-500 text-white" : i === actual ? "animate-pulse bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {i < actual ? "✓" : i + 1}
            </span>
            <span className={i === actual ? "font-semibold text-slate-900" : "text-slate-500"}>
              {p.nombre}
              {i === actual && p.id === "subiendo" && ` · ${Math.round(progreso * 100)} %`}
              {i === actual && p.id !== "subiendo" && ` · ${duracion(segundos)}`}
            </span>
          </li>
        ))}
      </ol>
      {etapa === "transcribiendo" && (
        <p className="mt-3 text-xs text-slate-500">La transcripción suele tardar entre la cuarta parte y la mitad de la duración de la grabación.</p>
      )}
    </div>
  );
}
