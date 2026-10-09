// Formatos que Amazon Transcribe acepta directamente (audio o video).
export const EXTENSIONES_MEDIA = ["mp3", "mp4", "m4a", "wav", "flac", "ogg", "webm", "amr"];

// Archivos de texto que se leen en el navegador (transcripciones, subtítulos, notas).
export const EXTENSIONES_TEXTO = ["txt", "md", "vtt", "srt"];

// Límite de Amazon Transcribe por archivo.
export const TAMANO_MAXIMO = 2 * 1024 * 1024 * 1024;

// Límite práctico de texto para una sola llamada al modelo.
export const TEXTO_MAXIMO = 600_000;
