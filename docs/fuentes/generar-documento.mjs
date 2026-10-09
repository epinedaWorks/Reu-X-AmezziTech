// Genera docs/Reu-X_Documentacion_Tecnica.docx
// Uso: node docs/fuentes/generar-documento.mjs   (antes: python docs/fuentes/diagramas.py)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AlignmentType, Bookmark, BorderStyle, Document, Footer, Header, HeadingLevel, ImageRun, LevelFormat, Packer, PageBreak,
  InternalHyperlink, PageNumber, Paragraph, ShadingType, Table, TableCell, TableRow, TabStopType, TextRun, WidthType,
} from "docx";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const SALIDA = path.join(aqui, "..", "Reu-X_Documentacion_Tecnica.docx");

const MARCA = "1B2A41";
const ACENTO = "9A7B4F";
const TENUE = "5B6574";
const SUAVE = "E8ECF2";
const BORDE = "C9D0DA";
const ANCHO = 9360; // Carta con márgenes de 1": 12240 - 2 × 1440

// ───────── utilidades ─────────

// Texto con **negritas** y `código` en línea.
function runs(texto, base = {}) {
  const partes = texto.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return partes.map((p) => {
    if (p.startsWith("**")) return new TextRun({ ...base, text: p.slice(2, -2), bold: true });
    if (p.startsWith("`")) return new TextRun({ ...base, text: p.slice(1, -1), font: "Consolas", size: 19, color: MARCA });
    return new TextRun({ ...base, text: p });
  });
}

const P = (texto, opc = {}) => new Paragraph({ children: runs(texto), spacing: { after: 120, line: 288 }, ...opc });
// Títulos con marcador, para el índice con enlaces (no requiere actualizar campos en Word).
const indice = [];
function titulo(t, heading, nivel, extra = {}) {
  const id = `sec_${indice.length + 1}`;
  indice.push({ t, nivel, id });
  return new Paragraph({ heading, ...extra, children: [new Bookmark({ id, children: [new TextRun(t)] })] });
}
const H1 = (t) => titulo(t, HeadingLevel.HEADING_1, 1, { pageBreakBefore: true });
const H2 = (t) => titulo(t, HeadingLevel.HEADING_2, 2);
const H3 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_3 });
const V = (t, nivel = 0) => new Paragraph({ children: runs(t), numbering: { reference: "vinetas", level: nivel }, spacing: { after: 60, line: 276 } });
const N = (t, ref = "pasos") => new Paragraph({ children: runs(t), numbering: { reference: ref, level: 0 }, spacing: { after: 60, line: 276 } });

function codigo(lineas) {
  return lineas.map(
    (l, i) =>
      new Paragraph({
        children: [new TextRun({ text: l || " ", font: "Consolas", size: 18, color: "1F2733" })],
        shading: { type: ShadingType.CLEAR, color: "auto", fill: "F4F5F7" },
        border: {
          left: { style: BorderStyle.SINGLE, size: 12, color: MARCA, space: 8 },
          ...(i === 0 ? { top: { style: BorderStyle.SINGLE, size: 2, color: "F4F5F7", space: 4 } } : {}),
          ...(i === lineas.length - 1 ? { bottom: { style: BorderStyle.SINGLE, size: 2, color: "F4F5F7", space: 4 } } : {}),
        },
        spacing: { after: i === lineas.length - 1 ? 160 : 0, line: 252 },
        indent: { left: 120 },
      }),
  );
}

function nota(titulo, texto) {
  return new Paragraph({
    children: [new TextRun({ text: `${titulo}  `, bold: true, color: ACENTO }), ...runs(texto)],
    shading: { type: ShadingType.CLEAR, color: "auto", fill: "FBF7F1" },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: ACENTO, space: 8 } },
    spacing: { before: 80, after: 160, line: 288 },
    indent: { left: 120, right: 120 },
  });
}

function tabla(encabezados, filas, anchos) {
  const total = anchos.reduce((a, b) => a + b, 0);
  const ajust = anchos.map((w) => Math.round((w / total) * ANCHO));
  ajust[ajust.length - 1] += ANCHO - ajust.reduce((a, b) => a + b, 0);
  const borde = { style: BorderStyle.SINGLE, size: 4, color: BORDE };
  const bordes = { top: borde, bottom: borde, left: borde, right: borde };
  const celda = (texto, i, enc) =>
    new TableCell({
      width: { size: ajust[i], type: WidthType.DXA },
      borders: bordes,
      shading: enc ? { type: ShadingType.CLEAR, color: "auto", fill: MARCA } : undefined,
      margins: { top: 70, bottom: 70, left: 110, right: 110 },
      children: String(texto)
        .split("\n")
        .map((linea) => new Paragraph({ children: runs(linea, enc ? { bold: true, color: "FFFFFF", size: 19 } : { size: 19 }), spacing: { after: 30, line: 264 } })),
    });
  return new Table({
    width: { size: ANCHO, type: WidthType.DXA },
    columnWidths: ajust,
    rows: [
      new TableRow({ tableHeader: true, children: encabezados.map((e, i) => celda(e, i, true)) }),
      ...filas.map((f) => new TableRow({ children: f.map((c, i) => celda(c, i, false)) })),
    ],
  });
}
const espacio = () => new Paragraph({ text: "", spacing: { after: 80 } });

