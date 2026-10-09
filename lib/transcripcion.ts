// Formato del JSON que Amazon Transcribe deja en S3 (solo los campos usados).
export type SalidaTranscribe = {
  results: {
    transcripts: { transcript: string }[];
    audio_segments?: { speaker_label?: string; start_time: string; transcript: string }[];
    items?: {
      type: "pronunciation" | "punctuation";
      start_time?: string;
      speaker_label?: string;
      alternatives: { content: string }[];
    }[];
  };
};

type Segmento = { hablante: string; inicio: number; texto: string };

function nombreHablante(label: string | undefined): string {
  const n = label?.match(/spk_(\d+)/)?.[1];
  return n === undefined ? "Hablante" : `Hablante ${Number(n) + 1}`;
}

function tiempo(seg: number): string {
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = Math.floor(seg % 60);
  const mmss = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return h > 0 ? `${h}:${mmss}` : mmss;
}

function segmentosDesdeItems(items: NonNullable<SalidaTranscribe["results"]["items"]>): Segmento[] {
  const segs: Segmento[] = [];
  for (const it of items) {
    const palabra = it.alternatives[0]?.content ?? "";
    const ultimo = segs.at(-1);
    if (it.type === "punctuation") {
      if (ultimo) ultimo.texto += palabra;
      continue;
    }
    const hablante = nombreHablante(it.speaker_label);
    if (ultimo && ultimo.hablante === hablante) {
      ultimo.texto += ` ${palabra}`;
    } else {
      segs.push({ hablante, inicio: Number(it.start_time ?? 0), texto: palabra });
    }
  }
  return segs;
}

// Convierte la salida de Transcribe en texto legible:
// "[00:12] Hablante 1: ..." uniendo intervenciones seguidas del mismo hablante.
export function formatearTranscripcion(salida: SalidaTranscribe): string {
  const r = salida.results;
  let segs: Segmento[];
  if (r.audio_segments?.length) {
    segs = [];
    for (const a of r.audio_segments) {
      const hablante = nombreHablante(a.speaker_label);
      const ultimo = segs.at(-1);
      if (ultimo && ultimo.hablante === hablante) ultimo.texto += ` ${a.transcript}`;
      else segs.push({ hablante, inicio: Number(a.start_time), texto: a.transcript });
    }
  } else if (r.items?.length) {
    segs = segmentosDesdeItems(r.items);
  } else {
    return r.transcripts.map((t) => t.transcript).join("\n");
  }
  return segs.map((s) => `[${tiempo(s.inicio)}] ${s.hablante}: ${s.texto.trim()}`).join("\n\n");
}
