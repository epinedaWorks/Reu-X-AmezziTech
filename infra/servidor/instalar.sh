#!/bin/bash
# Instalación inicial del servidor (Amazon Linux 2023, ARM). La ejecuta el UserData
# de infra/servidor.yaml como root, con el repositorio ya clonado en /opt/reux.
set -euxo pipefail

NODE_VERSION=24.13.1
DIR=/opt/reux/infra/servidor

# Memoria de intercambio: la compilación de Next.js necesita más de 2 GB a ratos.
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile swap swap defaults 0 0' >> /etc/fstab
fi

# Node.js (misma versión que en desarrollo).
curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-arm64.tar.xz" \
  | tar -xJ -C /usr/local --strip-components=1

# Caddy: servidor web con HTTPS automático (Let's Encrypt).
curl -fsSL "https://caddyserver.com/api/download?os=linux&arch=arm64" -o /usr/local/bin/caddy
chmod 755 /usr/local/bin/caddy

id reux >/dev/null 2>&1 || useradd --system --home-dir /opt/reux --shell /sbin/nologin reux
id caddy >/dev/null 2>&1 || useradd --system --home-dir /var/lib/caddy --create-home --shell /sbin/nologin caddy
chown -R reux:reux /opt/reux

mkdir -p /etc/caddy
install -m 644 "$DIR/Caddyfile" /etc/caddy/Caddyfile
install -m 644 "$DIR/reux-entorno.service" "$DIR/reux.service" "$DIR/caddy.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now caddy

# Compila la app y la arranca.
sudo -u reux HOME=/opt/reux bash -c 'cd /opt/reux && npm ci && npm run build'
systemctl enable --now reux-entorno reux
