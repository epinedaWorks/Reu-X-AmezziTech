"""Genera los diagramas de la documentación técnica de Reu-X (PNG).

Uso:  python docs/fuentes/diagramas.py
Salida: docs/fuentes/arquitectura.png y docs/fuentes/flujo.png
"""
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch

SALIDA = Path(__file__).parent
MARCA = "#1b2a41"
ACENTO = "#9a7b4f"
TINTA = "#1f2733"
TENUE = "#5b6574"
BORDE = "#c9d0da"
SUAVE = "#e8ecf2"
AWS = "#c7700f"
FONDO_AWS = "#fff8ef"

plt.rcParams["font.family"] = "DejaVu Sans"


def caja(ax, x, y, w, h, titulo, detalle="", color=MARCA, fondo="white", tam=11, borde=1.6, estilo="round,pad=0.02,rounding_size=0.8"):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle=estilo, linewidth=borde, edgecolor=color, facecolor=fondo, zorder=3))
    if detalle:
        ax.text(x + w / 2, y + h * 0.64, titulo, ha="center", va="center", fontsize=tam, fontweight="bold", color=color, zorder=4)
        ax.text(x + w / 2, y + h * 0.30, detalle, ha="center", va="center", fontsize=tam - 2.6, color=TENUE, zorder=4, linespacing=1.25)
    else:
        ax.text(x + w / 2, y + h / 2, titulo, ha="center", va="center", fontsize=tam, fontweight="bold", color=color, zorder=4)


def flecha(ax, a, b, texto="", color=MARCA, curva=0.0, estilo="-|>", lw=1.6, desp=(0, 0), discontinua=False, num=None):
    ax.add_patch(
        FancyArrowPatch(
            a, b, arrowstyle=estilo, mutation_scale=14, linewidth=lw, color=color, zorder=2,
            connectionstyle=f"arc3,rad={curva}", linestyle=(0, (4, 3)) if discontinua else "solid",
        )
    )
    if texto or num:
        mx, my = (a[0] + b[0]) / 2 + desp[0], (a[1] + b[1]) / 2 + desp[1]
        etiqueta = f"{num}  {texto}" if num else texto
        ax.text(mx, my, etiqueta, ha="center", va="center", fontsize=8.6, color=color, zorder=5,
                bbox=dict(boxstyle="round,pad=0.25", facecolor="white", edgecolor="none", alpha=0.95))


def arquitectura():
    fig, ax = plt.subplots(figsize=(16, 10.2), dpi=170)
    ax.set_xlim(0, 160)
    ax.set_ylim(0, 102)
    ax.axis("off")

    ax.text(2, 99, "Reu-X · Arquitectura en AWS", fontsize=19, fontweight="bold", color=MARCA, va="top")
    ax.text(2, 94.6, "Amezzi Tech · Producción: https://reux.amezzi.tech · Región us-west-1 (N. California)", fontsize=10.5, color=TENUE, va="top")

    # Nube AWS
    ax.add_patch(FancyBboxPatch((44, 6), 113, 80, boxstyle="round,pad=0.02,rounding_size=2", linewidth=1.6,
                                edgecolor=AWS, facecolor=FONDO_AWS, linestyle=(0, (6, 3)), zorder=1))
    ax.text(47, 83.2, "Nube AWS · cuenta 937509584902 · us-west-1", fontsize=11, fontweight="bold", color=AWS)

    # VPC / EC2
    ax.add_patch(FancyBboxPatch((48, 38), 50, 40, boxstyle="round,pad=0.02,rounding_size=1.5", linewidth=1.3,
                                edgecolor=BORDE, facecolor="#f6f8fb", zorder=1.5))
    ax.text(50, 75.3, "EC2 t4g.small · Amazon Linux 2023 · IP elástica 50.18.10.41", fontsize=9.2, fontweight="bold", color=TINTA)
    caja(ax, 51, 61, 44, 10, "Caddy", "HTTPS automático (Let's Encrypt) · puerto 443", tam=11)
    caja(ax, 51, 41, 44, 16.5, "Aplicación Next.js 16 (Node 24)",
         "Interfaz web · Rutas API (/api/*)\nProxy de acceso (sesión firmada, perfiles)\nservicio systemd: reux", fondo=SUAVE, tam=11)
    flecha(ax, (73, 61), (73, 57.5), "", lw=1.4)

    # Servicios
    caja(ax, 108, 63, 45, 13, "Amazon S3", "bucket reu-x-…-us-west-1\nentradas/ · transcripciones/ · config/usuarios.json", color=AWS, tam=11)
    caja(ax, 108, 44, 45, 12, "Amazon Transcribe", "Voz a texto · idioma y hablantes", color=AWS, tam=11)
    caja(ax, 108, 25, 45, 12, "Amazon Bedrock", "Claude Sonnet 4.6 · minuta y visuales", color=AWS, tam=11)
    caja(ax, 48, 22, 26, 11, "Parameter Store", "/reux/usuario · clave · secreto", color=AWS, tam=10)
    caja(ax, 77, 22, 26, 11, "IAM (rol de la instancia)", "permisos mínimos", color=AWS, tam=10)
    caja(ax, 48, 9, 26, 10, "Systems Manager", "Run Command (publicar)", color=AWS, tam=10)
    caja(ax, 77, 9, 26, 10, "CloudFormation", "stacks reu-x y reu-x-servidor", color=AWS, tam=10)
    caja(ax, 108, 9, 45, 10, "Grupo de seguridad", "solo 80/443 entrantes · sin SSH", color=AWS, tam=10)

    # Externos
    caja(ax, 3, 62, 34, 16, "Usuarios", "Navegador web\nadministradores, usuarios\ny participantes", tam=12)
    caja(ax, 3, 40, 34, 11, "DNS amezzi.tech", "registro A: reux → 50.18.10.41", color=TENUE, tam=10.5)
    caja(ax, 3, 22, 34, 11, "GitHub", "epinedaWorks/Reu-X-AmezziTech", color=TENUE, tam=10.5)
    caja(ax, 3, 6, 34, 11, "Desarrollador", "git push · bash infra/publicar.sh", color=TENUE, tam=10.5)

    # Flujos principales
    flecha(ax, (37, 71), (51, 66.5), "HTTPS", num="1", desp=(0, 2.2))
    flecha(ax, (20, 62), (20, 51), "resuelve", color=TENUE, desp=(5, 0))
    flecha(ax, (37, 76), (108, 72.5), "subida directa con URL firmada (PUT)", num="2", curva=-0.12, color=AWS, desp=(0, 6.5))
    flecha(ax, (95, 54), (108, 68), "URL firmada y\nlectura de\ntranscripción", num="", desp=(4.5, -4), curva=0.15)
    flecha(ax, (95, 50), (108, 50), "inicia y consulta trabajos", num="3", desp=(0, 2.2))
    flecha(ax, (130.5, 56), (130.5, 63), "lee audio / escribe JSON", color=AWS, desp=(9.5, 0))
    flecha(ax, (95, 45), (108, 32), "minuta y\nvisuales", num="4", desp=(3, 0.5), curva=-0.1)
    flecha(ax, (62, 41), (61, 33), "credenciales de acceso", num="5", desp=(-4, 0.5))
    flecha(ax, (88, 33), (86, 41), "permisos", color=AWS, desp=(-5, 0))
    flecha(ax, (37, 11.5), (48, 13.5), "publicar", num="6", desp=(0, 2.2))
    flecha(ax, (74.5, 18), (75.5, 41), "", discontinua=True)
    flecha(ax, (37, 27.5), (51, 44), "git pull", discontinua=True, color=TENUE, desp=(-2, 3), curva=0.15)
    flecha(ax, (20, 17), (20, 22), "git push", color=TENUE, desp=(5, 0))

    leyenda = [
        "1  El navegador entra por HTTPS a Caddy, que reenvía a la app (127.0.0.1:3000).",
        "2  Las grabaciones suben directo del navegador a S3 con una URL firmada (no pasan por el servidor).",
        "3  La app inicia Amazon Transcribe, que lee el audio de S3 y deja la transcripción en S3.",
        "4  Claude en Bedrock redacta la minuta y los visuales con salida estructurada (JSON).",
        "5  Al arrancar, el servidor lee el usuario, la contraseña y el secreto de sesión de Parameter Store.",
        "6  publicar.sh ordena por Systems Manager: git pull, compilar y reiniciar (sin SSH).",
    ]
    fig.text(0.012, 0.012, "\n".join(leyenda), fontsize=8.8, color=TINTA, va="bottom", linespacing=1.45)
    fig.subplots_adjust(left=0.01, right=0.99, top=0.99, bottom=0.13)
    fig.savefig(SALIDA / "arquitectura.png", facecolor="white")
    plt.close(fig)