function imagen(archivo, ancho, alto, pie) {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 60 },
      children: [new ImageRun({ type: "png", data: fs.readFileSync(path.join(aqui, archivo)), transformation: { width: ancho, height: alto } })],
    }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: pie, italics: true, size: 18, color: TENUE })] }),
  ];
}

// ───────── contenido ─────────

function portada() {
  return [
  new Paragraph({ spacing: { before: 2400 }, children: [new TextRun({ text: "DOCUMENTACIÓN TÉCNICA Y DE USUARIO", bold: true, size: 22, color: ACENTO, characterSpacing: 60 })] }),
  new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Reu-X", bold: true, size: 96, color: MARCA, font: "Georgia" })] }),
  new Paragraph({ spacing: { after: 400 }, children: [new TextRun({ text: "Actas y minutas de reunión con inteligencia artificial en AWS", size: 32, color: TENUE })] }),
  new Paragraph({
    border: { top: { style: BorderStyle.SINGLE, size: 12, color: MARCA, space: 12 } },
    spacing: { before: 600, after: 60 },
    children: [new TextRun({ text: "Amezzi ", bold: true, size: 30, color: MARCA }), new TextRun({ text: "Tech", bold: true, size: 30, color: ACENTO })],
  }),
  new Paragraph({ children: [new TextRun({ text: "by Ing. Erick J. Pineda Amézquita", size: 22, color: TENUE })] }),
  new Paragraph({ spacing: { before: 600 }, children: runs("**Versión:** 1.0 · **Fecha:** 9 de octubre de 2026") }),
  new Paragraph({ children: runs("**Producción:** https://reux.amezzi.tech") }),
  new Paragraph({ children: runs("**Repositorio:** https://github.com/epinedaWorks/Reu-X-AmezziTech") }),
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({
    spacing: { after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: MARCA, space: 6 } },
    children: [new TextRun({ text: "Contenido", font: "Georgia", size: 36, bold: true, color: MARCA })],
  }),
  ...indice.map(
    (e) =>
      new Paragraph({
        indent: { left: e.nivel === 1 ? 0 : 360 },
        spacing: { before: e.nivel === 1 ? 140 : 20, after: 20 },
        children: [
          new InternalHyperlink({
            anchor: e.id,
            children: [new TextRun({ text: e.t, bold: e.nivel === 1, size: e.nivel === 1 ? 22 : 20, color: e.nivel === 1 ? MARCA : "1F2733" })],
          }),
        ],
      }),
  ),
  ];
}

const resumen = [
  H1("1. Resumen del proyecto"),
  P("**Reu-X** convierte una reunión —grabada en audio o video, o escrita como texto— en una **minuta formal** lista para compartir, junto con **materiales visuales**: mapa mental, infografía, diagrama de flujo y un diagrama de responsables y tareas."),
  P("Está pensado para equipos, instituciones y eventos que necesitan documentar reuniones de forma rápida y consistente, sin depender de que alguien tome notas a mano."),
  H2("1.1 Qué hace"),
  tabla(
    ["Capacidad", "Descripción"],
    [
      ["Transcripción", "Convierte la voz en texto (español e inglés), separa a cada participante como “Hablante 1, 2…” y marca los tiempos."],
      ["Minuta formal", "Título, fecha, lugar, participantes, objetivo, resumen ejecutivo, agenda, desarrollo por temas, acuerdos, tareas con responsable y fecha, pendientes y próxima reunión."],
      ["Visuales", "Mapa mental, infografía (con temas de color, foto y logo), diagrama de flujo y diagrama de responsables."],
      ["Exportación", "Word (incluye el último visual), PDF (impresión), Markdown, PNG y SVG."],
      ["Usuarios y perfiles", "Administrador, Usuario y Participante, con límites diarios y de tamaño de archivo."],
    ],
    [25, 75],
  ),
  espacio(),
  H2("1.2 Datos clave"),
  tabla(
    ["Elemento", "Valor"],
    [
      ["Dirección web", "https://reux.amezzi.tech"],
      ["Nube", "Amazon Web Services, región us-west-1 (N. California), cuenta 937509584902"],
      ["Modelo de IA", "Claude Sonnet 4.6 en Amazon Bedrock (configurable)"],
      ["Tecnología", "Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Node.js 24"],
      ["Código fuente", "github.com/epinedaWorks/Reu-X-AmezziTech (rama main)"],
    ],
    [28, 72],
  ),
];

