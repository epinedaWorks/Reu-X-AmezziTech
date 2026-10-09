#!/bin/bash
# Arma /etc/reux/reux.env con la configuración del servidor y las credenciales de
# acceso guardadas en Parameter Store (/reux/usuario, /reux/clave, /reux/secreto).
set -euo pipefail
# shellcheck disable=SC1091
source /etc/reux/config

leer() {
  aws ssm get-parameter --region "$REUX_AWS_REGION" --name "$1" --with-decryption --query Parameter.Value --output text
}

umask 077
{
  cat /etc/reux/config
  echo "REUX_USUARIO=$(leer /reux/usuario)"
  echo "REUX_CLAVE=$(leer /reux/clave)"
  echo "REUX_SECRETO=$(leer /reux/secreto)"
  echo "NODE_ENV=production"
} > /etc/reux/reux.env.tmp
mv /etc/reux/reux.env.tmp /etc/reux/reux.env
