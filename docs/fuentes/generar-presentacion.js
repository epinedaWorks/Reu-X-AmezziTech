// Genera docs/Reu-X_Servicios_AWS.pptx: los servicios de Reu-X y cómo se conectan.
//
// Requiere pptxgenjs (no es dependencia del proyecto). Por ejemplo:
//   npm install --prefix /tmp/pptx pptxgenjs@3.12.0
//   NODE_PATH=/tmp/pptx/node_modules node docs/fuentes/generar-presentacion.js [salida.pptx] [apply_theme.js]
const path = require("path");
const fs = require("fs");
const pptxgen = require("pptxgenjs");

const AQUI = __dirname;
const DOCS = path.join(AQUI, "..");
const SALIDA = process.argv[2] ? path.resolve(process.argv[2]) : path.join(DOCS, "Reu-X_Servicios_AWS.pptx");
const APLICAR_TEMA = process.argv[3];

const THEME = {
  name: "Reu-X",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1F2733", lt1: "FFFFFF", dk2: "1B2A41", lt2: "EEF1F5",
    accent1: "1B2A41", accent2: "9A7B4F", accent3: "E8890C", accent4: "2F6B4F", accent5: "0E7C86", accent6: "A23B3B",
    hlink: "1F5FAD", folHlink: "6B4FA0",
  },
};
// Colores en hexadecimal solo donde la librería no acepta colores del tema (sombras, cuadrículas de gráficos).
const HEX = THEME.colors;

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 × 7.5 in
pres.title = "Reu-X · Servicios y conexiones en AWS";
pres.author = "Ing. Erick J. Pineda Amézquita";
pres.company = "Amezzi Tech";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;

const W = 13.333;
const M = 0.6;
const icono = (n) => path.join(AQUI, "iconos", `${n}.png`);
const img = (n) => path.join(DOCS, n);
// Proporción ancho/alto de los íconos que no son cuadrados.
const PROPORCION = { caddy: 256 / 84 };

// ───────── diseños (layouts) ─────────
const pie = (oscuro) => [
  { text: { text: "Reu-X · Servicios y conexiones en AWS · Amezzi Tech", options: { x: M, y: 7.0, w: 8, h: 0.3, fontSize: 10, color: oscuro ? C.background2 : C.text1, transparency: 30, margin: 0 } } },
];
pres.defineSlideMaster({
  title: "PORTADA",
  background: { color: HEX.dk2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 2.2, w: 11.5, h: 1.6, fontFace: THEME.headFontFace, fontSize: 54, bold: true, color: C.background1, valign: "bottom", align: "left", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: M, y: 3.95, w: 11.5, h: 1.0, fontSize: 22, color: C.background2, valign: "top", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "SECCION",
  background: { color: HEX.dk2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 2.9, w: 11.5, h: 1.2, fontFace: THEME.headFontFace, fontSize: 44, bold: true, color: C.background1, valign: "middle", align: "left", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: M, y: 4.15, w: 11.5, h: 0.9, fontSize: 20, color: C.background2, valign: "top", margin: 0 }, text: "" } },
    ...pie(true),
  ],
  slideNumber: { x: 12.2, y: 7.0, w: 0.6, h: 0.3, fontSize: 10, color: HEX.lt2, align: "right" },
});
pres.defineSlideMaster({
  title: "CONTENIDO",
  background: { color: HEX.lt1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 0.35, w: W - 2 * M, h: 0.85, fontFace: THEME.headFontFace, fontSize: 32, bold: true, color: C.text2, valign: "middle", align: "left", margin: 0 }, text: "" } },
    ...pie(false),
  ],
  slideNumber: { x: 12.2, y: 7.0, w: 0.6, h: 0.3, fontSize: 10, color: HEX.dk1, align: "right" },
});

let seccionActual = "Inicio";
function nueva(masterName, titulo, notas) {
  const s = pres.addSlide({ masterName, sectionTitle: seccionActual });
  if (titulo) s.addText(titulo, { placeholder: "title" });
  if (notas) s.addNotes(notas);
  return s;
}
function seccion(titulo, subtitulo, notas) {
  seccionActual = titulo;
  pres.addSection({ title: titulo });
  const s = nueva("SECCION", titulo, notas);
  s.addText(subtitulo, { placeholder: "body" });
  return s;
}

// ───────── piezas reutilizables ─────────
const sombra = () => ({ type: "outer", color: "1B2A41", opacity: 0.12, blur: 6, offset: 2, angle: 90 });

function tarjeta(s, x, y, w, h, { titulo, texto, ic, nombre }) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: C.background2 }, line: { color: C.background2 }, shadow: sombra(), objectName: nombre || `tarjeta ${titulo}` });
  let tx = x + 0.25;
  if (ic) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.25, y: y + 0.25, w: 0.75, h: 0.75, rectRadius: 0.1, fill: { color: C.background1 }, line: { color: C.background1 }, objectName: `fondo icono ${titulo}` });
    s.addImage({ path: icono(ic), x: x + 0.32, y: y + 0.32, w: 0.61, h: 0.61, objectName: `icono ${titulo}` });
    tx = x + 1.2;
  }
  s.addText(titulo, { x: tx, y: y + 0.2, w: x + w - tx - 0.2, h: 0.5, fontSize: 17, bold: true, color: C.text2, margin: 0, valign: "middle", isTextBox: true });
  const ty = ic ? y + 1.15 : y + 0.75;
  s.addText(texto, { x: x + 0.25, y: ty, w: w - 0.5, h: y + h - ty - 0.15, fontSize: 14, color: C.text1, margin: 0, valign: "top", isTextBox: true, paraSpaceAfter: 4 });
}

function vinetas(s, items, x, y, w, h, tam = 16) {
  s.addText(
    items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1 } })),
    { x, y, w, h, fontSize: tam, color: C.text1, valign: "top", paraSpaceAfter: 8, margin: 0, isTextBox: true },
  );
}

function imagenAjustada(s, archivo, px, py, x, y, maxW, maxH, nombre) {
  const r = Math.min(maxW / px, maxH / py);
  const w = px * r, h = py * r;
  s.addImage({ path: img(archivo), x: x + (maxW - w) / 2, y: y + (maxH - h) / 2, w, h, objectName: nombre });
}

function servicioCabecera(s, ic, rol) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 1.45, w: 1.6, h: 1.6, rectRadius: 0.15, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: "fondo icono servicio" });
  const pr = PROPORCION[ic] || 1;
  const iw = pr > 1 ? 1.3 : 1.1, ih = iw / pr;
  s.addImage({ path: icono(ic), x: M + 0.8 - iw / 2, y: 2.25 - ih / 2, w: iw, h: ih, objectName: "icono servicio" });
  s.addText(rol, { x: 2.5, y: 1.45, w: 10.2, h: 1.6, fontSize: 20, italic: true, color: C.text2, valign: "middle", margin: 0, isTextBox: true });
}

