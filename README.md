# Reu-X · by Amezzi

Convierte reuniones en **minutas formales** y en **mapas mentales o diagramas**.

- **Entrada:** audio o video (MP3, MP4, M4A, WAV, FLAC, OGG, WEBM, AMR; hasta 2 GB y 4 horas) o texto pegado o cargado (.txt, .md, .vtt, .srt).
- **Salida:** una minuta con participantes, objetivo, resumen ejecutivo, agenda, desarrollo por temas, acuerdos, tareas con responsable y fecha, pendientes y próxima reunión. Se puede exportar a Word (con el diagrama incluido), PDF (impresión), Markdown o copiarse.
- **Visuales:**
  - **Mapa mental:** la IA resume las ideas clave y la app lo dibuja en SVG propio, con ramas de colores, íconos y detalles dentro de cada tarjeta. Se exporta a PNG o SVG.
  - **Infografía:** póster vertical con título, frase clave, participantes, objetivo, cifras, bloques temáticos y una franja "En resumen". Tiene 5 temas de color, admite foto y logo opcionales, cualquier texto se edita con un clic y se exporta a PNG de 1800 px de ancho.
  - **Diagrama de flujo** (IA) y **responsables y tareas**, dibujados con Mermaid y con código editable.
  - El Word de la minuta incluye el último visual que hayas generado.

## Arquitectura (AWS, región us-west-1, California)

```
Navegador ──(URL firmada)──► S3  entradas/
    │                         │
    ▼                         ▼
Next.js /api ──► Amazon Transcribe (español/inglés, identifica hablantes)
    │                         │
    │                 S3  transcripciones/
    ▼
Claude (Amazon Bedrock) ──► minuta en JSON estructurado ──► vista, Word, PDF y diagramas
```

| Ruta | Función |
|---|---|
| `POST /api/subir` | Devuelve una URL firmada para que el navegador suba el archivo directamente a S3. |
| `POST /api/transcribir` | Inicia un trabajo de Amazon Transcribe con detección de idioma y de hablantes. |
| `POST /api/transcribir/estado` | Consulta el trabajo. Al terminar, devuelve el texto como `[mm:ss] Hablante N: …`. |
| `POST /api/minuta` | Envía el texto a Claude, que devuelve la minuta con salida estructurada (esquema en `lib/esquemas.ts`). |
| `POST /api/diagrama` | Con `tipo` = `mapa`, `infografia` o `flujo`, envía la minuta a Claude y devuelve los datos estructurados de ese visual; la app los dibuja. |

El diagrama de responsables y tareas se genera directamente de la minuta, sin otra llamada al modelo.
Los archivos subidos se borran solos a los 7 días (regla de ciclo de vida del bucket).

## Puesta en marcha

1. **Infraestructura:** crea el bucket y la política IAM:

   ```bash
   aws cloudformation deploy --region us-west-1 --stack-name reu-x --template-file infra/template.yaml --capabilities CAPABILITY_NAMED_IAM
   ```

   Para producción, agrega tu dominio en `OrigenesPermitidos`:
   `--parameter-overrides OrigenesPermitidos="http://localhost:3000,https://tu-dominio.com"`

2. **Variables:** copia `.env.example` a `.env.local` y elige `REUX_LLM`:
   - `bedrock`: usa Claude en Amazon Bedrock. Requiere que la cuenta tenga acceso al modelo.
   - `anthropic`: usa la API de Anthropic. Requiere `ANTHROPIC_API_KEY`.
   - `demo`: devuelve una minuta fija de ejemplo, para probar la interfaz.

3. **Ejecutar:**

   ```bash
   npm install
   npm run dev
   ```

Las credenciales AWS se toman de la cadena estándar: el perfil de `~/.aws` o las variables `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY`. En producción, usa un usuario o rol que solo tenga la política `reu-x-app-us-west-1` que crea la plantilla.

## Estado de la cuenta AWS (9 de octubre de 2026)

- Amazon Transcribe y S3 funcionan en us-west-1.
- **Bedrock está bloqueado:** `Operation not allowed` en us-west-1, y el aviso "model is not available for this account" en us-east-1. Hay que solicitar acceso al modelo en la consola de Bedrock o abrir un caso con AWS. Mientras tanto, usa `REUX_LLM=anthropic` o `REUX_LLM=demo`.
- Lambda también está bloqueado en la cuenta. Por eso el backend corre en las rutas de Next.js y no en funciones Lambda.