const usuario = [
  H1("2. Guía de usuario"),
  H2("2.1 Ingreso"),
  N("Abra **https://reux.amezzi.tech** en un navegador actualizado (Chrome, Edge, Firefox o Safari)."),
  N("Escriba su **usuario** y **contraseña** y presione **Entrar**."),
  N("La sesión dura 12 horas. Para salir antes, use el ícono de salida en la esquina superior derecha."),
  P("En la barra superior verá su nombre, su perfil y, si tiene límite, cuántas minutas ha usado hoy (por ejemplo, “Participante · 3/20 hoy”)."),
  H3("Perfiles"),
  tabla(
    ["Perfil", "Qué puede hacer", "Límites habituales"],
    [
      ["Administrador", "Todo, incluida la pantalla **Usuarios**.", "Sin límite."],
      ["Usuario", "Generar minutas, visuales y exportar.", "Sin límite, salvo que el administrador defina uno."],
      ["Participante", "Lo mismo que Usuario. Pensado para cuentas compartidas en eventos o talleres.", "20 minutas por día y archivos de hasta 300 MB."],
    ],
    [20, 45, 35],
  ),
  H2("2.2 Generar una minuta"),
  P("La pantalla inicial es una sola página con dos secciones:"),
  N("**Fuente de la reunión.** Elija **Grabación** y arrastre el archivo (MP3, MP4, M4A, WAV, FLAC, OGG, WEBM o AMR; hasta 2 GB y 4 horas), o elija **Texto** y pegue la transcripción, las notas o el chat. También puede cargar un archivo .txt, .md, .vtt o .srt, o usar **Usar ejemplo**.", "pasos2"),
  N("**Datos de la reunión (opcional).** Título, fecha, lugar, participantes e indicaciones. Ayudan a que la minuta salga más precisa (por ejemplo, con los cargos correctos).", "pasos2"),
  N("Presione **Generar minuta**. La pantalla muestra los **datos cargados** y el **avance**: carga del archivo (con porcentaje), transcripción y redacción, con el tiempo transcurrido.", "pasos2"),
  nota("Tiempos:", "la transcripción tarda aproximadamente entre la cuarta parte y la mitad de la duración del audio; la redacción de la minuta, entre 20 y 40 segundos."),
  H2("2.3 Revisar y exportar la minuta"),
  P("Al terminar se abre el espacio de trabajo con tres pestañas. En **Minuta** se ve el acta en dos columnas: a la izquierda el resumen ejecutivo, el desarrollo, los acuerdos y la tabla de tareas; a la derecha el objetivo, los participantes, la agenda, los pendientes y la próxima reunión."),
  tabla(
    ["Botón", "Resultado"],
    [
      ["Word", "Documento .docx con la minuta. Si ya generó un visual, lo incluye al final."],
      ["PDF", "Abre el diálogo de impresión del navegador; elija “Guardar como PDF”. Solo se imprime el acta."],
      ["Markdown", "Archivo .md, útil para wikis, GitHub o Notion."],
      ["Copiar", "Copia la minuta en formato Markdown al portapapeles."],
    ],
    [20, 80],
  ),
  H2("2.4 Visuales"),
  P("En la pestaña **Visuales** elija el tipo. Cada visual se ajusta al espacio disponible de la pantalla."),
  tabla(
    ["Visual", "Descripción", "Opciones"],
    [
      ["Mapa mental", "Ideas clave organizadas en ramas de colores alrededor del tema central (lo resume la IA).", "PNG, SVG, Regenerar"],
      ["Infografía", "Póster vertical para compartir: título, frase clave, participantes, objetivo, cifras, bloques temáticos y “En resumen”.", "5 temas de color, foto y logo, textos editables con un clic, vista Completa o Ancho, PNG de 1800 px"],
      ["Flujo", "Proceso y decisiones de la reunión (lo diseña la IA).", "PNG, SVG, Regenerar, editar código Mermaid"],
      ["Responsables", "Quién hace qué y para cuándo (sin IA, directo de la minuta).", "PNG, SVG, editar código Mermaid"],
    ],
    [18, 52, 30],
  ),
  H2("2.5 Transcripción y regeneración"),
  P("La pestaña **Transcripción** muestra el texto reconocido. Puede corregir errores —por ejemplo, cambiar “Hablante 1” por el nombre real o arreglar una cifra mal reconocida— y presionar **Regenerar minuta**. También puede descargarla como .txt."),
  nota("Importante:", "la transcripción automática puede equivocarse con cifras, nombres propios y siglas. Revise los datos sensibles antes de compartir la minuta."),
  H2("2.6 Administración de usuarios (solo administradores)"),
  P("El botón **Usuarios** de la barra superior abre una pantalla con la lista de usuarios a la izquierda y el formulario a la derecha."),
  V("**Nuevo usuario:** usuario (minúsculas, números, punto o guion), nombre, perfil, minutas por día (0 = sin límite), tamaño máximo de archivo en MB (0 = hasta 2 GB) y contraseña (mínimo 8 caracteres). Al elegir el perfil se proponen sus límites."),
  V("**Editar:** cambiar nombre, perfil, límites, contraseña o desactivar el usuario. Desactivar corta su acceso de inmediato."),
  V("**Reiniciar uso de hoy** y **Eliminar**."),
  P("El administrador principal (`amezzi`) aparece fijo en la lista; su contraseña se administra en AWS (ver sección 6.4)."),
  H2("2.7 Mensajes frecuentes"),
  tabla(
    ["Mensaje", "Qué hacer"],
    [
      ["Usuario o contraseña incorrectos", "Verifique mayúsculas y espacios. Tras 8 intentos fallidos se bloquea 15 minutos."],
      ["Su sesión venció", "Recargue la página e inicie sesión de nuevo."],
      ["Se alcanzó el límite de N minutas por día", "Espere al día siguiente o pida a un administrador que lo amplíe o reinicie el uso."],
      ["Su usuario permite archivos de hasta N MB", "Use un archivo más pequeño (por ejemplo, solo el audio en MP3) o pida que amplíen el límite."],
      ["Formato no soportado", "Convierta el archivo a MP3, MP4, M4A o WAV."],
      ["La transcripción salió vacía", "El archivo no tiene voz audible o está dañado."],
      ["Las credenciales de AWS del servidor vencieron", "Avise al administrador (ver sección 6.4)."],
    ],
    [42, 58],
  ),
  H2("2.8 Recomendaciones para mejores resultados"),
  V("Grabe con un micrófono cercano y evite que varias personas hablen a la vez."),
  V("Pida a los participantes que se presenten al inicio: la IA usa esos nombres en la minuta."),
  V("Complete **Participantes** con nombre y cargo cuando los conozca."),
  V("Use **Indicaciones** para orientar la minuta (por ejemplo, “enfatizar los acuerdos de presupuesto”)."),
];

