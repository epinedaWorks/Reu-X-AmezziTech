"""Utilidades compartidas para dibujar diagramas al estilo de AWS (íconos oficiales).

Los íconos están en docs/fuentes/iconos/ (AWS Architecture Icons y logos de terceros,
tomados del paquete `diagrams`; se usan solo para representar la arquitectura).
"""
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch, Rectangle
from PIL import Image

AQUI = Path(__file__).parent
ICONOS = AQUI / "iconos"
DOCS = AQUI.parent

NEGRO = "#232f3e"
GRIS = "#545b64"
NARANJA = "#ff9900"
REGION = "#00a4a6"
VPC = "#8c4fff"
SUBRED = "#7aa116"
SG = "#dd344c"
FLUJO = "#232f3e"

plt.rcParams["font.family"] = "DejaVu Sans"

fig = None
ax = None


def lienzo(ancho, alto):
    """Crea la figura; 1 unidad = 1/10 de pulgada en ambos ejes."""
    global fig, ax
    fig, ax = plt.subplots(figsize=(ancho / 10, alto / 10), dpi=150)
    ax.set_xlim(0, ancho)
    ax.set_ylim(0, alto)
    ax.set_aspect("equal")
    ax.axis("off")
    return fig, ax


def guardar(ruta):
    fig.subplots_adjust(left=0.01, right=0.99, top=0.99, bottom=0.01)
    fig.savefig(ruta, facecolor="white")
    plt.close(fig)
    print("Generado:", ruta)


def encabezado(titulo, subtitulo, alto):
    ax.text(2, alto - 2.5, titulo, fontsize=21, fontweight="bold", color=NEGRO, va="top")
    ax.text(2, alto - 7.7, subtitulo, fontsize=11, color=GRIS, va="top")


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


def tarjeta(x0, y0, x1, y1, titulo, lineas, color=NEGRO):
    """Recuadro de texto (por ejemplo, resultados o notas)."""
    ax.add_patch(FancyBboxPatch((x0, y0), x1 - x0, y1 - y0, boxstyle="round,pad=0,rounding_size=1.2",
                                linewidth=1.4, edgecolor=color, facecolor="white", zorder=2))
    ax.text(x0 + 2, y1 - 2.4, titulo, ha="left", va="top", fontsize=10.5, fontweight="bold", color=color, zorder=3)
    for i, linea in enumerate(lineas):
        ax.text(x0 + 2, y1 - 7 - i * 3.6, linea, ha="left", va="top", fontsize=9, color=NEGRO, zorder=3)


def numero(x, y, n, radio=1.9, tam=10):
    ax.add_patch(plt.Circle((x, y), radio, color=NEGRO, zorder=8))
    ax.text(x, y, str(n), ha="center", va="center", fontsize=tam, color="white", fontweight="bold", zorder=9)


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
        numero(mx, my, num)
    if texto:
        tx = mx + (2.8 if num else 0)
        ax.text(tx, my, texto, ha="left" if num else "center", va="center", fontsize=8.6, color=GRIS, zorder=8,
                bbox=dict(boxstyle="round,pad=0.2", facecolor="white", edgecolor="none", alpha=0.92))


def leyenda(pasos, x0, y0, columnas=2, ancho_col=88, paso_y=4.6):
    filas = (len(pasos) + columnas - 1) // columnas
    for i, (n, t) in enumerate(pasos):
        col, fila = divmod(i, filas)
        x = x0 + col * ancho_col
        y = y0 - fila * paso_y
        numero(x + 1.5, y, n, radio=1.5, tam=8.5)
        ax.text(x + 4, y, t, ha="left", va="center", fontsize=9, color=NEGRO)
