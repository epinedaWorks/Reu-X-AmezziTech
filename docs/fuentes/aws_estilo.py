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


# ───────── UML ─────────
import math  # noqa: E402

from matplotlib.patches import Polygon  # noqa: E402

AZUL_CLASE = "#e8ecf2"
NARANJA_MODULO = "#fff1dc"
MONO = "DejaVu Sans Mono"
LH = 2.55  # alto de línea en clases


def paquete(x0, y0, x1, y1, nombre, color=GRIS):
    """Paquete UML: rectángulo con pestaña y nombre."""
    ancho_tab = min(len(nombre) * 1.15 + 4, x1 - x0)
    ax.add_patch(Rectangle((x0, y1), ancho_tab, 3.6, facecolor="#f4f5f7", edgecolor=color, linewidth=1.2, zorder=1))
    ax.add_patch(Rectangle((x0, y0), x1 - x0, y1 - y0, facecolor="#fbfbfc", edgecolor=color, linewidth=1.2, zorder=0.5))
    ax.text(x0 + 2, y1 + 1.8, nombre, ha="left", va="center", fontsize=9.5, fontweight="bold", color=NEGRO, zorder=2)


def clase(x, top, w, nombre, atributos=(), metodos=(), estereotipo=None, fondo=AZUL_CLASE, borde=NEGRO):
    """Clase UML con compartimentos. Devuelve sus límites."""
    cab = 4.4 + (2.3 if estereotipo else 0)
    h_atr = len(atributos) * LH + 1.4 if atributos else 1.4
    h_met = len(metodos) * LH + 1.4 if metodos else 0
    h = cab + h_atr + h_met
    y0 = top - h
    ax.add_patch(Rectangle((x, y0), w, h, facecolor="white", edgecolor=borde, linewidth=1.3, zorder=3))
    ax.add_patch(Rectangle((x, top - cab), w, cab, facecolor=fondo, edgecolor=borde, linewidth=1.3, zorder=3))
    if estereotipo:
        ax.text(x + w / 2, top - 1.7, f"«{estereotipo}»", ha="center", va="center", fontsize=7.6, style="italic", color=GRIS, zorder=4)
    ax.text(x + w / 2, top - cab + 2.1, nombre, ha="center", va="center", fontsize=9.4, fontweight="bold", color=NEGRO, zorder=4)
    y = top - cab - 0.7
    for a in atributos:
        ax.text(x + 1.2, y - LH / 2, a, ha="left", va="center", fontsize=7.5, family=MONO, color=NEGRO, zorder=4)
        y -= LH
    if metodos:
        y = top - cab - h_atr
        ax.plot([x, x + w], [y, y], color=borde, linewidth=1.0, zorder=4)
        y -= 0.7
        for m in metodos:
            ax.text(x + 1.2, y - LH / 2, m, ha="left", va="center", fontsize=7.5, family=MONO, color=NEGRO, zorder=4)
            y -= LH
    return {"x0": x, "x1": x + w, "y0": y0, "y1": top, "cx": x + w / 2, "cy": y0 + h / 2}


def relacion(a, b, tipo="asociacion", etiqueta="", mult=None, color=NEGRO, en=None):
    """Relación UML de a hacia b.
    composicion: rombo lleno en a (el todo) · dependencia: discontinua con flecha abierta en b ·
    asociacion: línea con flecha abierta en b."""
    (x1, y1), (x2, y2) = a, b
    estilo = (0, (4, 3)) if tipo == "dependencia" else "solid"
    ax.plot([x1, x2], [y1, y2], color=color, linewidth=1.1, linestyle=estilo, zorder=2.5)
    d = math.hypot(x2 - x1, y2 - y1) or 1
    ux, uy = (x2 - x1) / d, (y2 - y1) / d
    px, py = -uy, ux
    if tipo == "composicion":
        L, W = 2.6, 1.1
        pts = [(x1, y1), (x1 + ux * L / 2 + px * W, y1 + uy * L / 2 + py * W), (x1 + ux * L, y1 + uy * L),
               (x1 + ux * L / 2 - px * W, y1 + uy * L / 2 - py * W)]
        ax.add_patch(Polygon(pts, closed=True, facecolor=color, edgecolor=color, zorder=5))
    else:
        L, W = 2.0, 1.0
        ax.plot([x2 - ux * L + px * W, x2, x2 - ux * L - px * W], [y2 - uy * L + py * W, y2, y2 - uy * L - py * W],
                color=color, linewidth=1.1, zorder=5)
    if mult:
        ax.text(x2 - ux * 3.2 + px * 1.6, y2 - uy * 3.2 + py * 1.6, mult, ha="center", va="center", fontsize=7.6, color=GRIS, zorder=6)
    if etiqueta:
        mx, my = en or ((x1 + x2) / 2, (y1 + y2) / 2)
        ax.text(mx, my, etiqueta, ha="center", va="center", fontsize=7.6, color=GRIS, style="italic", zorder=6,
                bbox=dict(boxstyle="round,pad=0.15", facecolor="white", edgecolor="none"))