// Franja inferior con los servicios relacionados.
function seConectaCon(s, lista) {
  if (!lista) return;
  const y = 5.95;
  s.addText("Se conecta con", { x: M, y: y + 0.12, w: 1.9, h: 0.5, fontSize: 15, bold: true, color: C.accent2, margin: 0, valign: "middle", isTextBox: true });
  lista.forEach(([ic, etiqueta], i) => {
    const x = 2.55 + i * 2.05;
    const pr = PROPORCION[ic] || 1;
    const iw = pr > 1 ? 0.75 : 0.55, ih = iw / pr;
    s.addImage({ path: icono(ic), x, y: y + 0.39 - ih / 2, w: iw, h: ih, objectName: `conexión ${etiqueta}` });
    s.addText(etiqueta, { x: x + iw + 0.1, y: y + 0.12, w: 2.05 - iw - 0.2, h: 0.55, fontSize: 13, color: C.text1, margin: 0, valign: "middle", isTextBox: true });
  });
}
const CONEXIONES = {
  ec2: [["usuarios", "Usuarios"], ["s3", "S3"], ["transcribe", "Transcribe"], ["bedrock", "Bedrock"], ["parameter-store", "Parameter Store"]],
  caddy: [["usuarios", "Usuarios"], ["lets-encrypt", "Let's Encrypt"], ["nextjs", "App Next.js"], ["dns", "DNS amezzi.tech"]],
  s3: [["usuarios", "Navegador"], ["ec2", "App (EC2)"], ["transcribe", "Transcribe"], ["iam", "IAM"]],
  transcribe: [["ec2", "App (EC2)"], ["s3", "S3"], ["iam", "IAM"]],
  bedrock: [["ec2", "App (EC2)"], ["iam", "IAM"]],
  "parameter-store": [["ec2", "Servidor"], ["iam", "IAM"]],
  iam: [["ec2", "EC2"], ["s3", "S3"], ["transcribe", "Transcribe"], ["bedrock", "Bedrock"], ["parameter-store", "Parameter Store"]],
  "systems-manager": [["desarrollador", "Desarrollador"], ["ec2", "Servidor"], ["github", "GitHub"]],
  cloudformation: [["s3", "S3"], ["iam", "IAM"], ["ec2", "EC2"], ["vpc", "Red"]],
  vpc: [["ec2", "EC2"], ["internet-gateway", "Gateway"], ["dns", "DNS"], ["usuarios", "Usuarios"]],
};

function datoGrande(s, x, y, w, valor, etiqueta, color, tam = 48) {
  s.addText(valor, { x, y, w, h: 1.0, fontSize: tam, bold: true, color: color || C.accent2, fontFace: THEME.headFontFace, margin: 0, isTextBox: true });
  s.addText(etiqueta, { x, y: y + 1.0, w, h: 0.7, fontSize: 14, color: C.text1, margin: 0, valign: "top", isTextBox: true });
}

function flujoPasos(s, pasos, y, alto = 1.5) {
  const n = pasos.length, sep = 0.35;
  const w = (W - 2 * M - sep * (n - 1)) / n;
  pasos.forEach((p, i) => {
    const x = M + i * (w + sep);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: alto, rectRadius: 0.1, fill: { color: i % 2 ? C.background2 : C.background2 }, line: { color: C.accent1, width: 1.25 }, objectName: `paso ${i + 1}` });
    s.addText(String(i + 1), { x: x + 0.15, y: y + 0.12, w: 0.45, h: 0.45, fontSize: 14, bold: true, color: C.background1, fill: { color: C.accent2 }, align: "center", valign: "middle", margin: 0, shape: pres.shapes.OVAL, isTextBox: true });
    s.addText(p.t, { x: x + 0.15, y: y + 0.65, w: w - 0.3, h: 0.4, fontSize: 15, bold: true, color: C.text2, margin: 0, isTextBox: true });
    s.addText(p.d, { x: x + 0.15, y: y + 1.05, w: w - 0.3, h: alto - 1.15, fontSize: 13, color: C.text1, margin: 0, valign: "top", isTextBox: true });
    if (i < n - 1) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + w + 0.05, y: y + alto / 2 - 0.13, w: 0.26, h: 0.26, fill: { color: C.accent2 }, line: { color: C.accent2 }, objectName: `flecha ${i + 1}` });
  });
}

function tabla(s, encabezados, filas, x, y, w, anchos, tam = 13) {
  const total = anchos.reduce((a, b) => a + b, 0);
  const colW = anchos.map((a) => (a / total) * w);
  const enc = encabezados.map((e) => ({ text: e, options: { bold: true, color: C.background1, fill: { color: C.accent1 }, fontSize: tam } }));
  const cuerpo = filas.map((f, i) => f.map((c) => ({ text: c, options: { fontSize: tam, color: C.text1, fill: { color: i % 2 ? C.background1 : C.background2 } } })));
  s.addTable([enc, ...cuerpo], { x, y, w, colW, border: { type: "solid", pt: 0.75, color: "C9D0DA" }, margin: [0.05, 0.1, 0.05, 0.1], valign: "middle" });
}

// ═════════════════════ DIAPOSITIVAS ═════════════════════

// 1. Portada
pres.addSection({ title: "Inicio" });
{
  const s = nueva("PORTADA", "Reu-X", "Bienvenida. Esta presentación explica qué servicios de AWS usa Reu-X, qué hace cada uno y cómo se conectan entre sí para convertir una reunión en una minuta formal.");
  s.addText("Servicios y conexiones en AWS", { placeholder: "body" });
  s.addText([{ text: "Amezzi ", options: { bold: true, color: C.background1 } }, { text: "Tech", options: { bold: true, color: C.accent2 } }], { x: M, y: 5.9, w: 6, h: 0.45, fontSize: 22, margin: 0, isTextBox: true });
  s.addText("by Ing. Erick J. Pineda Amézquita · https://reux.amezzi.tech", { x: M, y: 6.35, w: 9, h: 0.4, fontSize: 14, color: C.background2, margin: 0, isTextBox: true });
  ["s3", "transcribe", "bedrock", "ec2"].forEach((n, i) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.75 + i * 1.05, y: 0.6, w: 0.9, h: 0.9, rectRadius: 0.1, fill: { color: C.background1 }, line: { color: C.background1 }, objectName: `fondo portada ${n}` });
    s.addImage({ path: icono(n), x: 8.85 + i * 1.05, y: 0.7, w: 0.7, h: 0.7, objectName: `icono portada ${n}` });
  });
}

