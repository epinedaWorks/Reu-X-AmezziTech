"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check, Circle, CircleAlert, CircleCheck, Copy, Download, FileCheck, FileDown, FileText, LoaderCircle, Mic,
  Network, Printer, RefreshCw, ScrollText, Server, Type, Upload, X,
} from "lucide-react";
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

const CREDENCIALES_VENCIDAS =
  "Las credenciales de AWS del servidor vencieron. Renuévelas (en local: aws login --profile reux) y vuelva a intentar.";

const MENSAJES_S3: Record<string, string> = {
  ExpiredToken: CREDENCIALES_VENCIDAS,
  TokenRefreshRequired: CREDENCIALES_VENCIDAS,
  InvalidToken: CREDENCIALES_VENCIDAS,
  AccessDenied: "S3 denegó la subida. Revise que las credenciales del servidor tengan permiso sobre el bucket.",
  NoSuchBucket: "El bucket configurado en REUX_BUCKET no existe. Revise la configuración del servidor.",
};

function subirConProgreso(url: string, archivo: File, onProgreso: (p: number) => void): Promise<void> {
  return new Promise((ok, mal) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", archivo.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgreso(e.loaded / e.total);
    xhr.onload = () => {
      if (xhr.status < 300) return ok();
      // S3 responde con un XML <Error><Code>…</Code></Error>.
      const codigo = xhr.responseText.match(/<Code>([^<]+)<\/Code>/)?.[1] ?? "";
      mal(new Error(MENSAJES_S3[codigo] ?? `S3 rechazó la subida (${xhr.status}${codigo ? `, ${codigo}` : ""}).`));
    };
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
  const puedeGenerar = fuente === "archivo" ? Boolean(archivo) : Boolean(texto.trim());

  const campo =
    "w-full border border-borde bg-white px-2.5 py-1.5 text-[13.5px] text-tinta outline-none transition placeholder:text-[#a0a7b2] focus:border-marca focus:ring-2 focus:ring-marca/10";

  return (
    <div className="flex min-h-dvh flex-col lg:h-dvh">
      {/* Barra superior */}
      <header className="no-print flex h-14 shrink-0 items-center justify-between border-b border-borde bg-white px-5">
        <div className="flex items-center gap-4">
          <div className="grid h-8 w-8 place-items-center bg-marca font-serif text-[15px] font-bold text-white">R</div>
          <div className="flex items-baseline gap-3">
            <span className="text-[15px] font-semibold tracking-tight text-marca">Reu-X</span>
            <span className="hidden h-4 w-px bg-borde sm:block" />
            <span className="hidden text-[13px] text-tenue sm:block">Actas y minutas de reunión</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[12.5px]">
          <span className="hidden items-center gap-1.5 text-tenue md:inline-flex">
            <Server size={14} /> AWS · us-west-1
          </span>
          {demo && <span className="border border-acento/40 bg-acento/10 px-2 py-0.5 font-medium text-acento">Modo demostración</span>}
          <span className="hidden text-[11px] font-semibold uppercase tracking-[0.2em] text-tenue sm:block">Amezzi</span>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:grid lg:min-h-0 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* Panel de entrada */}
        <aside className="no-print panel-scroll flex flex-col border-b border-borde bg-white lg:min-h-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="flex-1 space-y-5 p-5">
            <section>
              <Encabezado n={1} titulo="Fuente de la reunión" />
              <div className="mt-3 grid grid-cols-2 border border-borde text-[13px] font-medium">
                {(
                  [
                    ["archivo", "Grabación", Mic],
                    ["texto", "Texto", Type],
                  ] as const
                ).map(([f, nombre, Icono], i) => (
                  <button
                    key={f}
                    disabled={ocupado}
                    onClick={() => setFuente(f)}
                    className={`inline-flex items-center justify-center gap-2 py-2 transition ${i > 0 ? "border-l border-borde" : ""} ${
                      fuente === f ? "bg-marca text-white" : "text-tenue hover:bg-fondo hover:text-tinta"
                    }`}
                  >
                    <Icono size={15} /> {nombre}
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
                  className="mt-3 cursor-pointer border border-dashed border-[#b9c1cc] bg-fondo px-4 py-5 text-center transition hover:border-marca hover:bg-marca-suave/50"
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
                      <FileCheck size={22} className="mx-auto text-exito" />
                      <p className="mt-2 break-all text-[13.5px] font-medium text-tinta">{archivo.name}</p>
                      <p className="text-[12px] text-tenue">{tamanoLegible(archivo.size)} · Clic para cambiar</p>
                    </>
                  ) : (
                    <>
                      <Upload size={22} className="mx-auto text-tenue" />
                      <p className="mt-2 text-[13.5px] font-medium text-tinta">Arrastre la grabación o haga clic</p>
                      <p className="mt-0.5 text-[12px] text-tenue">MP3, MP4, M4A, WAV y otros · hasta 2 GB</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="mt-3">
                  <textarea
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    disabled={ocupado}
                    rows={5}
                    placeholder="Pegue la transcripción, las notas o el chat de la reunión."
                    className={`${campo} panel-scroll resize-y leading-relaxed`}
                  />
                  <div className="mt-1.5 flex items-center justify-between text-[12px]">
                    <div className="flex gap-3">
                      <input
                        ref={inputTexto}
                        type="file"
                        hidden
                        accept={EXTENSIONES_TEXTO.map((e) => `.${e}`).join(",")}
                        onChange={(e) => elegirArchivo(e.target.files?.[0])}
                      />
                      <button onClick={() => inputTexto.current?.click()} className="font-medium text-marca hover:underline">
                        Cargar archivo
                      </button>
                      <button onClick={() => setTexto(REUNION_EJEMPLO)} className="font-medium text-marca hover:underline">
                        Usar ejemplo
                      </button>
                    </div>
                    <span className="text-tenue">{texto.length.toLocaleString("es")} caracteres</span>
                  </div>
                </div>
              )}
            </section>

            <section>
              <Encabezado n={2} titulo="Datos de la reunión" nota="Opcional" />
              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                {(
                  [
                    ["titulo", "Título", "Comité de proyecto", 2],
                    ["fecha", "Fecha", "9 oct 2026", 1],
                    ["lugar", "Lugar", "Sala B / Zoom", 1],
                    ["participantes", "Participantes", "Nombre (cargo), …", 2],
                    ["notas", "Indicaciones", "Ej.: enfatizar acuerdos de presupuesto", 2],
                  ] as const
                ).map(([k, etiqueta, ph, span]) => (
                  <label key={k} className={span === 2 ? "col-span-2" : ""}>
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-tenue">{etiqueta}</span>
                    <input
                      value={contexto[k]}
                      onChange={(e) => setContexto({ ...contexto, [k]: e.target.value })}
                      placeholder={ph}
                      disabled={ocupado}
                      className={campo}
                    />
                  </label>
                ))}
              </div>
            </section>

            {ocupado && <Progreso etapa={etapa} fuente={fuente} progreso={progreso} segundos={segundos} />}

            {error && (
              <div role="alert" className="flex items-start gap-2 border border-peligro/30 bg-peligro/5 px-3 py-2.5 text-[13px] text-peligro">
                <CircleAlert size={16} className="mt-0.5 shrink-0" />
                <span className="flex-1">{error}</span>
                <button onClick={() => setError(null)} aria-label="Cerrar" className="shrink-0 hover:opacity-70">
                  <X size={15} />
                </button>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 space-y-1.5 border-t border-borde bg-white px-5 py-4">
            <button
              onClick={procesar}
              disabled={ocupado || !puedeGenerar}
              className="inline-flex w-full items-center justify-center gap-2 bg-marca py-2.5 text-[14px] font-semibold text-white transition hover:bg-marca-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {ocupado ? <LoaderCircle size={16} className="animate-spin" /> : <FileText size={16} />}
              {ocupado ? "Procesando…" : minuta ? "Generar nueva minuta" : "Generar minuta"}
            </button>
            {minuta && !ocupado && (
              <button onClick={nuevaReunion} className="w-full py-1 text-[12.5px] font-medium text-tenue hover:text-marca">
                Limpiar y empezar otra reunión
              </button>
            )}
          </div>
        </aside>

        {/* Área de trabajo */}
        <main className="flex min-h-[70vh] flex-col lg:min-h-0">
          <div className="no-print flex shrink-0 flex-wrap items-end justify-between gap-x-6 border-b border-borde bg-white px-5">
            <nav className="flex gap-6 text-[13.5px] font-medium" role="tablist">
              {(
                [
                  ["minuta", "Minuta", ScrollText],
                  ["diagrama", "Visuales", Network],
                  ["transcripcion", "Transcripción", FileText],
                ] as const
              ).map(([id, nombre, Icono]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={pestana === id}
                  disabled={!minuta}
                  onClick={() => setPestana(id)}
                  className={`-mb-px inline-flex items-center gap-2 border-b-2 py-3.5 transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    pestana === id && minuta ? "border-marca text-marca" : "border-transparent text-tenue hover:text-tinta"
                  }`}
                >
                  <Icono size={15} /> {nombre}
                </button>
              ))}
            </nav>

            {minuta && pestana === "minuta" && (
              <div className="flex flex-wrap gap-1.5 py-2 text-[12.5px]">
                <Boton onClick={exportarWord} icono={FileDown} titulo="Incluye el último visual generado">Word</Boton>
                <Boton onClick={() => window.print()} icono={Printer}>PDF</Boton>
                <Boton
                  onClick={() => descargar(new Blob([minutaMarkdown(minuta)], { type: "text/markdown" }), nombreArchivo(minuta, "md"))}
                  icono={Download}
                >
                  Markdown
                </Boton>
                <Boton onClick={() => navigator.clipboard.writeText(minutaMarkdown(minuta)).then(() => setAviso("Minuta copiada al portapapeles"))} icono={Copy}>
                  Copiar
                </Boton>
              </div>
            )}
          </div>

          <div className="relative min-h-0 flex-1">
            {!minuta ? (
              <Bienvenida />
            ) : (
              <>
                {pestana === "minuta" && (
                  <div className="imprimible panel-scroll absolute inset-0 overflow-y-auto p-5 lg:p-6">
                    <MinutaVista m={minuta} />
                  </div>
                )}

                {/* Se mantiene montado (fuera de pantalla, no con display:none) para no perder lo
                    generado al cambiar de pestaña y poder exportarlo al Word desde la minuta. */}
                <div
                  className={pestana === "diagrama" ? "no-print absolute inset-0" : "no-print pointer-events-none fixed -left-[10000px] top-0 h-[900px] w-[1200px]"}
                  aria-hidden={pestana !== "diagrama"}
                  inert={pestana !== "diagrama"}
                >
                  <Visuales key={version} minuta={minuta} activo={pestana === "diagrama"} onImagen={alImagen} onError={setError} />
                </div>

                {pestana === "transcripcion" && (
                  <div className="no-print absolute inset-0 flex flex-col p-5 lg:p-6">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[13px] text-tenue">
                        Corrija nombres o cifras (por ejemplo, reemplace “Hablante 1” por el nombre real) y regenere la minuta.
                      </p>
                      <div className="flex gap-1.5 text-[12.5px]">
                        <Boton onClick={regenerar} disabled={ocupado || !transcripcion.trim()} icono={RefreshCw} principal>
                          Regenerar minuta
                        </Boton>
                        <Boton
                          onClick={() =>
                            descargar(new Blob([transcripcion], { type: "text/plain" }), nombreArchivo(minuta, "txt").replace(".txt", "-transcripcion.txt"))
                          }
                          icono={Download}
                        >
                          Descargar .txt
                        </Boton>
                      </div>
                    </div>
                    <textarea
                      value={transcripcion}
                      onChange={(e) => setTranscripcion(e.target.value)}
                      className="panel-scroll min-h-[300px] w-full flex-1 resize-none border border-borde bg-white p-5 font-serif text-[15px] leading-relaxed text-tinta outline-none focus:border-marca"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {aviso && (
        <div className="no-print fixed bottom-6 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 bg-marca px-4 py-2 text-[13px] text-white shadow-lg">
          <Check size={15} /> {aviso}
        </div>
      )}
    </div>
  );
}

function Encabezado({ n, titulo, nota }: { n: number; titulo: string; nota?: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-linea pb-1.5">
      <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-marca">
        <span className="mr-1.5 font-serif text-acento">{n}.</span>
        {titulo}
      </h2>
      {nota && <span className="text-[11.5px] text-tenue">{nota}</span>}
    </div>
  );
}

function Boton({
  children, onClick, disabled, principal, titulo, icono: Icono,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  principal?: boolean;
  titulo?: string;
  icono?: React.ComponentType<{ size?: number }>;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={titulo}
      className={`inline-flex items-center gap-1.5 border px-2.5 py-1.5 font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
        principal ? "border-marca bg-marca text-white hover:bg-marca-hover" : "border-borde bg-white text-tinta hover:border-marca hover:text-marca"
      }`}
    >
      {Icono && <Icono size={14} />}
      {children}
    </button>
  );
}

function Bienvenida() {
  const pasos = [
    { icono: Upload, titulo: "Cargue la reunión", texto: "Grabación de audio o video, o el texto de la transcripción o las notas." },
    { icono: Mic, titulo: "Transcripción y análisis", texto: "Se identifican los participantes, los temas, los acuerdos y las tareas." },
    { icono: ScrollText, titulo: "Revise y comparta", texto: "Minuta formal en Word o PDF, mapa mental, infografía y diagramas." },
  ];
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-acento">Reu-X</p>
        <h2 className="mt-2 font-serif text-[32px] font-semibold leading-tight text-marca">De la reunión al acta, en minutos.</h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-tenue">
          Cargue la grabación o la transcripción en el panel de la izquierda. Reu-X redacta una minuta formal y genera los
          materiales para compartirla.
        </p>
        <ol className="mt-8 grid gap-px border border-borde bg-borde sm:grid-cols-3">
          {pasos.map((p, i) => (
            <li key={i} className="bg-white p-5">
              <div className="flex items-center justify-between">
                <p.icono size={20} className="text-marca" />
                <span className="font-serif text-[13px] text-acento">0{i + 1}</span>
              </div>
              <p className="mt-3 text-[14px] font-semibold text-tinta">{p.titulo}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-tenue">{p.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Progreso({ etapa, fuente, progreso, segundos }: { etapa: Etapa | null; fuente: Fuente; progreso: number; segundos: number }) {
  const pasos: { id: Etapa; nombre: string }[] =
    fuente === "archivo"
      ? [
          { id: "subiendo", nombre: "Carga del archivo" },
          { id: "transcribiendo", nombre: "Transcripción" },
          { id: "redactando", nombre: "Redacción de la minuta" },
        ]
      : [{ id: "redactando", nombre: "Redacción de la minuta" }];
  const actual = pasos.findIndex((p) => p.id === etapa);

  return (
    <section aria-live="polite">
      <Encabezado n={3} titulo="Procesamiento" />
      <ol className="mt-3 space-y-2.5 text-[13px]">
        {pasos.map((p, i) => (
          <li key={p.id} className="flex items-center gap-2.5">
            {i < actual ? (
              <CircleCheck size={17} className="text-exito" />
            ) : i === actual ? (
              <LoaderCircle size={17} className="animate-spin text-marca" />
            ) : (
              <Circle size={17} className="text-borde" />
            )}
            <span className={i === actual ? "font-medium text-tinta" : "text-tenue"}>{p.nombre}</span>
            {i === actual && (
              <span className="ml-auto tabular-nums text-tenue">
                {p.id === "subiendo" ? `${Math.round(progreso * 100)} %` : duracion(segundos)}
              </span>
            )}
          </li>
        ))}
      </ol>
      {etapa === "subiendo" && (
        <div className="mt-2 h-1 bg-linea">
          <div className="h-full bg-marca transition-all" style={{ width: `${Math.round(progreso * 100)}%` }} />
        </div>
      )}
      {etapa === "transcribiendo" && (
        <p className="mt-2.5 text-[12px] leading-relaxed text-tenue">Suele tardar entre la cuarta parte y la mitad de la duración de la grabación.</p>
      )}
    </section>
  );
}