const arquitectura = [
  H1("3. Arquitectura"),
  P("Reu-X es una aplicación web Next.js que corre en un servidor EC2 dentro de la cuenta AWS de Amezzi Tech. El navegador sube las grabaciones directamente a S3; la aplicación orquesta Amazon Transcribe y Claude en Amazon Bedrock, y protege el acceso con usuarios y perfiles."),
  ...imagen("arquitectura.png", 624, 398, "Figura 1. Arquitectura de Reu-X en AWS (región us-west-1)."),
  ...imagen("flujo.png", 624, 250, "Figura 2. Flujo de procesamiento de una reunión."),
  H2("3.1 Servicios que intervienen"),
  tabla(
    ["Servicio", "Qué hace en Reu-X", "Detalle"],
    [
      ["Amazon EC2", "Ejecuta la aplicación web (Next.js) y el servidor HTTPS (Caddy).", "t4g.small (ARM, 2 vCPU, 2 GB + 2 GB swap), Amazon Linux 2023, disco 20 GB cifrado, IMDSv2."],
      ["IP elástica", "Dirección pública fija del servidor.", "50.18.10.41; el DNS apunta aquí."],
      ["Amazon S3", "Almacena grabaciones, transcripciones y el archivo de usuarios.", "Bucket privado y cifrado (AES-256). entradas/ y transcripciones/ se borran a los 7 días; config/usuarios.json se conserva."],
      ["Amazon Transcribe", "Convierte audio y video en texto.", "Detección de idioma (es-US, es-ES, en-US) y hasta 10 hablantes."],
      ["Amazon Bedrock", "Da acceso al modelo Claude que redacta la minuta y los visuales.", "us.anthropic.claude-sonnet-4-6 con salida estructurada (JSON validado)."],
      ["AWS IAM", "Permisos de la instancia.", "Rol con permisos mínimos: el bucket, Transcribe, Bedrock y /reux/* en Parameter Store."],
      ["SSM Parameter Store", "Guarda las credenciales del administrador principal y el secreto de sesión.", "/reux/usuario, /reux/clave (cifrada), /reux/secreto (cifrado)."],
      ["AWS Systems Manager", "Administración remota del servidor sin SSH.", "Run Command para publicar versiones y diagnosticar."],
      ["AWS CloudFormation", "Infraestructura como código.", "Stacks reu-x (almacenamiento) y reu-x-servidor (servidor)."],
      ["Grupo de seguridad (VPC)", "Firewall del servidor.", "Solo entran los puertos 80 y 443; no hay SSH abierto."],
    ],
    [20, 38, 42],
  ),
  espacio(),
  H3("Componentes fuera de AWS"),
  tabla(
    ["Componente", "Función"],
    [
      ["Caddy + Let's Encrypt", "Servidor web delante de la app; obtiene y renueva solo el certificado HTTPS."],
      ["DNS de amezzi.tech", "Registro A `reux` → 50.18.10.41, administrado en el panel del registrador .tech."],
      ["GitHub", "Repositorio del código; el servidor descarga de ahí cada versión."],
      ["Navegador", "Interfaz, subida directa a S3, dibujo de diagramas y exportación (Word, PNG, SVG)."],
    ],
    [30, 70],
  ),
  H2("3.2 Recorrido de una solicitud"),
  N("El usuario entra a **https://reux.amezzi.tech**. Caddy termina HTTPS y reenvía a la app en 127.0.0.1:3000.", "pasos3"),
  N("El **proxy** de Next.js valida la cookie de sesión (firmada con HMAC). Sin sesión, redirige a /acceso.", "pasos3"),
  N("Al generar una minuta con grabación, la app verifica perfil y límites (`/api/subir`) y entrega una **URL firmada** de S3 válida por 1 hora.", "pasos3"),
  N("El navegador sube el archivo **directo a S3** (no pasa por el servidor) mostrando el porcentaje.", "pasos3"),
  N("`/api/transcribir` inicia el trabajo en **Amazon Transcribe**; el navegador consulta `/api/transcribir/estado` cada 5 segundos.", "pasos3"),
  N("Al terminar, la app lee el JSON de S3 y lo convierte en texto “[mm:ss] Hablante N: …”.", "pasos3"),
  N("`/api/minuta` envía el texto a **Claude** en Bedrock con un esquema estricto; recibe la minuta en JSON validado y descuenta una minuta de la cuota del usuario.", "pasos3"),
  N("El navegador muestra el acta. Los visuales se piden bajo demanda a `/api/diagrama`.", "pasos3"),
  H2("3.3 Seguridad"),
  tabla(
    ["Tema", "Implementación"],
    [
      ["Acceso", "Pantalla de inicio de sesión; proxy que protege páginas y API. Perfiles verificados en cada llamada."],
      ["Sesiones", "Cookie httpOnly, SameSite=Lax y Secure, firmada con HMAC-SHA256 (secreto en Parameter Store); vence a las 12 h."],
      ["Contraseñas", "scrypt con sal aleatoria; comparación en tiempo constante. Mínimo 8 caracteres."],
      ["Fuerza bruta", "Máximo 8 intentos por IP cada 15 minutos."],
      ["Costos", "Límite diario de minutas y tamaño máximo de archivo por usuario."],
      ["Transporte", "HTTPS obligatorio, HSTS, nosniff y Referrer-Policy (Caddy)."],
      ["Datos", "S3 privado y cifrado; grabaciones y transcripciones se borran a los 7 días; subida con URL firmada de corta duración."],
      ["Servidor", "Sin SSH (administración por SSM), IMDSv2 obligatorio, rol IAM mínimo, disco cifrado."],
    ],
    [22, 78],
  ),
  nota("Pendiente sugerido:", "activar el versionado del bucket (o copias periódicas) para conservar historial de config/usuarios.json, y alarmas de CloudWatch para el servidor."),
];