// 2. Agenda
{
  const s = nueva("CONTENIDO", "Agenda", "Recorrido de la presentación: primero el contexto, luego cada servicio por separado, después cómo se conectan paso a paso, y por último seguridad, operación y costos.");
  const items = [
    ["01", "Contexto", "El problema, qué hace Reu-X y la arquitectura general"],
    ["02", "Los servicios", "Qué hace cada servicio de AWS y cómo está configurado"],
    ["03", "Cómo se conectan", "El recorrido de una reunión, de la grabación a la minuta"],
    ["04", "Seguridad y operación", "Acceso, permisos, credenciales y publicación"],
    ["05", "Costos y próximos pasos", "Cuánto cuesta, límites y mejoras"],
  ];
  items.forEach(([n, t, d], i) => {
    const y = 1.5 + i * 1.05;
    s.addText(n, { x: M, y, w: 1.0, h: 0.8, fontSize: 32, bold: true, color: C.accent2, fontFace: THEME.headFontFace, margin: 0, valign: "middle", isTextBox: true });
    s.addText(t, { x: 1.8, y, w: 4.2, h: 0.8, fontSize: 22, bold: true, color: C.text2, margin: 0, valign: "middle", isTextBox: true });
    s.addText(d, { x: 6.1, y, w: 6.6, h: 0.8, fontSize: 16, color: C.text1, margin: 0, valign: "middle", isTextBox: true });
  });
}

// ───── Sección 1: Contexto
seccion("Contexto", "El problema y la solución en una mirada", "Empezamos por el problema que resuelve Reu-X y la arquitectura general.");

{
  const s = nueva("CONTENIDO", "El problema: documentar reuniones toma tiempo", "Redactar una minuta a mano suele tomar más tiempo que la propia reunión y depende de que alguien tome buenas notas. Reu-X automatiza ese trabajo: la persona solo revisa y comparte.");
  datoGrande(s, M, 1.7, 3.6, "1–2 h", "para redactar a mano la minuta de una reunión de una hora", C.accent6);
  datoGrande(s, 4.6, 1.7, 3.6, "≈ 1 min", "de redacción automática una vez transcrito el audio", C.accent4);
  datoGrande(s, 8.6, 1.7, 3.9, "6 formatos", "minuta Word/PDF/Markdown, mapa mental, infografía y diagramas", C.accent2);
  vinetas(s, [
    "Las notas manuales pierden acuerdos, responsables y fechas",
    "Cada persona redacta con un formato distinto",
    "Compartir la información visualmente requiere otra herramienta",
  ], M, 4.55, 12, 2.0, 16);
}

{
  const s = nueva("CONTENIDO", "Qué hace Reu-X", "Entrada: una grabación o texto. Proceso: transcripción y redacción con IA. Salida: minuta formal y visuales. Todo ocurre dentro de la cuenta de AWS de Amezzi Tech.");
  tarjeta(s, M, 1.5, 3.85, 4.9, { titulo: "Entrada", ic: "usuarios", texto: "Grabación de audio o video (MP3, MP4, M4A, WAV…, hasta 2 GB)\n\nO texto: transcripción, notas o chat\n\nDatos opcionales: título, fecha, lugar, participantes" });
  tarjeta(s, 4.74, 1.5, 3.85, 4.9, { titulo: "Proceso", ic: "bedrock", texto: "Voz a texto con identificación de hablantes\n\nRedacción con Claude: temas, acuerdos, tareas y responsables\n\nSalida estructurada y validada" });
  tarjeta(s, 8.88, 1.5, 3.85, 4.9, { titulo: "Salida", ic: "s3", texto: "Minuta formal en Word, PDF o Markdown\n\nMapa mental, infografía, diagrama de flujo y de responsables\n\nTranscripción editable" });
}

{
  const s = nueva("CONTENIDO", "Principios de diseño", "Cuatro decisiones guían la arquitectura. Todo en AWS para tener una sola factura y cuenta; la grabación no pasa por el servidor; la IA responde en un formato estricto; y la seguridad está en cada capa.");
  const p = [
    ["ec2", "Todo en AWS", "Una sola cuenta y región (us-west-1): cómputo, almacenamiento, voz e IA"],
    ["s3", "Archivos directo a S3", "El navegador sube la grabación con una URL firmada; el servidor no carga el video"],
    ["bedrock", "IA con formato estricto", "Claude devuelve JSON validado contra un esquema, no texto libre"],
    ["iam", "Seguridad por capas", "HTTPS, sesión firmada, perfiles, cuotas y permisos mínimos"],
  ];
  p.forEach(([ic, t, d], i) => tarjeta(s, M + (i % 2) * 6.17, 1.5 + Math.floor(i / 2) * 2.55, 5.9, 2.3, { titulo: t, ic, texto: d }));
}

{
  const s = nueva("CONTENIDO", "Arquitectura general en AWS", "Vista completa: usuarios fuera de AWS, la instancia EC2 dentro de una VPC con su grupo de seguridad, y los servicios regionales S3, Transcribe, Bedrock, Parameter Store, Systems Manager, IAM y CloudFormation. Los números indican los flujos principales que veremos en detalle.");
  imagenAjustada(s, "Reu-X_Arquitectura_AWS.png", 3150, 1950, M, 1.3, W - 2 * M, 5.55, "diagrama arquitectura AWS");
}

// ───── Sección 2: Los servicios
seccion("Los servicios", "Qué hace cada servicio de AWS en Reu-X", "Ahora vemos cada servicio por separado: su papel, cómo está configurado y por qué se eligió.");

{
  const s = nueva("CONTENIDO", "Mapa de servicios", "Diez piezas en total. Seis son servicios de AWS que la app usa directamente; las demás sostienen la plataforma: red, permisos, administración e infraestructura como código.");
  const servicios = [
    ["ec2", "EC2", "ejecuta la app"],
    ["s3", "S3", "guarda archivos"],
    ["transcribe", "Transcribe", "voz a texto"],
    ["bedrock", "Bedrock", "IA (Claude)"],
    ["parameter-store", "Parameter Store", "credenciales"],
    ["iam", "IAM", "permisos"],
    ["systems-manager", "Systems Manager", "administración"],
    ["cloudformation", "CloudFormation", "infraestructura"],
    ["vpc", "VPC", "red privada"],
    ["caddy", "Caddy + Let's Encrypt", "HTTPS"],
  ];
  servicios.forEach(([ic, t, d], i) => {
    const x = M + (i % 5) * 2.45, y = 1.55 + Math.floor(i / 5) * 2.6;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 2.2, h: 2.3, rectRadius: 0.12, fill: { color: C.background2 }, line: { color: C.background2 }, shadow: sombra(), objectName: `servicio ${t}` });
    const ancho = ic === "caddy" ? 1.6 : 1.0;
    const alto = ic === "caddy" ? 0.53 : 1.0;
    s.addImage({ path: icono(ic), x: x + (2.2 - ancho) / 2, y: y + 0.25 + (1.0 - alto) / 2, w: ancho, h: alto, objectName: `icono ${t}` });
    s.addText(t, { x: x + 0.1, y: y + 1.35, w: 2.0, h: 0.45, fontSize: 15, bold: true, color: C.text2, align: "center", margin: 0, isTextBox: true });
    s.addText(d, { x: x + 0.1, y: y + 1.78, w: 2.0, h: 0.35, fontSize: 13, color: C.text1, align: "center", margin: 0, isTextBox: true });
  });
}

