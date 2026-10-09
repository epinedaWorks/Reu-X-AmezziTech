#!/bin/bash
# Publica la última versión de GitHub: descarga, compila y reinicia la app.
# Se ejecuta en el servidor como root (por SSM desde infra/publicar.sh).
set -euo pipefail

cd /opt/reux
sudo -u reux HOME=/opt/reux git pull --ff-only
sudo -u reux HOME=/opt/reux bash -c 'npm ci && npm run build'

# Por si cambiaron los archivos de servicio o el Caddyfile.
install -m 644 infra/servidor/reux-entorno.service infra/servidor/reux.service infra/servidor/caddy.service /etc/systemd/system/
install -m 644 infra/servidor/Caddyfile /etc/caddy/Caddyfile
systemctl daemon-reload
systemctl restart reux-entorno reux
systemctl reload caddy || systemctl restart caddy

echo "Publicada la versión $(sudo -u reux git rev-parse --short HEAD)"