const programador = [
  H1("4. Guía para programadores"),
  H2("4.1 Stack tecnológico"),
  tabla(
    ["Capa", "Tecnología"],
    [
      ["Framework", "Next.js 16 (App Router, Cache Components, proxy.ts) · React 19 · TypeScript 5"],
      ["Estilos", "Tailwind CSS 4 con tokens propios (globals.css) · IBM Plex Sans y Source Serif 4 · íconos Lucide"],
      ["IA", "@anthropic-ai/sdk y @anthropic-ai/bedrock-sdk · salida estructurada con Zod 4 (zodOutputFormat)"],
      ["AWS", "@aws-sdk/client-s3, s3-request-presigner, client-transcribe"],
      ["Visuales y exportación", "Mermaid 12 (flujo y responsables) · SVG propio (mapa mental) · html-to-image (infografía) · docx (Word)"],
      ["Servidor", "Node.js 24 · Caddy 2 · systemd · Amazon Linux 2023 ARM"],
    ],
    [25, 75],
  ),
  H2("4.2 Estructura del repositorio"),
  tabla(
    ["Ruta", "Contenido"],
    [
      ["app/page.tsx", "Página principal (monta components/ReuX)."],
      ["app/acceso/page.tsx", "Inicio de sesión."],
      ["app/admin/page.tsx", "Administración de usuarios."],
      ["app/api/*", "Rutas de la API (ver 4.3)."],
      ["proxy.ts", "Protección de páginas y API según la sesión y el perfil."],
      ["components/ReuX.tsx", "Flujo principal: carga, procesamiento y espacio de trabajo."],
      ["components/MinutaVista.tsx", "Acta en dos columnas (también es la vista de impresión)."],
      ["components/Visuales.tsx", "Selector y lienzo de visuales; exporta PNG/SVG y entrega la imagen al Word."],
      ["components/MapaMental.tsx", "Mapa mental en SVG puro con su propio algoritmo de distribución."],
      ["components/Infografia.tsx", "Infografía con temas, foto, logo y textos editables."],
      ["components/AdminUsuarios.tsx, BarraSuperior.tsx", "Administración y barra superior compartida."],
      ["lib/llm.ts", "Cliente de Claude (Bedrock, API de Anthropic o demo) y manejo de errores."],
      ["lib/esquemas.ts", "Esquemas Zod de minuta, mapa, infografía y flujo."],
      ["lib/usuarios.ts, lib/sesion.ts, lib/autorizacion.ts", "Usuarios, sesiones firmadas y verificación de permisos."],
      ["lib/aws.ts, lib/transcripcion.ts", "Clientes AWS, errores de credenciales y formato de Transcribe."],
      ["lib/exportar.ts, lib/mermaid.ts", "Word, Markdown, SVG→PNG y generación de código Mermaid."],
      ["infra/template.yaml", "Stack de almacenamiento: bucket y política IAM."],
      ["infra/servidor.yaml, infra/servidor/*", "Stack del servidor, instalación, servicios systemd, Caddyfile y actualización."],
      ["infra/publicar.sh", "Publica la última versión de GitHub en el servidor."],
      ["docs/", "Esta documentación y sus fuentes (diagramas y generador)."],
    ],
    [38, 62],
  ),
  H2("4.3 API"),
  tabla(
    ["Método y ruta", "Perfil", "Descripción"],
    [
      ["POST /api/acceso", "Público", "Inicia sesión (administrador principal o usuario registrado)."],
      ["DELETE /api/acceso", "Público", "Cierra sesión."],
      ["GET /api/yo", "Cualquiera", "Perfil y uso del día."],
      ["POST /api/subir", "Cualquiera", "Valida formato, tamaño y cuota; devuelve URL firmada de S3."],
      ["POST /api/transcribir", "Cualquiera", "Inicia el trabajo de Transcribe."],
      ["POST /api/transcribir/estado", "Cualquiera", "Estado del trabajo; al terminar, el texto por hablante."],
      ["POST /api/minuta", "Cualquiera", "Redacta la minuta con Claude; descuenta cuota."],
      ["POST /api/diagrama", "Cualquiera", "tipo = mapa | infografia | flujo; devuelve datos estructurados."],
      ["GET/POST /api/usuarios", "Administrador", "Lista y crea usuarios."],
      ["PATCH/DELETE /api/usuarios/[usuario]", "Administrador", "Edita (nombre, perfil, límites, clave, activo, reiniciar uso) o elimina."],
    ],
    [36, 17, 47],
  ),
  H2("4.4 Modelo de la minuta"),
  P("La respuesta de Claude se valida contra `MinutaSchema` (lib/esquemas.ts). Todos los campos son obligatorios; si la reunión no menciona algo, el modelo devuelve cadena o lista vacía."),
  tabla(
    ["Campo", "Tipo", "Contenido"],
    [
      ["titulo, fecha, hora, lugar", "texto", "Encabezado del acta (las fechas se escriben tal como se dijeron)."],
      ["participantes", "lista {nombre, rol}", "Personas identificadas; usa nombres reales cuando se presentan."],
      ["objetivo, resumen_ejecutivo", "texto", "Propósito y resumen de 3 a 6 oraciones."],
      ["agenda", "lista de texto", "Puntos tratados."],
      ["temas", "lista {titulo, resumen, puntos[]}", "Desarrollo en el orden de la reunión."],
      ["acuerdos", "lista de texto", "Decisiones del grupo."],
      ["tareas", "lista {tarea, responsable, fecha_limite}", "Compromisos; “Por definir” si no hay responsable."],
      ["pendientes, proxima_reunion", "lista / texto", "Temas abiertos y siguiente encuentro."],
    ],
    [30, 28, 42],
  ),
  H2("4.5 Integración con Claude"),
  V("`lib/llm.ts` elige el proveedor con `REUX_LLM`: **bedrock** (AnthropicBedrock, región us-west-1), **anthropic** (API directa con ANTHROPIC_API_KEY) o **demo** (respuestas fijas)."),
  V("Usa `messages.parse` con `output_config.format = zodOutputFormat(esquema)` y esfuerzo `medium`; `max_tokens` 16 000."),
  V("Controla `stop_reason` (refusal, max_tokens) y convierte errores (credenciales vencidas, formulario de caso de uso, acceso al modelo) en mensajes claros."),
  V("Los prompts de sistema están en `app/api/minuta/route.ts` y `app/api/diagrama/route.ts`: no inventar datos, no convertir fechas relativas y respetar límites de palabras."),
  nota("Modelo:", "la cuenta tiene habilitado Claude Sonnet 4.6. Para usar modelos más recientes (Opus 5.5, Sonnet 5.5) hay que solicitarlos a AWS y cambiar `REUX_BEDROCK_MODEL`."),
  H2("4.6 Usuarios y cuotas"),
  P("Los usuarios se guardan en `config/usuarios.json` del bucket. Cada escritura usa `If-Match` con el ETag (o `If-None-Match: *` al crear) y reintenta si otro proceso escribió en medio. La lectura tiene caché de 15 segundos."),
  P("El uso se cuenta por usuario y por día (zona America/Guatemala). La cuota se verifica antes de subir y de redactar, y se descuenta al completar una minuta."),
  H2("4.7 Variables de entorno"),
  tabla(
    ["Variable", "Uso"],
    [
      ["REUX_AWS_REGION", "Región AWS (us-west-1)."],
      ["REUX_BUCKET", "Bucket de reuniones (reu-x-937509584902-us-west-1)."],
      ["REUX_LLM", "bedrock | anthropic | demo."],
      ["REUX_BEDROCK_MODEL", "Modelo de Bedrock (us.anthropic.claude-sonnet-4-6)."],
      ["ANTHROPIC_API_KEY, REUX_MODEL", "Solo con REUX_LLM=anthropic."],
      ["REUX_USUARIO, REUX_CLAVE, REUX_SECRETO", "Activan el acceso. Sin ellas (desarrollo local) la app queda abierta."],
      ["AWS_PROFILE", "Perfil de AWS CLI en local (reux)."],
    ],
    [38, 62],
  ),
  H2("4.8 Desarrollo local"),
  ...codigo([
    "aws login --profile reux        # credenciales temporales de AWS",
    "npm install",
    "cp .env.example .env.local      # y ajustar REUX_BUCKET / REUX_LLM",
    "npm run dev                     # http://localhost:3000",
    "npx eslint . && npx tsc --noEmit && npm run build",
  ]),
  V("Sin REUX_USUARIO/REUX_CLAVE/REUX_SECRETO la app no pide contraseña y actúa como administrador."),
  V("En Git Bash use `MSYS_NO_PATHCONV=1` con rutas de Parameter Store y `PYTHONUTF8=1` para la salida de la CLI."),
  V("Convención del proyecto: textos e identificadores en español; cada cambio se confirma y se sube a GitHub (rama main)."),
];

