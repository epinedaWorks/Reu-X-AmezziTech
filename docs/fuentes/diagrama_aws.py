"""Diagrama de arquitectura de Reu-X al estilo de AWS (íconos oficiales).

Uso:     python docs/fuentes/diagrama_aws.py
Salida:  docs/Reu-X_Arquitectura_AWS.png
Íconos:  docs/fuentes/iconos/ (AWS Architecture Icons y logos de terceros, vía el paquete
         `diagrams`; se usan solo para representar la arquitectura).
"""
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch, Rectangle
from PIL import Image

AQUI = Path(__file__).parent
ICONOS = AQUI / "iconos"
SALIDA = AQUI.parent / "Reu-X_Arquitectura_AWS.png"

NEGRO = "#232f3e"
GRIS = "#545b64"
NARANJA = "#ff9900"
REGION = "#00a4a6"
VPC = "#8c4fff"
SUBRED = "#7aa116"
SG = "#dd344c"
FLUJO = "#232f3e"

plt.rcParams["font.family"] = "DejaVu Sans"

fig, ax = plt.subplots(figsize=(21, 13), dpi=150)
ax.set_xlim(0, 210)
ax.set_ylim(0, 130)
ax.set_aspect("equal")
ax.axis("off")


def icono(nombre, x, y, alto=9.0, z=6):
    im = Image.open(ICONOS / f"{nombre}.png").convert("RGBA")
    ancho = alto * im.width / im.height
    ax.imshow(im, extent=(x - ancho / 2, x + ancho / 2, y - alto / 2, y + alto / 2), zorder=z, interpolation="lanczos")
    return ancho


def etiqueta(x, y, titulo, detalle="", color=NEGRO, tam=10.5):
    ax.text(x, y, titulo, ha="center", va="top", fontsize=tam, fontweight="bold", color=color, zorder=7)
    if detalle:
        ax.text(x, y - 2.6, detalle, ha="center", va="top", fontsize=tam - 2, color=GRIS, zorder=7, linespacing=1.3)


def servicio(nombre, x, y, titulo, detalle="", alto=9.0):
    icono(nombre, x, y, alto)
    etiqueta(x, y - alto / 2 - 1.2, titulo, detalle)


def grupo(x0, y0, x1, y1, texto, color, icono_nombre=None, discontinuo=False, relleno="none", tam=10):
    ax.add_patch(Rectangle((x0, y0), x1 - x0, y1 - y0, linewidth=1.6, edgecolor=color, facecolor=relleno,
                           linestyle=(0, (5, 3)) if discontinuo else "solid", zorder=1))
    dx = 0
    if icono_nombre:
        ax.add_patch(Rectangle((x0, y1 - 5), 5, 5, facecolor="white", edgecolor="none", zorder=2))
        icono(icono_nombre, x0 + 2.5, y1 - 2.5, 4.6, z=3)
        dx = 6
    ax.text(x0 + dx + 1, y1 - 2.6, texto, ha="left", va="center", fontsize=tam, color=color, fontweight="bold", zorder=3)


def flecha(a, b, num=None, texto="", curva=0.0, discontinua=False, color=FLUJO, pos=0.5, desp=(0, 0), doble=False,
           conexion=None, en=None):
    ax.add_patch(FancyArrowPatch(a, b, arrowstyle="<|-|>" if doble else "-|>", mutation_scale=15, linewidth=1.7, color=color,
                                 connectionstyle=conexion or f"arc3,rad={curva}",
                                 linestyle=(0, (4, 3)) if discontinua else "solid", zorder=4))
    mx = a[0] + (b[0] - a[0]) * pos + desp[0]
    my = a[1] + (b[1] - a[1]) * pos + desp[1]
    if en:
        mx, my = en
    if num:
        ax.add_patch(plt.Circle((mx, my), 1.9, color=NEGRO, zorder=8))
        ax.text(mx, my, str(num), ha="center", va="center", fontsize=10, color="white", fontweight="bold", zorder=9)
    if texto:
        tx = mx + (2.8 if num else 0)
        ax.text(tx, my, texto, ha="left" if num else "center", va="center", fontsize=8.6, color=GRIS, zorder=8,
                bbox=dict(boxstyle="round,pad=0.2", facecolor="white", edgecolor="none", alpha=0.92))


# ───────── encabezado ─────────
ax.text(2, 127.5, "Reu-X · Arquitectura en AWS", fontsize=21, fontweight="bold", color=NEGRO, va="top")
ax.text(2, 122.3, "Amezzi Tech · by Ing. Erick J. Pineda Amézquita · https://reux.amezzi.tech", fontsize=11, color=GRIS, va="top")

# ───────── grupos ─────────
grupo(31, 20, 207, 110, "AWS Cloud · cuenta 937509584902", NEGRO, "aws", tam=11)
grupo(35, 24, 203, 104, "Región us-west-1 (N. California)", REGION, discontinuo=True)
grupo(40, 46, 106, 99, "VPC predeterminada", VPC, "vpc")
grupo(45, 49, 102, 92, "Subred pública", SUBRED, relleno="#f2f8e8")
grupo(49, 52, 99, 85.5, "Grupo de seguridad · entrada solo 80/443", SG, discontinuo=True, tam=9)
grupo(53, 55, 96, 80.5, "Instancia EC2 t4g.small · Amazon Linux 2023", NARANJA, "ec2", relleno="white", tam=9)

