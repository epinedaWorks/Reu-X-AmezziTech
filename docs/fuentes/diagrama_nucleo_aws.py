"""Diagrama al estilo AWS del núcleo de Reu-X: de la grabación a la minuta y los visuales.

Muestra solo lo propio del problema (sin acceso, publicación ni infraestructura de soporte).
Uso:     python docs/fuentes/diagrama_nucleo_aws.py
Salida:  docs/Reu-X_Nucleo_AWS.png
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from aws_estilo import *  # noqa: E402,F403
import aws_estilo as e  # noqa: E402

SALIDA = DOCS / "Reu-X_Nucleo_AWS.png"
lienzo(210, 122)
ax = e.ax

encabezado("Reu-X · Núcleo de procesamiento en AWS",
           "De la grabación de una reunión a la minuta formal y sus visuales · Amezzi Tech", 122)

# ───────── grupos ─────────
grupo(38, 24, 207, 104, "AWS Cloud", NEGRO, "aws", tam=11)
grupo(42, 27, 203, 98, "Región us-west-1 (N. California)", REGION, discontinuo=True)
grupo(70, 33, 122, 58, "Amazon EC2 · aplicación Reu-X", NARANJA, "ec2", relleno="white", tam=9.5)

# ───────── servicios ─────────
servicio("s3", 64, 78, "Amazon S3 · entradas/", "grabaciones de audio y video\n(cifradas, se borran a los 7 días)")
servicio("transcribe", 112, 78, "Amazon Transcribe", "voz a texto · es-US, es-ES, en-US\nhasta 10 hablantes")
servicio("s3", 160, 78, "Amazon S3 · transcripciones/", "JSON con texto, tiempos\ny hablantes")
icono("nextjs", 96, 46.5, 7.5)
ax.text(96, 41.2, "Next.js · orquesta el proceso", ha="center", va="top", fontsize=9.5, fontweight="bold", color=NEGRO, zorder=7)
ax.text(96, 38.4, "formatea “[mm:ss] Hablante N: …”", ha="center", va="top", fontsize=8.5, color=GRIS, zorder=7)
servicio("bedrock", 172, 46, "Amazon Bedrock", "Claude Sonnet 4.6\nsalida estructurada (JSON)\nminuta, mapa, infografía, flujo")

# ───────── fuera de AWS ─────────
servicio("usuarios", 16, 80, "Usuario", "navegador web", alto=10)
tarjeta(3, 25, 35, 58, "Resultados", [
    "Minuta formal",
    "  Word · PDF · Markdown",
    "Mapa mental",
    "Infografía",
    "Diagrama de flujo",
    "Responsables y tareas",
    "  (PNG · SVG)",
])

# ───────── flujos ─────────
flecha((21.5, 82), (59, 80.5), num=2, texto="subida directa\n(URL firmada)", en=(27, 89))
flecha((16, 67.5), (70, 45), num=1, texto="grabación o texto\n+ datos de la reunión", en=(47, 58))
flecha((88, 58.3), (107.3, 75.5), num=3, texto="inicia el trabajo", conexion="angle,angleA=90,angleB=180,rad=0", en=(88, 66))
flecha((69, 80.5), (107.3, 80.5), texto="lee el audio", pos=0.5, desp=(0, 2.6), color=GRIS)
flecha((117, 78), (155, 78), num=4, texto="escribe el JSON", en=(131, 81.5))
flecha((160, 64.5), (122.2, 52), num=5, texto="transcripción", en=(144, 59))
flecha((122.2, 48.5), (167, 48.5), num=6, texto="texto + esquema", en=(138, 51.2))
flecha((167, 43.5), (122.2, 43.5), texto="minuta en JSON validado", pos=0.5, desp=(2, -2.7))
flecha((70, 38), (35.2, 38), num=7, texto="minuta y visuales", en=(48, 41))

ax.text(46, 30.5, "Si la reunión llega como texto, se omiten los pasos 2 a 5.", fontsize=8.8, color=GRIS, style="italic")

leyenda([
    ("1", "El usuario carga la reunión (grabación o texto) y, opcionalmente, título, fecha y participantes."),
    ("2", "La grabación sube del navegador directo a S3 con una URL firmada de corta duración."),
    ("3", "La aplicación inicia el trabajo de Amazon Transcribe con detección de idioma y hablantes."),
    ("4", "Transcribe lee el audio de S3 y deja la transcripción en JSON en S3."),
    ("5", "La aplicación lee el JSON y lo convierte en texto por hablante con marcas de tiempo."),
    ("6", "Claude en Bedrock redacta la minuta (y luego cada visual) siguiendo un esquema estricto."),
    ("7", "El navegador muestra el acta y genera las exportaciones y los visuales."),
], 40, 18.5, ancho_col=84, paso_y=4.3)

guardar(SALIDA)
