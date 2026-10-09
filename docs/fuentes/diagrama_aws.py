"""Diagrama de arquitectura de Reu-X al estilo de AWS (íconos oficiales).

Uso:     python docs/fuentes/diagrama_aws.py
Salida:  docs/Reu-X_Arquitectura_AWS.png
Íconos:  docs/fuentes/iconos/ (AWS Architecture Icons y logos de terceros, vía el paquete
         `diagrams`; se usan solo para representar la arquitectura).
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from aws_estilo import *  # noqa: E402,F403
import aws_estilo as e  # noqa: E402

SALIDA = DOCS / "Reu-X_Arquitectura_AWS.png"
lienzo(210, 130)
ax = e.ax

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
leyenda(pasos, 31, 15.5)

guardar(SALIDA)