def componente(x, y, w, h, nombre, detalle="", fondo="white", borde=NEGRO):
    """Componente UML (rectángulo con el símbolo de componente)."""
    ax.add_patch(Rectangle((x, y), w, h, facecolor=fondo, edgecolor=borde, linewidth=1.3, zorder=3))
    sx, sy = x + w - 4.2, y + h - 3.8
    ax.add_patch(Rectangle((sx, sy - 2.6), 2.8, 3.0, facecolor="white", edgecolor=borde, linewidth=0.9, zorder=4))
    for dy in (0.15, -1.3):
        ax.add_patch(Rectangle((sx - 0.7, sy + dy - 0.9), 1.4, 0.7, facecolor="white", edgecolor=borde, linewidth=0.9, zorder=5))
    ax.text(x + 1.6, y + h - 2.3, "«componente»", ha="left", va="center", fontsize=7, style="italic", color=GRIS, zorder=4)
    ax.text(x + 1.6, y + h - 5.0, nombre, ha="left", va="center", fontsize=9, fontweight="bold", color=NEGRO, zorder=4)
    if detalle:
        ax.text(x + 1.6, y + h - 7.6, detalle, ha="left", va="top", fontsize=7.4, color=GRIS, zorder=4, linespacing=1.3)
    return {"x0": x, "x1": x + w, "y0": y, "y1": y + h, "cx": x + w / 2, "cy": y + h / 2}


def interfaz(x, y, nombre, lado="arriba"):
    """Interfaz provista (círculo, notación «lollipop»)."""
    ax.add_patch(plt.Circle((x, y), 1.3, facecolor="white", edgecolor=NEGRO, linewidth=1.2, zorder=6))
    off = {"arriba": (0, 2.6, "center", "bottom"), "abajo": (0, -2.6, "center", "top"),
           "izquierda": (-2.2, 0, "right", "center"), "derecha": (2.2, 0, "left", "center")}[lado]
    ax.text(x + off[0], y + off[1], nombre, ha=off[2], va=off[3], fontsize=7.6, color=NEGRO, zorder=6,
            bbox=dict(boxstyle="round,pad=0.12", facecolor="white", edgecolor="none"))


def nodo(x0, y0, x1, y1, nombre, color=GRIS, relleno="#f7f8fa"):
    """Nodo de despliegue UML (caja 3D simple)."""
    p = 2.0
    ax.add_patch(Polygon([(x0, y1), (x0 + p, y1 + p), (x1 + p, y1 + p), (x1, y1)], closed=True, facecolor="#e9ecf0", edgecolor=color, linewidth=1.2, zorder=0.6))
    ax.add_patch(Polygon([(x1, y0), (x1 + p, y0 + p), (x1 + p, y1 + p), (x1, y1)], closed=True, facecolor="#dde1e7", edgecolor=color, linewidth=1.2, zorder=0.6))
    ax.add_patch(Rectangle((x0, y0), x1 - x0, y1 - y0, facecolor=relleno, edgecolor=color, linewidth=1.2, zorder=0.7))
    ax.text(x0 + 1.8, y1 - 2.4, nombre, ha="left", va="center", fontsize=10, fontweight="bold", color=NEGRO, zorder=2)