# ───────── dentro de la instancia ─────────
icono("caddy", 64, 70, 3.0)
ax.text(64, 66.2, "servidor web\nHTTPS :443", ha="center", va="top", fontsize=8.6, color=GRIS, zorder=7, linespacing=1.3)
icono("nextjs", 85, 69, 8.5)
etiqueta(85, 63.8, "Next.js 16", "Node.js 24 · puerto 3000\ninterfaz, API y acceso", tam=9.5)
flecha((69.5, 69.5), (80.5, 69.5))

# Internet Gateway e IP elástica (borde de la VPC)
icono("internet-gateway", 40, 70, 7)
ax.text(40, 64.4, "Internet\nGateway", ha="center", va="top", fontsize=8.5, color=GRIS, zorder=7,
        bbox=dict(boxstyle="round,pad=0.15", facecolor="white", edgecolor="none"))
ax.text(75, 57.2, "IP elástica 50.18.10.41 · disco gp3 20 GB cifrado · IMDSv2 · sin SSH", ha="center", va="center",
        fontsize=8.3, color=GRIS, zorder=7)

# ───────── servicios regionales ─────────
servicio("s3", 133, 88, "Amazon S3", "entradas/ · transcripciones/\n(se borran a los 7 días)\nconfig/usuarios.json")
servicio("transcribe", 180, 88, "Amazon Transcribe", "voz a texto\nidioma y hablantes")
servicio("parameter-store", 133, 55, "Parameter Store", "/reux/usuario · clave · secreto\n(cifrados)")
servicio("bedrock", 180, 55, "Amazon Bedrock", "Claude Sonnet 4.6\nminuta y visuales")
servicio("systems-manager", 64, 36, "Systems Manager", "Run Command\npublicar sin SSH")
servicio("iam", 104, 36, "AWS IAM", "rol de la instancia\npermisos mínimos")
servicio("cloudformation", 144, 36, "CloudFormation", "stacks reu-x\ny reu-x-servidor")

# ───────── fuera de AWS ─────────
servicio("usuarios", 14, 88, "Usuarios", "administradores, usuarios\ny participantes", alto=10)
servicio("dns", 14, 62, "DNS amezzi.tech", "A: reux → 50.18.10.41", alto=8)
servicio("desarrollador", 14, 36, "Desarrollador", "git push ·\ninfra/publicar.sh", alto=8)
servicio("github", 14, 11, "GitHub", "Reu-X-AmezziTech", alto=7)
servicio("lets-encrypt", 90, 117.5, "Let's Encrypt", "", alto=6.5)

# ───────── flujos ─────────
flecha((19, 88), (36, 72), num=1, texto="HTTPS", pos=0.42)
flecha((43.5, 70), (61.5, 69), pos=0.5)
flecha((14, 76.3), (14, 66.5), texto="resuelve", pos=0.5, color=GRIS)
flecha((19.5, 92), (127.5, 92), num=2, texto="subida directa con URL firmada (PUT)", curva=-0.12, en=(96, 101.6))
flecha((90, 74), (127.5, 85), num="", texto="URL firmada · usuarios", curva=-0.05, pos=0.55, desp=(0, 1.5))
flecha((90.5, 68), (180, 75.5), num=3, texto="trabajos de transcripción", conexion="angle,angleA=0,angleB=90,rad=0", en=(150, 68))
flecha((175.5, 88), (138.5, 88), texto="lee audio · escribe JSON", doble=True, pos=0.5, desp=(0, 4.5), color=GRIS)
flecha((90.5, 65), (180, 60), num=4, texto="minuta, mapa, infografía, flujo", conexion="angle,angleA=0,angleB=90,rad=0", en=(150, 65))
flecha((91, 62), (128.5, 56.5), num=5, texto="credenciales al iniciar", en=(104, 56.8))
flecha((19, 36), (59, 36), num=6, texto="publicar", pos=0.45)
flecha((64, 41.5), (66, 55), discontinua=True, color=GRIS)
flecha((19, 12), (58, 55.5), texto="git pull", discontinua=True, color=GRIS, curva=-0.2, en=(42, 22))
flecha((14, 25.2), (14, 15.5), texto="git push", color=GRIS, pos=0.5)
flecha((90, 112.5), (90, 80.8), texto="certificado TLS", discontinua=True, color=GRIS, en=(90, 107))
flecha((104, 41.5), (92, 55), texto="rol", discontinua=True, color=GRIS, pos=0.5)

# ───────── leyenda ─────────
pasos = [
    ("1", "El usuario entra por HTTPS; Caddy reenvía a Next.js, que valida la sesión y el perfil."),
    ("2", "La grabación sube del navegador directo a S3 con una URL firmada (no pasa por el servidor)."),
    ("3", "La app inicia Amazon Transcribe, que lee el audio de S3 y deja el texto por hablante en S3."),
    ("4", "Claude en Amazon Bedrock redacta la minuta y los visuales con salida estructurada (JSON)."),
    ("5", "Al arrancar, el servidor obtiene usuario, contraseña y secreto de sesión de Parameter Store."),
    ("6", "publicar.sh ordena por Systems Manager: git pull desde GitHub, compilar y reiniciar."),
]
x0, y0 = 31, 15.5
for i, (n, t) in enumerate(pasos):
    col, fila = divmod(i, 3)
    x = x0 + col * 88
    y = y0 - fila * 4.6
    ax.add_patch(plt.Circle((x + 1.5, y), 1.5, color=NEGRO, zorder=8))
    ax.text(x + 1.5, y, n, ha="center", va="center", fontsize=8.5, color="white", fontweight="bold", zorder=9)
    ax.text(x + 4, y, t, ha="left", va="center", fontsize=9, color=NEGRO)

fig.subplots_adjust(left=0.01, right=0.99, top=0.99, bottom=0.01)
fig.savefig(SALIDA, facecolor="white")
print("Generado:", SALIDA)
