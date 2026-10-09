"""Diagrama de clases (UML) de Reu-X: modelos de datos y módulos del servidor.

Los modelos son tipos de TypeScript definidos con Zod (lib/esquemas.ts, lib/usuarios.ts,
lib/sesion.ts); los módulos de lib/ se muestran como clases con el estereotipo «módulo».
Uso:     python docs/fuentes/diagrama_clases.py
Salida:  docs/Reu-X_Diagrama_Clases.png
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from aws_estilo import *  # noqa: E402,F403
import aws_estilo as e  # noqa: E402

SALIDA = DOCS / "Reu-X_Diagrama_Clases.png"
ALTO = 186
lienzo(240, ALTO)
ax = e.ax
encabezado("Reu-X · Diagrama de clases", "Modelos de datos (TypeScript + Zod) y módulos del servidor (lib/) · Amezzi Tech", ALTO)

# ───────── Modelo de la minuta ─────────
paquete(2, 117, 93, 172, "Minuta (lib/esquemas.ts)")
minuta = clase(5, 166, 46, "Minuta", [
    "titulo: string", "fecha: string", "hora: string", "lugar: string",
    "participantes: Participante[]", "objetivo: string", "resumen_ejecutivo: string",
    "agenda: string[]", "temas: Tema[]", "acuerdos: string[]", "tareas: Tarea[]",
    "pendientes: string[]", "proxima_reunion: string",
])
participante = clase(57, 166, 33, "Participante", ["nombre: string", "rol: string"])
tema = clase(57, 150, 33, "Tema", ["titulo: string", "resumen: string", "puntos: string[]"])
tarea = clase(57, 133, 33, "Tarea", ["tarea: string", "responsable: string", "fecha_limite: string"])
relacion((minuta["x1"], 150), (participante["x0"], participante["cy"]), "composicion", mult="0..*")
relacion((minuta["x1"], 140), (tema["x0"], tema["cy"]), "composicion", mult="0..*")
relacion((minuta["x1"], 130), (tarea["x0"], tarea["cy"]), "composicion", mult="0..*")

# ───────── Visuales ─────────
paquete(96, 88, 238, 172, "Visuales (lib/esquemas.ts)")
mapa = clase(99, 166, 34, "Mapa", ["centro: string", "ramas: Rama[]"])
rama = clase(99, 150, 34, "Rama", ["titulo: string", "icono: Icono", "ideas: Idea[]"])
idea = clase(99, 132, 34, "Idea", ["texto: string", "detalles: string[]"])
relacion((mapa["cx"], mapa["y0"]), (rama["cx"], rama["y1"]), "composicion", mult="4..6")
relacion((rama["cx"], rama["y0"]), (idea["cx"], idea["y1"]), "composicion", mult="2..5")

info = clase(137, 166, 43, "Infografia", [
    "titulo: string", "subtitulo: string", "evento: string", "frase_clave: string",
    "bloques: Bloque[]", "cifras: Cifra[]", "destacados: Destacado[]", "conclusion: string",
])
bloque = clase(137, 135, 14, "Bloque", ["titulo", "icono", "texto", "puntos[]"])
cifra = clase(151.5, 135, 14, "Cifra", ["valor", "etiqueta"])
destacado = clase(166, 135, 14, "Destacado", ["texto", "icono"])
for c, m in ((bloque, "3..4"), (cifra, "0..3"), (destacado, "3..5")):
    relacion((c["cx"], info["y0"]), (c["cx"], c["y1"]), "composicion", mult=m)
ax.text(158.5, 117, "atributos de tipo string;\nicono: Icono", ha="center", va="top", fontsize=7, color=GRIS, style="italic")

flujo = clase(184, 166, 51, "Flujo", ["titulo: string", "nodos: Nodo[]", "conexiones: Conexion[]"])
nodo_c = clase(184, 149, 44, "Nodo", ["id: string", "texto: string", "tipo: inicio|proceso|decision|fin"])
conexion = clase(184, 131, 51, "Conexion", ["desde: string", "hacia: string", "etiqueta: string"])
relacion((nodo_c["cx"], flujo["y0"]), (nodo_c["cx"], nodo_c["y1"]), "composicion", mult="6..18")
relacion((flujo["x1"] - 3.5, flujo["y0"]), (flujo["x1"] - 3.5, conexion["y1"]), "composicion", mult="1..*")
icono_e = clase(184, 113, 51, "Icono", ["objetivo · personas · idea · acuerdo", "tarea · fecha · dinero · alerta",
                                         "tecnologia · datos · crecimiento", "pregunta · proceso · comunicacion",
                                         "documento · meta  (Rama, Bloque, Destacado)"],
                estereotipo="enumeración")

# ───────── Usuarios y acceso ─────────
paquete(2, 58, 93, 112, "Usuarios y acceso (lib/usuarios.ts, lib/sesion.ts)")
usuario = clase(5, 106, 46, "Usuario", [
    "usuario: string", "nombre: string", "rol: Rol", "activo: boolean", "hash: string (scrypt)",
    "limiteDiario: number", "maxMB: number", "creado: string", "uso: Uso",
])
uso = clase(57, 106, 33, "Uso", ["fecha: string", "minutas: number"])
rol = clase(57, 92, 33, "Rol", ["admin", "usuario", "participante"], estereotipo="enumeración")
sesion = clase(57, 74, 33, "Sesion", ["usuario: string", "rol: Rol", "principal: boolean"])
relacion((usuario["x1"], 101), (uso["x0"], uso["cy"]), "composicion", mult="1")
relacion((usuario["x1"], 86), (rol["x0"], rol["cy"]), "asociacion")
relacion((sesion["cx"], sesion["y1"]), (rol["cx"], rol["y0"]), "asociacion")

# ───────── Módulos del servidor ─────────
ax.text(3, 55.5, "Módulos del servidor (lib/)", fontsize=10, fontweight="bold", color=NEGRO)
W = 56.5
m_usu = clase(3, 52, W, "usuarios", [], ["listar(): Usuario[]", "obtener(usuario): Usuario", "modificar(cambio): T  (If-Match)",
                                        "consumirCuota(usuario)", "cuotaAgotada(u): string|null", "hashClave() · verificarClave()"],
              estereotipo="módulo", fondo=NARANJA_MODULO)
m_ses = clase(62.5, 52, W, "sesion", [], ["crearSesion(s: Sesion): token", "leerSesion(token): Sesion|null",
                                         "accesoActivo(): boolean", "HMAC-SHA256 · 12 h"],
              estereotipo="módulo", fondo=NARANJA_MODULO)
m_aut = clase(122, 52, W, "autorizacion", [], ["exigirSesion(roles?): Autorizado", "verifica sesión, estado y perfil",
                                              "usa: sesion, usuarios"],
              estereotipo="módulo", fondo=NARANJA_MODULO)
m_aws = clase(181.5, 52, W, "aws", [], ["bucket(): string", "s3: S3Client", "transcribe: TranscribeClient",
                                        "respuestaErrorAws(e): Response", "usado por usuarios (config/usuarios.json)"],
              estereotipo="módulo", fondo=NARANJA_MODULO)
m_llm = clase(3, 23.5, W, "llm", [], ["proveedor(): bedrock|anthropic|demo", "generarEstructurado(system, prompt,",
                                    "    schema): T   (Claude)"],
              estereotipo="módulo", fondo=NARANJA_MODULO)
m_tra = clase(62.5, 23.5, W, "transcripcion", [], ["formatearTranscripcion(salida):", "    string  [mm:ss] Hablante N"],
              estereotipo="módulo", fondo=NARANJA_MODULO)
m_mer = clase(122, 23.5, W, "mermaid", [], ["diagramaFlujo(f: Flujo): string", "diagramaTareas(m: Minuta): string"],
              estereotipo="módulo", fondo=NARANJA_MODULO)
m_exp = clase(181.5, 23.5, W, "exportar", [], ["minutaWord(m, diagrama?): Blob", "minutaMarkdown(m): string",
                                             "svgAPng(svg): PNG"],
              estereotipo="módulo", fondo=NARANJA_MODULO)

relacion((m_usu["cx"], m_usu["y1"]), (usuario["cx"], usuario["y0"]), "dependencia", "gestiona", en=(m_usu["cx"] + 6, 56))
relacion((m_ses["cx"] + 10, m_ses["y1"]), (sesion["cx"], sesion["y0"]), "dependencia", "firma", en=(81, 56))
relacion((m_aut["x0"], 40), (m_ses["x1"], 40), "dependencia")

# ───────── leyenda de notación ─────────
lx, ly = 3, 2.2
relacion((lx, ly), (lx + 8, ly), "composicion")
ax.text(lx + 10, ly, "composición (el todo contiene a las partes)", va="center", fontsize=8, color=GRIS)
relacion((lx + 72, ly), (lx + 80, ly), "asociacion")
ax.text(lx + 82, ly, "asociación", va="center", fontsize=8, color=GRIS)
relacion((lx + 104, ly), (lx + 112, ly), "dependencia")
ax.text(lx + 114, ly, "dependencia (usa)", va="center", fontsize=8, color=GRIS)
ax.text(lx + 145, ly, "0..* multiplicidad · «módulo» archivo de lib/ con funciones exportadas", va="center", fontsize=8, color=GRIS)

guardar(SALIDA)