def flujo():
    fig, ax = plt.subplots(figsize=(16, 6.4), dpi=170)
    ax.set_xlim(0, 160)
    ax.set_ylim(0, 64)
    ax.axis("off")
    ax.text(2, 62, "Reu-X · Flujo de procesamiento de una reunión", fontsize=17, fontweight="bold", color=MARCA, va="top")

    pasos = [
        ("1. Carga", "Grabación (audio/video)\no texto + datos\nopcionales", MARCA),
        ("2. Subida", "URL firmada → S3\nentradas/ (cifrado,\nse borra a los 7 días)", AWS),
        ("3. Transcripción", "Amazon Transcribe\nidioma + hablantes\n[mm:ss] Hablante N", AWS),
        ("4. Minuta", "Claude (Bedrock)\nsalida estructurada\n(esquema Zod)", AWS),
        ("5. Revisión", "Acta en dos columnas\neditar transcripción\ny regenerar", MARCA),
        ("6. Compartir", "Word · PDF · Markdown\nmapa mental · infografía\nflujo · responsables", MARCA),
    ]
    w, h, y = 22.5, 22, 26
    for i, (t, d, c) in enumerate(pasos):
        x = 3 + i * 26
        caja(ax, x, y, w, h, t, d, color=c, fondo=SUAVE if c == MARCA else "white", tam=12)
        if i < len(pasos) - 1:
            flecha(ax, (x + w, y + h / 2), (x + 26, y + h / 2), lw=2)

    ax.text(3, 19.5, "Si la fuente es texto, se omiten los pasos 2 y 3.", fontsize=10, color=TENUE)
    ax.text(3, 15.2, "Cada llamada a la API verifica la sesión y el perfil; el límite diario de minutas se descuenta al completar el paso 4.", fontsize=10, color=TENUE)
    ax.text(3, 10.9, "Los visuales (mapa mental, infografía, flujo) se generan bajo demanda con otra llamada a Claude; 'responsables' se arma sin IA.", fontsize=10, color=TENUE)
    ax.text(3, 6.6, "Tiempos típicos: transcripción ≈ 25–50 % de la duración del audio · minuta ≈ 20–40 s · cada visual ≈ 10–30 s.", fontsize=10, color=TENUE)
    fig.subplots_adjust(left=0.01, right=0.99, top=0.99, bottom=0.02)
    fig.savefig(SALIDA / "flujo.png", facecolor="white")
    plt.close(fig)


if __name__ == "__main__":
    arquitectura()
    flujo()
    print("ok")