const fichas = [
  {
    ic: "ec2", t: "Amazon EC2: el servidor de la aplicación", rol: "Ejecuta la aplicación web Next.js y el servidor HTTPS. Es el único componente que “orquesta” a los demás servicios.",
    izq: ["Instancia t4g.small (ARM Graviton, 2 vCPU, 2 GB + 2 GB de swap)", "Amazon Linux 2023 · Node.js 24 · disco gp3 de 20 GB cifrado", "IP elástica fija: 50.18.10.41", "IMDSv2 obligatorio y sin acceso SSH"],
    der: ["Corre dos servicios systemd: reux (Next.js) y caddy (HTTPS)", "Se instala solo al crearse (UserData)", "Usa un rol IAM: sus credenciales se renuevan solas"],
    notas: "EC2 es la máquina virtual donde vive Reu-X. Elegimos una instancia ARM pequeña porque el trabajo pesado lo hacen Transcribe y Bedrock; el servidor solo coordina. Sin SSH: se administra con Systems Manager.",
  },
  {
    ic: "caddy", t: "Caddy y Let's Encrypt: HTTPS automático", rol: "Recibe todo el tráfico de internet por HTTPS y lo reenvía a la aplicación en el puerto 3000.",
    izq: ["Obtiene y renueva el certificado de Let's Encrypt sin intervención", "Redirige HTTP → HTTPS", "Agrega encabezados de seguridad: HSTS, nosniff, Referrer-Policy"],
    der: ["Configuración en infra/servidor/Caddyfile", "El dominio se lee de /etc/reux/config", "Certificado vigente hasta enero de 2027, renovación automática"],
    notas: "Caddy es el portero del servidor. Gracias a él la app tiene HTTPS sin configurar certificados a mano. Solo necesitó que el registro DNS reux.amezzi.tech apuntara a la IP elástica.",
  },
  {
    ic: "s3", t: "Amazon S3: almacenamiento de archivos", rol: "Guarda las grabaciones, las transcripciones y el archivo de usuarios en un bucket privado y cifrado.",
    izq: ["Bucket reu-x-937509584902-us-west-1", "entradas/ → grabaciones (se borran a los 7 días)", "transcripciones/ → JSON de Transcribe (7 días)", "config/usuarios.json → usuarios y perfiles (se conserva)"],
    der: ["Cifrado AES-256 y acceso público bloqueado", "CORS: solo localhost:3000 y reux.amezzi.tech pueden subir", "Subida con URL firmada válida 1 hora"],
    notas: "S3 es el disco de la solución. La regla de ciclo de vida borra las grabaciones a los 7 días para no acumular datos sensibles ni costos. El archivo de usuarios usa escrituras condicionales para evitar conflictos.",
  },
  {
    ic: "transcribe", t: "Amazon Transcribe: voz a texto", rol: "Convierte el audio o video en texto e identifica quién habla en cada momento.",
    izq: ["Detecta el idioma: español (EE. UU. y España) e inglés", "Separa hasta 10 hablantes", "Lee el archivo directamente desde S3", "Escribe el resultado en JSON en S3"],
    der: ["Trabajo asíncrono: la app lo inicia y consulta su estado cada 5 s", "Tarda ≈ 25–50 % de la duración del audio", "Costo ≈ US$0.024 por minuto de audio"],
    notas: "Transcribe hace el trabajo de reconocimiento de voz. La app no descarga el audio: le indica a Transcribe dónde está en S3 y dónde dejar el resultado. Luego formatea el JSON por hablante.",
  },
  {
    ic: "bedrock", t: "Amazon Bedrock y Claude: la redacción", rol: "Da acceso al modelo Claude Sonnet 4.6, que redacta la minuta y diseña los visuales.",
    izq: ["Perfil de inferencia us.anthropic.claude-sonnet-4-6", "Salida estructurada: JSON validado con esquemas Zod", "Instrucciones: no inventar datos, no convertir fechas relativas", "Esfuerzo medio · hasta 16 000 tokens de salida"],
    der: ["Una llamada para la minuta y una por cada visual", "Errores traducidos a mensajes claros (credenciales, acceso al modelo)", "Proveedor intercambiable: Bedrock, API de Anthropic o demo"],
    notas: "Bedrock es el puente hacia Claude dentro de AWS: la facturación queda en la misma cuenta. La clave es la salida estructurada: Claude no devuelve texto libre sino un JSON con campos fijos, que la app valida antes de mostrar.",
  },
  {
    ic: "parameter-store", t: "SSM Parameter Store: credenciales", rol: "Guarda, cifrados, el usuario y la contraseña del administrador principal y el secreto que firma las sesiones.",
    izq: ["/reux/usuario → nombre del administrador principal", "/reux/clave → contraseña (SecureString)", "/reux/secreto → clave HMAC de las sesiones (SecureString)"],
    der: ["El servidor los lee al arrancar (servicio reux-entorno)", "Nunca están en el código ni en GitHub", "Se cambian con aws ssm put-parameter y se republica"],
    notas: "Parameter Store evita que las contraseñas vivan en el código o en archivos del servidor sin cifrar. El servidor las lee una vez al iniciar, con permiso solo sobre /reux/*.",
  },
  {
    ic: "iam", t: "AWS IAM: permisos mínimos", rol: "Define qué puede hacer el servidor. El rol de la instancia solo tiene lo estrictamente necesario.",
    tabla: [
      ["S3", "PutObject, GetObject", "solo en el bucket de Reu-X"],
      ["Transcribe", "StartTranscriptionJob, GetTranscriptionJob", "trabajos de transcripción"],
      ["Bedrock", "InvokeModel, InvokeModelWithResponseStream", "modelos de Claude"],
      ["Parameter Store", "GetParameter", "solo /reux/*"],
      ["Systems Manager", "AmazonSSMManagedInstanceCore", "administración remota"],
    ],
    notas: "IAM aplica el principio de mínimo privilegio. Si alguien comprometiera la app, solo podría tocar el bucket de Reu-X y los parámetros /reux, no el resto de la cuenta.",
  },
  {
    ic: "systems-manager", t: "AWS Systems Manager: administración sin SSH", rol: "Permite ejecutar comandos en el servidor desde la línea de comandos de AWS, sin abrir el puerto SSH.",
    izq: ["Run Command ejecuta actualizar.sh para publicar versiones", "Session Manager abre una terminal desde la consola", "Diagnóstico: ver estado y registros de los servicios"],
    der: ["infra/publicar.sh envía la orden y espera el resultado", "Todo queda registrado en AWS", "Superficie de ataque menor: el firewall solo abre 80 y 443"],
    notas: "Systems Manager reemplaza el acceso SSH tradicional. Publicar una versión es un solo comando desde la computadora del desarrollador.",
  },
  {
    ic: "cloudformation", t: "AWS CloudFormation: infraestructura como código", rol: "Crea y actualiza todos los recursos desde plantillas versionadas en el repositorio.",
    tabla: [
      ["reu-x", "infra/template.yaml", "Bucket S3 (cifrado, CORS, ciclo de vida) y política IAM de la app"],
      ["reu-x-servidor", "infra/servidor.yaml", "Grupo de seguridad, rol e instancia de perfil IAM, EC2 con instalación automática e IP elástica"],
    ],
    notas: "Con CloudFormation la infraestructura es reproducible: se puede recrear en otra cuenta o región con un comando, y cada cambio queda en Git.",
  },
  {
    ic: "vpc", t: "Red: VPC, grupo de seguridad, IP y DNS", rol: "Conecta el servidor a internet de forma controlada y le da una dirección fija con nombre propio.",
    izq: ["VPC predeterminada con subred pública e Internet Gateway", "Grupo de seguridad: solo entran 80 y 443 (IPv4 e IPv6)", "IP elástica 50.18.10.41"],
    der: ["DNS en el registrador .tech: registro A reux → 50.18.10.41", "Dirección pública: https://reux.amezzi.tech", "Las llamadas a S3, Transcribe y Bedrock salen por HTTPS"],
    notas: "La red es sencilla a propósito: un servidor público protegido por su grupo de seguridad. El DNS del dominio amezzi.tech se administra fuera de AWS, en el panel del registrador.",
  },
];