const operacion = [
  H1("5. Infraestructura"),
  H2("5.1 Stacks de CloudFormation"),
  tabla(
    ["Stack", "Plantilla", "Recursos"],
    [
      ["reu-x", "infra/template.yaml", "Bucket S3 (privado, cifrado, CORS para localhost:3000 y reux.amezzi.tech, ciclo de vida 7 días en entradas/ y transcripciones/) y política IAM reu-x-app-us-west-1."],
      ["reu-x-servidor", "infra/servidor.yaml", "Grupo de seguridad, rol e instancia de perfil IAM, instancia EC2 con UserData que instala todo, e IP elástica."],
    ],
    [18, 24, 58],
  ),
  H2("5.2 Servidor"),
  tabla(
    ["Elemento", "Detalle"],
    [
      ["Código", "/opt/reux (clon de GitHub; usuario de sistema reux)."],
      ["reux-entorno.service", "Al arrancar, lee /reux/* de Parameter Store y escribe /etc/reux/reux.env (solo root)."],
      ["reux.service", "next start en 127.0.0.1:3000; se reinicia solo si falla."],
      ["caddy.service", "HTTPS para el dominio de /etc/reux/config; certificados en /var/lib/caddy."],
      ["/etc/reux/config", "Dominio, región, bucket, proveedor y modelo (escrito por el UserData)."],
      ["instalar.sh / actualizar.sh", "Instalación inicial (swap, Node, Caddy, servicios) y publicación de versiones."],
    ],
    [28, 72],
  ),
  H1("6. Operación"),
  H2("6.1 Publicar una nueva versión"),
  ...codigo(["git push origin main", "bash infra/publicar.sh"]),
  P("`publicar.sh` envía por Systems Manager la orden `actualizar.sh`: `git pull`, `npm ci`, `npm run build`, actualización de servicios y reinicio. Tarda de 3 a 6 minutos y muestra la versión publicada."),
  H2("6.2 Ver el estado y los registros"),
  ...codigo([
    "MSYS_NO_PATHCONV=1 aws ssm send-command --profile reux --region us-west-1 \\",
    "  --instance-ids i-04e736c2ec0a3b17d --document-name AWS-RunShellScript \\",
    "  --parameters 'commands=[\"systemctl status reux caddy --no-pager\",\"journalctl -u reux -n 50 --no-pager\"]'",
  ]),
  P("Luego lea el resultado con `aws ssm get-command-invocation` o en la consola de AWS: Systems Manager → Run Command. También puede abrir una terminal con **Session Manager** desde la consola de EC2."),
  H2("6.3 Renovar la sesión de AWS en su computadora"),
  ...codigo(["aws login --profile reux"]),
  P("Las credenciales de `aws login` son temporales. El servidor no depende de ellas: usa su propio rol IAM."),
  H2("6.4 Contraseña del administrador principal"),
  ...codigo([
    "# Ver",
    "aws ssm get-parameter --profile reux --region us-west-1 --name /reux/clave --with-decryption --query Parameter.Value --output text",
    "# Cambiar (y luego publicar o reiniciar para que se cargue)",
    "aws ssm put-parameter --profile reux --region us-west-1 --name /reux/clave --type SecureString --overwrite --value \"NuevaContraseña\"",
    "bash infra/publicar.sh",
  ]),
  H2("6.5 Otras tareas"),
  tabla(
    ["Tarea", "Cómo"],
    [
      ["Cambiar el modelo de IA", "Actualizar REUX_BEDROCK_MODEL en /etc/reux/config del servidor (o el parámetro ModeloBedrock del stack) y reiniciar reux-entorno y reux."],
      ["Agregar otro dominio", "Registro A hacia 50.18.10.41, añadirlo en Caddyfile y en OrigenesPermitidos del stack reu-x."],
      ["Más capacidad", "Cambiar TipoInstancia (por ejemplo t4g.medium) en el stack reu-x-servidor."],
      ["Retención de archivos", "Parámetro DiasRetencion del stack reu-x."],
      ["Apagar el servicio", "Detener la instancia EC2 (sigue cobrando la IP elástica y el disco)."],
    ],
    [28, 72],
  ),
  H2("6.6 Costos estimados (mensuales)"),
  tabla(
    ["Concepto", "Estimado (USD)", "Notas"],
    [
      ["EC2 t4g.small", "≈ 12.30", "Encendida 24/7."],
      ["Disco EBS 20 GB gp3", "≈ 1.60", ""],
      ["IPv4 pública (IP elástica)", "≈ 3.60", ""],
      ["S3", "< 1", "Los archivos se borran a los 7 días."],
      ["Amazon Transcribe", "≈ 0.024 por minuto de audio", "Una reunión de 1 h ≈ 1.44."],
      ["Claude Sonnet 4.6 (Bedrock)", "≈ 0.03 – 0.10 por minuta", "Según la duración; cada visual suma un costo similar o menor."],
      ["Total fijo aproximado", "≈ 18 + uso", ""],
    ],
    [36, 28, 36],
  ),
  nota("Referencia:", "precios aproximados de la región us-west-1; confirme en la calculadora de AWS."),
  H2("6.7 Limitaciones conocidas y mejoras sugeridas"),
  V("Un solo servidor: si se detiene, el servicio se interrumpe. Para alta disponibilidad, migrar a ECS/Fargate o App Runner con balanceador."),
  V("Modelos más recientes de Claude no habilitados aún en la cuenta (solicitud a AWS)."),
  V("La transcripción puede equivocarse en cifras y nombres; la revisión humana sigue siendo necesaria."),
  V("Usuarios en un archivo JSON: adecuado para decenas o cientos de usuarios; para más, migrar a DynamoDB o Amazon Cognito."),
  V("Sin monitoreo automático ni copias del archivo de usuarios: agregar alarmas de CloudWatch y versionado del bucket."),
  V("La cuota se cuenta por minutas; los visuales no consumen cuota."),
  H1("7. Referencias"),
  tabla(
    ["Recurso", "Ubicación"],
    [
      ["Aplicación", "https://reux.amezzi.tech"],
      ["Código fuente", "https://github.com/epinedaWorks/Reu-X-AmezziTech"],
      ["README del repositorio", "Puesta en marcha, producción y perfiles."],
      ["Cuenta AWS", "937509584902 · us-west-1 · perfil de CLI reux"],
      ["Instancia", "i-04e736c2ec0a3b17d · IP 50.18.10.41"],
      ["Fuentes de este documento", "docs/fuentes/diagramas.py y docs/fuentes/generar-documento.mjs"],
    ],
    [30, 70],
  ),
  H2("Glosario"),
  tabla(
    ["Término", "Significado"],
    [
      ["Minuta / acta", "Registro formal de lo tratado y acordado en una reunión."],
      ["Bedrock", "Servicio de AWS para usar modelos de IA de distintos proveedores, como Claude."],
      ["Salida estructurada", "Respuesta del modelo obligada a seguir un esquema JSON, validada antes de usarse."],
      ["URL firmada", "Enlace temporal que autoriza una sola operación sobre S3 sin exponer credenciales."],
      ["Stack", "Conjunto de recursos de AWS creado y actualizado desde una plantilla de CloudFormation."],
      ["Mermaid", "Lenguaje de texto para describir diagramas que el navegador dibuja."],
    ],
    [26, 74],
  ),
];

