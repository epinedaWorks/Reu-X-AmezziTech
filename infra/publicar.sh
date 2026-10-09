#!/bin/bash
# Publica en el servidor la última versión que está en GitHub (rama main).
# Uso: bash infra/publicar.sh   (requiere sesión de AWS: aws login --profile reux)
set -euo pipefail
export MSYS_NO_PATHCONV=1

PERFIL=${AWS_PROFILE:-reux}
REGION=us-west-1
AWS="aws --profile $PERFIL --region $REGION"

INSTANCIA=$($AWS cloudformation describe-stacks --stack-name reu-x-servidor \
  --query "Stacks[0].Outputs[?OutputKey=='Instancia'].OutputValue" --output text)

ORDEN=$($AWS ssm send-command --instance-ids "$INSTANCIA" --document-name AWS-RunShellScript \
  --comment "Publicar Reu-X" --parameters 'commands=["bash /opt/reux/infra/servidor/actualizar.sh"]' \
  --timeout-seconds 900 --query Command.CommandId --output text)

echo "Publicando en $INSTANCIA (orden $ORDEN)…"
$AWS ssm wait command-executed --command-id "$ORDEN" --instance-id "$INSTANCIA" || true
$AWS ssm get-command-invocation --command-id "$ORDEN" --instance-id "$INSTANCIA" \
  --query "[Status, StandardOutputContent, StandardErrorContent]" --output text | tail -20