for (const f of fichas) {
  const s = nueva("CONTENIDO", f.t, f.notas);
  servicioCabecera(s, f.ic, f.rol);
  seConectaCon(s, CONEXIONES[f.ic]);
  if (f.tabla) {
    const esIam = f.ic === "iam";
    tabla(s, esIam ? ["Servicio", "Acciones permitidas", "Alcance"] : ["Stack", "Plantilla", "Recursos"], f.tabla, M, 3.4, W - 2 * M, esIam ? [2, 4.5, 3.5] : [1.6, 2.2, 6.2], 14);
  } else {
    vinetas(s, f.izq, M, 3.45, 5.9, 2.2, 16);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.85, y: 3.35, w: 5.88, h: 2.3, rectRadius: 0.12, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: "panel detalle" });
    s.addText("En Reu-X", { x: 7.1, y: 3.47, w: 5.4, h: 0.4, fontSize: 16, bold: true, color: C.accent2, margin: 0, isTextBox: true });
    vinetas(s, f.der, 7.1, 3.92, 5.4, 1.65, 14);
  }
}

// ───── Sección 3: Cómo se conectan
seccion("Cómo se conectan", "El recorrido de una reunión, de la grabación a la minuta", "Ahora unimos las piezas: seguimos una reunión desde que se carga hasta que se descarga la minuta.");

{
  const s = nueva("CONTENIDO", "El núcleo: de la grabación a la minuta", "Este diagrama deja fuera el acceso y la operación para mostrar solo lo propio del problema: S3, Transcribe, la aplicación y Bedrock. Los siete pasos numerados son los que recorremos a continuación.");
  imagenAjustada(s, "Reu-X_Nucleo_AWS.png", 3150, 1830, M, 1.3, W - 2 * M, 5.55, "diagrama núcleo");
}

{
  const s = nueva("CONTENIDO", "Pasos 1 y 2: del navegador a S3", "La app no recibe el video: solo entrega una URL firmada. El navegador sube directo a S3, lo que soporta archivos de hasta 2 GB sin saturar el servidor, con barra de progreso.");
  flujoPasos(s, [
    { t: "Cargar", d: "El usuario elige la grabación o pega el texto, y llena los datos opcionales" },
    { t: "Pedir permiso", d: "POST /api/subir: la app valida formato, tamaño y cuota del usuario" },
    { t: "URL firmada", d: "La app firma un PUT de S3 válido 1 hora para entradas/<uuid>-archivo" },
    { t: "Subida directa", d: "El navegador envía el archivo a S3 y muestra el porcentaje de avance" },
  ], 1.6, 2.2);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 4.3, w: W - 2 * M, h: 2.35, rectRadius: 0.12, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: "panel por qué" });
  s.addText("Por qué así", { x: M + 0.3, y: 4.45, w: 6, h: 0.45, fontSize: 16, bold: true, color: C.accent2, margin: 0, isTextBox: true });
  vinetas(s, ["El servidor no gasta memoria ni ancho de banda en videos grandes", "S3 solo acepta subidas desde el dominio de Reu-X (CORS)", "La URL vence en 1 hora y sirve para un único archivo"], M + 0.3, 5.0, W - 2 * M - 0.6, 1.6, 15);
}

{
  const s = nueva("CONTENIDO", "Pasos 3 y 4: Transcribe lee y escribe en S3", "La app solo inicia el trabajo. Transcribe trabaja de forma asíncrona leyendo el audio desde S3 y deja el resultado también en S3. La app consulta cada 5 segundos hasta que termina.");
  const cajas = [
    { x: M, ic: "ec2", t: "Aplicación", d: "POST /api/transcribir\nStartTranscriptionJob\nidioma automático · 10 hablantes" },
    { x: 4.9, ic: "transcribe", t: "Amazon Transcribe", d: "Lee s3://…/entradas/\nReconoce la voz\nEscribe s3://…/transcripciones/" },
    { x: 9.2, ic: "s3", t: "Amazon S3", d: "entradas/ (audio)\ntranscripciones/ (JSON)\nambos se borran a los 7 días" },
  ];
  cajas.forEach((c) => tarjeta(s, c.x, 1.55, 3.55, 3.2, { titulo: c.t, ic: c.ic, texto: c.d }));
  [4.15, 8.45].forEach((x, i) => s.addShape(pres.shapes.RIGHT_ARROW, { x, y: 2.85, w: 0.75, h: 0.45, fill: { color: C.accent2 }, line: { color: C.accent2 }, objectName: `flecha transcribe ${i}` }));
  s.addText("La aplicación consulta el estado cada 5 segundos (POST /api/transcribir/estado). Al terminar, lee el JSON de S3.", { x: M, y: 5.15, w: W - 2 * M, h: 0.9, fontSize: 16, color: C.text2, italic: true, margin: 0, isTextBox: true });
}