// ───────── documento ─────────

const vinetas = { reference: "vinetas", levels: [0, 1].map((level) => ({ level, format: LevelFormat.BULLET, text: level ? "–" : "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360 + level * 360, hanging: 260 } } } })) };
const numeradas = (reference) => ({ reference, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 300 } } } }] });

const doc = new Document({
  creator: "Amezzi Tech",
  title: "Reu-X · Documentación técnica y de usuario",
  description: "Documentación de Reu-X",
  styles: {
    default: { document: { run: { font: "Calibri", size: 21, color: "1F2733" } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Georgia", size: 36, bold: true, color: MARCA }, paragraph: { spacing: { before: 120, after: 200 }, outlineLevel: 0, keepNext: true, keepLines: true, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: MARCA, space: 6 } } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Calibri", size: 27, bold: true, color: MARCA }, paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1, keepNext: true, keepLines: true } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Calibri", size: 23, bold: true, color: ACENTO }, paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2, keepNext: true, keepLines: true } },
    ],
  },
  numbering: { config: [vinetas, numeradas("pasos"), numeradas("pasos2"), numeradas("pasos3")] },
  sections: [
    {
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }, titlePage: true },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              tabStops: [{ type: TabStopType.RIGHT, position: ANCHO }],
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDE, space: 4 } },
              children: [new TextRun({ text: "Reu-X · Documentación técnica y de usuario", size: 17, color: TENUE }), new TextRun({ text: "\tAmezzi Tech", size: 17, color: MARCA, bold: true })],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Página ", size: 17, color: TENUE }), new TextRun({ children: [PageNumber.CURRENT], size: 17, color: TENUE }), new TextRun({ text: " de ", size: 17, color: TENUE }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 17, color: TENUE })],
            }),
          ],
        }),
      },
      children: [...portada(), ...resumen, ...usuario, ...arquitectura, ...programador, ...operacion],
    },
  ],
});

fs.writeFileSync(SALIDA, await Packer.toBuffer(doc));
console.log("Generado:", SALIDA);
