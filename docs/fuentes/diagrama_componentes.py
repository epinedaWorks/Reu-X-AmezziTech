"""Diagrama de componentes (UML) de Reu-X: navegador, servidor y servicios de AWS.

Uso:     python docs/fuentes/diagrama_componentes.py
Salida:  docs/Reu-X_Diagrama_Componentes.png
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from aws_estilo import *  # noqa: E402,F403
import aws_estilo as e  # noqa: E402

SALIDA = DOCS / "Reu-X_Diagrama_Componentes.png"
ALTO = 158
lienzo(244, ALTO)
ax = e.ax
encabezado("Reu-X · Diagrama de componentes", "Componentes del navegador y del servidor, interfaces y servicios externos · Amezzi Tech", ALTO)


def dep(puntos, etiqueta="", en=None):
    """Dependencia (línea discontinua con flecha) que puede tener varios tramos."""
    xs, ys = zip(*puntos)
    if len(puntos) > 2:
        ax.plot(xs[:-1], ys[:-1], color=NEGRO, linewidth=1.1, linestyle=(0, (4, 3)), zorder=2.5)
    relacion(puntos[-2], puntos[-1], "dependencia", etiqueta, en=en)


# ───────── Navegador ─────────
nodo(3, 12, 80, 138, "«dispositivo» Navegador web")
reux = componente(6, 112, 71, 20, "Pantalla principal (ReuX)",
                  "carga de la reunión, avance del procesamiento y pestañas\nMinuta · Visuales · Transcripción  —  components/ReuX.tsx")
minuta = componente(6, 94, 71, 14, "Vista de minuta", "acta en dos columnas e impresión  —  MinutaVista.tsx")
visuales = componente(6, 71, 71, 19, "Visuales", "MapaMental (SVG propio) · Infografia (HTML)\nDiagrama (Mermaid) · selector y lienzo  —  Visuales.tsx")
exportar = componente(6, 50, 71, 17, "Exportación", "Word (docx) · Markdown · PDF (impresión)\nPNG/SVG (html-to-image)  —  lib/exportar.ts")
admin = componente(6, 29, 71, 17, "Acceso y administración", "/acceso · AdminUsuarios · BarraSuperior\nperfil y uso del día")
ax.text(41.5, 18.5, "React 19 · Next.js 16 (cliente) · Tailwind CSS", ha="center", fontsize=8.2, color=GRIS, style="italic")
for a, b in ((reux, minuta), (minuta, visuales), (visuales, exportar)):
    relacion((a["x0"] + 8, a["y0"]), (b["x0"] + 8, b["y1"]), "dependencia")

# ───────── Servidor ─────────
nodo(94, 12, 182, 138, "«nodo» Servidor EC2 (Amazon Linux)")
caddy = componente(97, 117, 82, 14, "Caddy", "servidor web HTTPS · certificado de Let's Encrypt")
proxy = componente(97, 98, 82, 14, "Proxy de acceso", "proxy.ts · valida la sesión firmada y el perfil")
w = 26
api_reu = componente(97, 70, w, 22, "API reuniones", "/api/subir\n/api/transcribir\n/api/transcribir/\n  estado")
api_red = componente(125, 70, w, 22, "API redacción", "/api/minuta\n/api/diagrama")
api_usu = componente(153, 70, w, 22, "API usuarios", "/api/acceso\n/api/yo\n/api/usuarios")
srv_aws = componente(97, 36, w, 22, "Integración AWS", "lib/aws.ts\nlib/transcripcion.ts\nURL firmada · S3")
srv_llm = componente(125, 36, w, 22, "Servicio LLM", "lib/llm.ts\nClaude · esquemas\nZod")
srv_usu = componente(153, 36, w, 22, "Usuarios y\ncuotas", "lib/usuarios.ts\nautorizacion.ts\nsesion.ts")
ax.text(138, 15.5, "Next.js 16 (servidor) · Node.js 24 · systemd", ha="center", fontsize=8.2, color=GRIS, style="italic")

relacion((caddy["cx"], caddy["y0"]), (proxy["cx"], proxy["y1"]), "dependencia", "reenvía :3000", en=(caddy["cx"] + 16, 114.5))
for api in (api_reu, api_red, api_usu):
    relacion((api["cx"], proxy["y0"]), (api["cx"], api["y1"]), "dependencia")
relacion((api_reu["cx"], api_reu["y0"]), (srv_aws["cx"], srv_aws["y1"]), "dependencia")
relacion((api_red["cx"], api_red["y0"]), (srv_llm["cx"], srv_llm["y1"]), "dependencia")
relacion((api_usu["cx"], api_usu["y0"]), (srv_usu["cx"], srv_usu["y1"]), "dependencia")
relacion((api_red["x1"] - 3, api_red["y0"]), (srv_usu["x0"] + 3, srv_usu["y1"]), "dependencia", "cuota", en=(150, 63))
relacion((api_reu["x1"] - 3, api_reu["y0"]), (srv_usu["x0"] + 1, srv_usu["y1"] - 3), "dependencia")

# Interfaz pública del servidor
interfaz(88, 124, "HTTPS\n/api/* (JSON)", lado="arriba")
ax.plot([89.3, 97], [124, 124], color=NEGRO, linewidth=1.1, zorder=2.5)
dep([(77, 124), (86.7, 124)])

# ───────── Servicios AWS ─────────
nodo(194, 12, 240, 138, "Servicios AWS")
for nombre, y, titulo, detalle in (
    ("s3", 116, "Amazon S3", "entradas/ · transcripciones/\nconfig/usuarios.json"),
    ("transcribe", 89, "Amazon Transcribe", "voz a texto · hablantes"),
    ("bedrock", 62, "Amazon Bedrock", "Claude Sonnet 4.6"),
    ("parameter-store", 35, "Parameter Store", "/reux/* (cifrado)"),
):
    servicio(nombre, 217, y, titulo, detalle, alto=8)

# Interfaz de S3 para la subida directa desde el navegador
interfaz(205, 120, "PUT con\nURL firmada", lado="arriba")
ax.plot([206.3, 212], [120, 120], color=NEGRO, linewidth=1.1, zorder=2.5)
dep([(60, 132), (60, 143), (205, 143), (205, 121.4)], "subida directa de la grabación", en=(130, 143))

# Del servidor a AWS
# Cada línea baja de su componente a un carril propio y luego sube al servicio.
dep([(104, 36), (104, 31.5), (186, 31.5), (186, 116), (212.5, 116)], "S3: firmar URL, leer JSON", en=(192, 104))
dep([(116, 36), (116, 28.5), (188.5, 28.5), (188.5, 89), (212.5, 89)], "inicia y consulta trabajos", en=(201, 92.5))
dep([(138, 36), (138, 25.5), (191, 25.5), (191, 62), (212.5, 62)], "messages.parse", en=(203, 65))
dep([(166, 36), (166, 22.5), (209, 22.5), (209, 35), (212.5, 35)], "credenciales al iniciar", en=(198, 22.5))

# leyenda
lx, ly = 3, 4.5
relacion((lx, ly), (lx + 8, ly), "dependencia")
ax.text(lx + 10, ly, "dependencia (usa)", va="center", fontsize=8, color=GRIS)
interfaz(lx + 42, ly, "")
ax.text(lx + 45, ly, "interfaz provista", va="center", fontsize=8, color=GRIS)
ax.text(lx + 72, ly, "«componente» módulo con responsabilidad propia · caja 3D: nodo de ejecución", va="center", fontsize=8, color=GRIS)

guardar(SALIDA)