{
  const s = nueva("CONTENIDO", "Paso 5: del JSON al texto por hablante", "Transcribe entrega un JSON con cada palabra, su tiempo y su hablante. La app lo convierte en un texto legible, uniendo intervenciones seguidas de la misma persona.");
  s.addText("Salida de Transcribe (JSON)", { x: M, y: 1.5, w: 5.8, h: 0.45, fontSize: 16, bold: true, color: C.accent2, margin: 0, isTextBox: true });
  s.addText('{ "audio_segments": [\n  { "speaker_label": "spk_0",\n    "start_time": "0.0",\n    "transcript": "Buenos días…" },\n  { "speaker_label": "spk_1",\n    "start_time": "12.4", … } ] }', { x: M, y: 2.0, w: 5.8, h: 2.7, fontFace: "Courier New", fontSize: 14, color: C.text1, fill: { color: C.background2 }, margin: 0.2, valign: "top", isTextBox: true });
  s.addShape(pres.shapes.RIGHT_ARROW, { x: 6.55, y: 3.1, w: 0.6, h: 0.45, fill: { color: C.accent2 }, line: { color: C.accent2 }, objectName: "flecha formato" });
  s.addText("Texto para la minuta", { x: 7.35, y: 1.5, w: 5.4, h: 0.45, fontSize: 16, bold: true, color: C.accent2, margin: 0, isTextBox: true });
  s.addText("[00:00] Hablante 1: Buenos días. Soy Marta Ruiz, gerente de operaciones…\n\n[00:12] Hablante 2: Buenos días, Marta, soy Pedro Gómez, de compras…", { x: 7.35, y: 2.0, w: 5.38, h: 2.7, fontSize: 15, color: C.text1, fill: { color: C.background2 }, margin: 0.2, valign: "top", isTextBox: true });
  s.addText("lib/transcripcion.ts → formatearTranscripcion(). El usuario puede corregir este texto y regenerar la minuta.", { x: M, y: 5.0, w: W - 2 * M, h: 0.6, fontSize: 15, color: C.text1, margin: 0, isTextBox: true });
}

{
  const s = nueva("CONTENIDO", "Paso 6: Claude redacta la minuta en Bedrock", "La llamada a Claude incluye unas instrucciones de sistema, la transcripción y el esquema de la minuta. Claude responde con un JSON que la app valida; si no cumple el esquema, se rechaza.");
  tarjeta(s, M, 1.7, 3.9, 4.0, { titulo: "Se envía", texto: "Instrucciones: redactar en español formal, no inventar datos, separar acuerdos de tareas\n\nLa transcripción y los datos de la reunión\n\nEl esquema MinutaSchema (Zod)" });
  s.addShape(pres.shapes.RIGHT_ARROW, { x: 4.65, y: 3.6, w: 0.6, h: 0.45, fill: { color: C.accent2 }, line: { color: C.accent2 }, objectName: "flecha a bedrock" });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.4, y: 2.3, w: 2.55, h: 3.0, rectRadius: 0.15, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: "bedrock centro" });
  s.addImage({ path: icono("bedrock"), x: 6.1, y: 2.55, w: 1.15, h: 1.15, objectName: "icono bedrock paso 6" });
  s.addText("Claude Sonnet 4.6\nen Bedrock", { x: 5.5, y: 3.85, w: 2.35, h: 1.0, fontSize: 15, bold: true, color: C.text2, align: "center", margin: 0, isTextBox: true });
  s.addShape(pres.shapes.RIGHT_ARROW, { x: 8.1, y: 3.6, w: 0.6, h: 0.45, fill: { color: C.accent2 }, line: { color: C.accent2 }, objectName: "flecha desde bedrock" });
  tarjeta(s, 8.83, 1.7, 3.9, 4.0, { titulo: "Se recibe", texto: "JSON con: título, fecha, lugar, participantes, objetivo, resumen ejecutivo, agenda, temas, acuerdos, tareas, pendientes y próxima reunión\n\nSe valida y se descuenta una minuta de la cuota" });
}

{
  const s = nueva("CONTENIDO", "Paso 7: los visuales se generan bajo demanda", "Los visuales no se generan todos de entrada: cada uno se pide cuando el usuario abre su pestaña, con una llamada a Claude que recibe la minuta, no la transcripción completa. El de responsables se arma sin IA.");
  const v = [
    ["Mapa mental", "Claude resume ideas clave en ramas; la app lo dibuja en SVG propio", "bedrock"],
    ["Infografía", "Claude redacta título, bloques, cifras y conclusión; la app la diseña con temas, foto y logo", "bedrock"],
    ["Diagrama de flujo", "Claude describe nodos y decisiones; la app genera el código Mermaid", "bedrock"],
    ["Responsables", "Sin IA: se arma directo de la tabla de tareas de la minuta", "usuarios"],
  ];
  v.forEach(([t, d, ic], i) => tarjeta(s, M + i * 3.07, 1.55, 2.85, 3.5, { titulo: t, ic, texto: d }));
  s.addText("Todos se exportan a PNG o SVG, y el último visual generado se incluye en el Word de la minuta.", { x: M, y: 5.4, w: W - 2 * M, h: 0.5, fontSize: 16, italic: true, color: C.text2, margin: 0, isTextBox: true });
}

{
  const s = nueva("CONTENIDO", "Tiempos típicos de procesamiento", "Para una reunión de una hora, lo que más tarda es la transcripción: entre 15 y 30 minutos. La redacción toma menos de un minuto y cada visual entre 10 y 30 segundos.");
  s.addChart(pres.charts.BAR, [{ name: "Segundos", labels: ["Subida (100 MB)", "Transcripción (1 h de audio)", "Minuta (Claude)", "Cada visual (Claude)"], values: [60, 1350, 30, 20] }], {
    x: M, y: 1.4, w: 7.6, h: 5.3, barDir: "bar", chartColors: [HEX.accent2], showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 12, dataLabelColor: HEX.dk1,
    catAxisLabelColor: HEX.dk1, valAxisLabelColor: HEX.dk1, catAxisLabelFontSize: 13, valAxisLabelFontSize: 11, catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", dataLabelFontFace: "+mn-lt",
    valGridLine: { color: "E2E6EC", size: 0.5 }, catGridLine: { style: "none" }, showLegend: false, showTitle: true, title: "Segundos aproximados", titleFontSize: 14, titleColor: HEX.dk2, titleFontFace: "+mn-lt",
  });
  datoGrande(s, 8.7, 1.7, 4.0, "≈ 25 min", "de principio a fin para una reunión de una hora (domina la transcripción)", C.accent2);
  datoGrande(s, 8.7, 4.1, 4.0, "< 1 min", "si la reunión llega como texto: solo redacción", C.accent4);
}

{
  const s = nueva("CONTENIDO", "Arquitectura por capas", "Otra forma de ver las conexiones: cinco capas, de la interfaz a los servicios de AWS. Cada servicio de aplicación baja a un servicio de dominio y este a un servicio de AWS.");
  imagenAjustada(s, "Reu-X_Arquitectura_Servicios.png", 3630, 2490, M, 1.3, W - 2 * M, 5.55, "diagrama capas");
}

{
  const s = nueva("CONTENIDO", "Componentes del navegador y del servidor", "El diagrama de componentes separa lo que corre en el navegador de lo que corre en el servidor y muestra las dos interfaces públicas: la API HTTPS y la subida directa a S3.");
  imagenAjustada(s, "Reu-X_Diagrama_Componentes.png", 3660, 2370, M, 1.3, W - 2 * M, 5.55, "diagrama componentes");
}

