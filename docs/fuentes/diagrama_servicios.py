"""Arquitectura de servicios de Reu-X por capas: presentación, borde, API, dominio e AWS.

Uso:     python docs/fuentes/diagrama_servicios.py
Salida:  docs/Reu-X_Arquitectura_Servicios.png
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from aws_estilo import *  # noqa: E402,F403
import aws_estilo as e  # noqa: E402
from matplotlib.patches import FancyBboxPatch  # noqa: E402

SALIDA = DOCS / "Reu-X_Arquitectura_Servicios.png"
ALTO = 166
lienzo(242, ALTO)
ax = e.ax
encabezado("Reu-X · Arquitectura de servicios", "Capas de la aplicación y servicios que intervienen en cada una · Amezzi Tech", ALTO)

X0, ANCHO_COL, SEP = 36, 32.0, 2.0
col = lambda i: X0 + i * (ANCHO_COL + SEP)  # noqa: E731


def capa(y0, y1, numero_capa, titulo, subtitulo, fondo):
    ax.add_patch(Rectangle((2, y0), 238, y1 - y0, facecolor=fondo, edgecolor="none", zorder=0.2))
    ax.add_patch(Rectangle((2, y0), 1.2, y1 - y0, facecolor=NEGRO, edgecolor="none", zorder=0.3))
    ax.text(5.5, (y0 + y1) / 2 + 2.2, f"{numero_capa}. {titulo}", ha="left", va="center", fontsize=9.6, fontweight="bold", color=NEGRO)
    ax.text(5.5, (y0 + y1) / 2 - 1.8, subtitulo, ha="left", va="center", fontsize=7.6, color=GRIS, linespacing=1.25)


def caja(x, y, w, h, titulo, detalle="", color=NEGRO, fondo="white"):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0,rounding_size=1.0", linewidth=1.3,
                                edgecolor=color, facecolor=fondo, zorder=3))
    ax.text(x + w / 2, y + h - 2.6, titulo, ha="center", va="top", fontsize=8.9, fontweight="bold", color=color, zorder=4)
    if detalle:
        ax.text(x + w / 2, y + h - 6.4, detalle, ha="center", va="top", fontsize=7.3, color=GRIS, zorder=4, linespacing=1.3)
    return {"x0": x, "x1": x + w, "y0": y, "y1": y + h, "cx": x + w / 2}


def baja(x, y1, y2, texto="", dx=0.0):
    flecha((x, y1), (x, y2), color=NEGRO)
    if texto:
        ax.text(x + 1.2 + dx, (y1 + y2) / 2, texto, ha="left", va="center", fontsize=7.3, color=GRIS, style="italic", zorder=6)


# ───────── capas ─────────
capa(128, 150, 1, "Presentación", "navegador web\nReact 19 · Next.js 16", "#f3f5f8")
capa(105, 126, 2, "Borde y seguridad", "en el servidor EC2", "#fbf7f1")
capa(77, 103, 3, "Servicios de aplicación", "API REST (JSON)\nrutas /api/*", "#f3f5f8")
capa(49, 75, 4, "Servicios de dominio\ne integración", "lib/ del servidor", "#fbf7f1")
capa(8, 47, 5, "Servicios AWS", "us-west-1", "#f1f6f6")

# 1. Presentación
w5 = (6 * ANCHO_COL + 5 * SEP - 4 * 2.4) / 5
pres = []
for i, (t, d) in enumerate([
    ("Carga y procesamiento", "grabación o texto\navance paso a paso"),
    ("Minuta", "acta formal en\ndos columnas"),
    ("Visuales", "mapa mental · infografía\nflujo · responsables"),
    ("Exportación", "Word · PDF · Markdown\nPNG · SVG"),
    ("Acceso y administración", "inicio de sesión\nusuarios y perfiles"),
]):
    pres.append(caja(X0 + i * (w5 + 2.4), 132, w5, 13.5, t, d))

# 2. Borde
caddy = caja(col(0), 108, 2 * ANCHO_COL + SEP, 15, "Caddy · HTTPS", "TLS de Let's Encrypt · HSTS\nreenvía a la app (:3000)")
proxy = caja(col(2), 108, 2 * ANCHO_COL + SEP, 15, "Proxy de acceso", "sesión firmada (HMAC, 12 h)\nperfiles · /admin solo administradores")
lim = caja(col(4), 108, 2 * ANCHO_COL + SEP, 15, "Protecciones", "8 intentos / 15 min por IP\ncookies httpOnly · Secure")
flecha((caddy["x1"], 115.5), (proxy["x0"], 115.5))

# 3. API
apis = [
    ("Subida", "/api/subir\nformato · tamaño · cuota\nURL firmada (1 h)"),
    ("Transcripción", "/api/transcribir\n/api/transcribir/estado\nformato por hablante"),
    ("Redacción", "/api/minuta\nminuta estructurada\ndescuenta cuota"),
    ("Visuales", "/api/diagrama\nmapa · infografía\nflujo"),
    ("Identidad", "/api/acceso\n/api/yo\ninicio y fin de sesión"),
    ("Administración", "/api/usuarios\ncrear · editar\ndesactivar · eliminar"),
]
api = [caja(col(i), 82, ANCHO_COL, 17.5, t, d) for i, (t, d) in enumerate(apis)]

# 4. Dominio
alm = caja(col(0), 54, ANCHO_COL, 17.5, "Almacenamiento", "lib/aws.ts\nS3 · URL firmada\ncifrado · 7 días")
voz = caja(col(1), 54, ANCHO_COL, 17.5, "Voz a texto", "lib/transcripcion.ts\nidioma y hablantes\n[mm:ss] Hablante N")
ia = caja(col(2), 54, 2 * ANCHO_COL + SEP, 17.5, "Orquestación de IA", "lib/llm.ts · Claude con salida estructurada\nesquemas Zod (lib/esquemas.ts)\nproveedor: Bedrock · API Anthropic · demo")
aut = caja(col(4), 54, ANCHO_COL, 17.5, "Autorización", "lib/autorizacion.ts\nlib/sesion.ts\nperfil en cada llamada")
usu = caja(col(5), 54, ANCHO_COL, 17.5, "Usuarios y cuotas", "lib/usuarios.ts\nscrypt · If-Match\nconfig/usuarios.json")

# 5. AWS (servicios que usa la app)
for nombre, i, titulo, detalle in (
    ("s3", 0, "Amazon S3", "grabaciones,\ntranscripciones, usuarios"),
    ("transcribe", 1, "Amazon Transcribe", "voz a texto"),
    ("bedrock", 2.5, "Amazon Bedrock", "Claude Sonnet 4.6"),
    ("parameter-store", 4, "Parameter Store", "credenciales y secreto"),
):
    x = col(int(i)) + ANCHO_COL / 2 if i == int(i) else col(2) + ANCHO_COL + SEP / 2
    servicio(nombre, x, 37, titulo, detalle, alto=8.5)

# Plataforma (columna 6)
ax.text(col(5) + ANCHO_COL / 2, 45.3, "Plataforma", ha="center", va="center", fontsize=8.2, fontweight="bold", color=GRIS)
for nombre, dx, dy, t in (("ec2", -8, 37.5, "EC2"), ("iam", 8, 37.5, "IAM"),
                         ("systems-manager", -8, 20, "Systems\nManager"), ("cloudformation", 8, 20, "Cloud-\nFormation")):
    x = col(5) + ANCHO_COL / 2 + dx
    icono(nombre, x, dy, 6.5)
    ax.text(x, dy - 4.4, t, ha="center", va="top", fontsize=7.4, color=NEGRO, zorder=7, linespacing=1.15)

# ───────── flujos entre capas ─────────
baja(pres[0]["cx"], 131, 123, "HTTPS · JSON")
flecha((proxy["cx"], 108), (proxy["cx"], 100.5), color=NEGRO)
ax.text(proxy["cx"] + 1.2, 104.2, "solicitudes autorizadas", ha="left", va="center", fontsize=7.3, color=GRIS, style="italic")
for i, destino in enumerate([alm, voz, ia, ia, aut, usu]):
    x = api[i]["x0"] + ANCHO_COL / 2
    flecha((x, 82), (x if destino is not ia else min(max(x, ia["x0"] + 6), ia["x1"] - 6), 72.5), color=NEGRO)
flecha((api[2]["x1"] - 3, 82), (usu["x0"] + 4, 71.5), color=GRIS, discontinua=True)
ax.text(147, 76.2, "cuota", ha="center", fontsize=7.3, color=GRIS, style="italic",
        bbox=dict(boxstyle="round,pad=0.1", facecolor="#fbf7f1", edgecolor="none"))
for origen, x in ((alm, alm["cx"]), (voz, voz["cx"]), (ia, ia["cx"]), (aut, aut["cx"])):
    flecha((x, 54), (x, 42), color=NEGRO)
# Subida directa del navegador a S3 (rodea las capas por la izquierda)
ax.plot([pres[0]["x0"], 33.5, 33.5], [139, 139, 37], color=NARANJA, linewidth=1.6, linestyle=(0, (4, 3)), zorder=2.5)
flecha((33.5, 37), (col(0) + ANCHO_COL / 2 - 5, 37), color=NARANJA, discontinua=True)
ax.text(32.6, 92, "subida directa de la grabación a S3 (URL firmada)", rotation=90, ha="center", va="center",
        fontsize=7.4, color=NARANJA, fontweight="bold", zorder=6,
        bbox=dict(boxstyle="round,pad=0.15", facecolor="white", edgecolor="none"))

guardar(SALIDA)