{
  const s = nueva("CONTENIDO", "Mapa de conexiones", "Resumen de todas las conexiones: quién llama a quién, por qué medio y para qué.");
  tabla(s, ["Origen", "Destino", "Medio", "Para qué"], [
    ["Navegador", "Caddy → App", "HTTPS · JSON", "Interfaz, API y sesión"],
    ["Navegador", "Amazon S3", "PUT con URL firmada", "Subir la grabación"],
    ["App", "Amazon S3", "SDK (rol IAM)", "Firmar URL, leer transcripción, usuarios"],
    ["App", "Amazon Transcribe", "SDK (rol IAM)", "Iniciar y consultar trabajos"],
    ["Transcribe", "Amazon S3", "Interno de AWS", "Leer audio y escribir JSON"],
    ["App", "Amazon Bedrock", "SDK (rol IAM)", "Minuta y visuales con Claude"],
    ["Servidor", "Parameter Store", "AWS CLI al iniciar", "Credenciales y secreto de sesión"],
    ["Desarrollador", "Systems Manager → EC2", "Run Command", "Publicar versiones"],
    ["Servidor", "GitHub", "git pull (HTTPS)", "Descargar el código"],
  ], M, 1.45, W - 2 * M, [2.2, 2.8, 2.6, 4.4], 14);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 5.75, w: W - 2 * M, h: 0.9, rectRadius: 0.12, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: "conclusión" });
  s.addText("Ninguna llamada de la app a AWS usa llaves guardadas: todas usan las credenciales temporales del rol IAM de la instancia.", { x: M + 0.3, y: 5.75, w: W - 2 * M - 0.6, h: 0.9, fontSize: 16, color: C.text2, italic: true, margin: 0, valign: "middle", isTextBox: true });
}

// ───── Sección 4: Seguridad y operación
seccion("Seguridad y operación", "Acceso, permisos, credenciales y publicación", "Cómo se protege la solución y cómo se opera en el día a día.");

{
  const s = nueva("CONTENIDO", "Seguridad en capas", "Cada capa agrega una protección. Si una falla, las demás siguen limitando el daño.");
  const c = [
    ["Transporte", "HTTPS obligatorio, HSTS y certificados automáticos", "lets-encrypt"],
    ["Acceso", "Inicio de sesión; sesión firmada con HMAC que vence en 12 h", "usuarios"],
    ["Contraseñas", "scrypt con sal; 8 intentos fallidos bloquean 15 minutos", "parameter-store"],
    ["Perfiles y cuotas", "Administración solo para administradores; límites diarios por usuario", "desarrollador"],
    ["Permisos AWS", "Rol IAM mínimo, sin llaves guardadas en el servidor", "iam"],
    ["Datos", "S3 privado y cifrado; grabaciones borradas a los 7 días", "s3"],
  ];
  c.forEach(([t, d, ic], i) => tarjeta(s, M + (i % 3) * 4.1, 1.5 + Math.floor(i / 3) * 2.65, 3.85, 2.45, { titulo: t, texto: d, ic }));
}

{
  const s = nueva("CONTENIDO", "Usuarios, perfiles y cuotas", "Tres perfiles. El participante está pensado para cuentas compartidas en eventos: tiene límites para acotar el gasto en Transcribe y Bedrock aunque la contraseña sea sencilla.");
  tabla(s, ["Perfil", "Puede", "Límites por defecto"], [
    ["Administrador", "Todo, incluida la pantalla Usuarios", "Sin límite"],
    ["Usuario", "Minutas, visuales y exportación", "Sin límite (configurable)"],
    ["Participante", "Igual que Usuario; cuentas compartidas", "20 minutas al día y archivos de hasta 300 MB"],
  ], M, 1.5, 7.6, [2.2, 3.4, 3.4], 14);
  datoGrande(s, M, 4.0, 3.6, "20 / día", "minutas permitidas por defecto al perfil Participante", C.accent2);
  datoGrande(s, 4.45, 4.0, 3.6, "300 MB", "tamaño máximo de archivo del Participante", C.accent5);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.55, y: 1.5, w: 4.18, h: 5.1, rectRadius: 0.12, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: "panel almacenamiento usuarios" });
  s.addImage({ path: icono("s3"), x: 8.8, y: 1.7, w: 0.8, h: 0.8, objectName: "icono s3 usuarios" });
  s.addText("Dónde se guardan", { x: 9.75, y: 1.8, w: 2.9, h: 0.6, fontSize: 16, bold: true, color: C.accent2, margin: 0, isTextBox: true });
  vinetas(s, ["config/usuarios.json en S3, cifrado", "Contraseñas con scrypt, nunca en texto plano", "Escrituras con If-Match: dos cambios simultáneos no se pisan", "El administrador principal vive en Parameter Store"], 8.8, 2.75, 3.75, 3.7, 14);
}

{
  const s = nueva("CONTENIDO", "Credenciales: quién accede a qué", "Ninguna llave de AWS está guardada en el servidor. La instancia obtiene credenciales temporales de su rol IAM, que se renuevan solas. Las contraseñas de la app vienen de Parameter Store.");
  flujoPasos(s, [
    { t: "Rol IAM", d: "La instancia EC2 recibe credenciales temporales que se renuevan solas" },
    { t: "reux-entorno", d: "Al arrancar, lee /reux/usuario, /reux/clave y /reux/secreto de Parameter Store" },
    { t: "/etc/reux/reux.env", d: "Variables de entorno accesibles solo para root y el servicio" },
    { t: "Aplicación", d: "Usa el SDK de AWS con el rol y valida sesiones con el secreto" },
  ], 1.6, 2.3);
  s.addText("En la computadora del desarrollador se usa aws login --profile reux: credenciales temporales que hay que renovar; el servidor no depende de ellas.", { x: M, y: 4.5, w: W - 2 * M, h: 0.9, fontSize: 16, italic: true, color: C.text2, margin: 0, isTextBox: true });
}

{
  const s = nueva("CONTENIDO", "Publicar una nueva versión", "Publicar es un solo comando. Systems Manager le pide al servidor que descargue la versión de GitHub, la compile y reinicie; tarda entre 3 y 6 minutos.");
  flujoPasos(s, [
    { t: "git push", d: "El cambio se sube a la rama main en GitHub" },
    { t: "publicar.sh", d: "Envía la orden por Systems Manager Run Command" },
    { t: "actualizar.sh", d: "En el servidor: git pull, npm ci y npm run build" },
    { t: "Reinicio", d: "Reinicia reux y recarga Caddy; informa la versión publicada" },
  ], 1.6, 2.2);
  s.addText("bash infra/publicar.sh", { x: M, y: 4.3, w: 5.5, h: 0.6, fontFace: "Courier New", fontSize: 18, color: C.text2, fill: { color: C.background2 }, margin: 0.15, isTextBox: true });
  vinetas(s, ["Sin SSH: el firewall solo abre 80 y 443", "Cada versión corresponde a un commit de GitHub, fácil de revertir"], 6.5, 4.3, 6.2, 1.5, 16);
}

// ───── Sección 5: Costos y próximos pasos
seccion("Costos y próximos pasos", "Cuánto cuesta y qué sigue", "Cerramos con los costos, los límites actuales y las mejoras sugeridas.");

{
  const s = nueva("CONTENIDO", "Costos mensuales estimados", "El costo fijo ronda los 18 dólares al mes. El resto depende del uso: Transcribe cobra por minuto de audio y Bedrock por tokens. Son estimaciones de la región us-west-1.");
  s.addChart(pres.charts.BAR, [{ name: "USD por mes", labels: ["EC2 t4g.small", "IPv4 elástica", "Disco EBS 20 GB", "S3"], values: [12.3, 3.6, 1.6, 0.5] }], {
    x: M, y: 1.4, w: 6.9, h: 5.3, barDir: "col", chartColors: [HEX.accent2], showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 12, dataLabelColor: HEX.dk1, dataLabelFormatCode: "$0.0",
    catAxisLabelColor: HEX.dk1, valAxisLabelColor: HEX.dk1, catAxisLabelFontSize: 12, valAxisLabelFontSize: 11, catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", dataLabelFontFace: "+mn-lt",
    valGridLine: { color: "E2E6EC", size: 0.5 }, catGridLine: { style: "none" }, showLegend: false, showTitle: true, title: "Costo fijo (USD / mes)", titleFontSize: 14, titleColor: HEX.dk2, titleFontFace: "+mn-lt",
  });
  datoGrande(s, 8.0, 1.5, 4.7, "≈ US$18", "costo fijo mensual (servidor, IP, disco y S3)", C.accent2);
  datoGrande(s, 8.0, 3.35, 4.7, "≈ US$1.44", "por hora de audio transcrita", C.accent5);
  datoGrande(s, 8.0, 5.2, 4.7, "US$0.03–0.10", "por minuta con Claude Sonnet 4.6", C.accent4, 36);
}

{
  const s = nueva("CONTENIDO", "Límites actuales y mejoras sugeridas", "Lo que hoy funciona bien para un equipo o un evento, y qué haría falta para crecer.");
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 1.5, w: 5.95, h: 3.9, rectRadius: 0.12, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: "panel límites" });
  s.addText("Límites actuales", { x: M + 0.3, y: 1.65, w: 5.3, h: 0.5, fontSize: 18, bold: true, color: C.accent6, margin: 0, isTextBox: true });
  vinetas(s, ["Un solo servidor: si se detiene, el servicio se interrumpe", "Modelos Claude 5.x aún no habilitados en la cuenta", "La transcripción puede fallar en cifras y nombres", "Usuarios en un archivo JSON (decenas o cientos)"], M + 0.3, 2.3, 5.4, 3.0, 15);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.78, y: 1.5, w: 5.95, h: 3.9, rectRadius: 0.12, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: "panel mejoras" });
  s.addText("Mejoras sugeridas", { x: 7.08, y: 1.65, w: 5.3, h: 0.5, fontSize: 18, bold: true, color: C.accent4, margin: 0, isTextBox: true });
  vinetas(s, ["Alta disponibilidad: ECS/Fargate o App Runner con balanceador", "Solicitar Claude Opus 5.5 / Sonnet 5.5 en Bedrock", "Alarmas de CloudWatch y versionado del bucket", "DynamoDB o Amazon Cognito para muchos usuarios"], 7.08, 2.3, 5.4, 3.0, 15);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 5.75, w: W - 2 * M, h: 0.9, rectRadius: 0.12, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: "conclusión" });
  s.addText("Siguiente paso recomendado: solicitar a AWS los modelos Claude 5.x y activar alarmas de CloudWatch.", { x: M + 0.3, y: 5.75, w: W - 2 * M - 0.6, h: 0.9, fontSize: 16, color: C.text2, italic: true, margin: 0, valign: "middle", isTextBox: true });
}

{
  const s = nueva("CONTENIDO", "Resumen: cada servicio y su conexión", "Resumen final de la arquitectura: cada servicio, qué aporta y con qué se conecta.");
  tabla(s, ["Servicio", "Aporta", "Se conecta con"], [
    ["EC2 + Caddy", "Aplicación web y HTTPS", "Usuarios, S3, Transcribe, Bedrock, Parameter Store"],
    ["Amazon S3", "Grabaciones, transcripciones y usuarios", "Navegador (subida), app, Transcribe"],
    ["Amazon Transcribe", "Voz a texto con hablantes", "App (trabajos) y S3 (audio y JSON)"],
    ["Amazon Bedrock", "Claude: minuta y visuales", "App (messages.parse)"],
    ["Parameter Store", "Credenciales cifradas", "Servidor al iniciar"],
    ["IAM", "Permisos mínimos", "Rol de la instancia EC2"],
    ["Systems Manager", "Administración sin SSH", "Desarrollador → servidor"],
    ["CloudFormation", "Infraestructura como código", "Crea todos los recursos"],
  ], M, 1.45, W - 2 * M, [2.4, 4.0, 5.6], 14);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 5.75, w: W - 2 * M, h: 0.9, rectRadius: 0.12, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: "conclusión" });
  s.addText("Seis servicios gestionados de AWS alrededor de un servidor pequeño: AWS hace el trabajo pesado y la app orquesta.", { x: M + 0.3, y: 5.75, w: W - 2 * M - 0.6, h: 0.9, fontSize: 16, color: C.text2, italic: true, margin: 0, valign: "middle", isTextBox: true });
}

{
  const s = nueva("SECCION", "Gracias", "Preguntas y comentarios. El código, los diagramas y esta presentación están en el repositorio de GitHub.");
  s.addText("Reu-X está en línea en https://reux.amezzi.tech", { placeholder: "body" });
  s.addText("github.com/epinedaWorks/Reu-X-AmezziTech", { x: M, y: 5.2, w: 9, h: 0.45, fontSize: 16, color: C.background2, margin: 0, isTextBox: true });
  s.addText([{ text: "Amezzi ", options: { bold: true, color: C.background1 } }, { text: "Tech", options: { bold: true, color: C.accent2 } }, { text: "  ·  by Ing. Erick J. Pineda Amézquita", options: { color: C.background2 } }], { x: M, y: 5.75, w: 11, h: 0.5, fontSize: 18, margin: 0, isTextBox: true });
}

(async () => {
  await pres.writeFile({ fileName: SALIDA });
  if (APLICAR_TEMA) {
    const { applyTheme } = require(APLICAR_TEMA);
    await applyTheme(SALIDA, THEME);
  }
  console.log("Generado:", SALIDA, "· diapositivas:", pres.slides.length);
})();
