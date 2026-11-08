#!/usr/bin/env bash
# Cadastra uma base de usuários em uma API local.
# Regra: username e senha são sempre iguais.
#
# Uso:
#   ./cadastrar_usuarios.sh
#
# Variáveis opcionais:
#   API_BASE_URL   (padrão: http://localhost:5000)
#   ENDPOINT_PATH  (padrão: /users)  <- ajuste para a rota real da sua API

set -uo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:5000}"
ENDPOINT_PATH="${ENDPOINT_PATH:-/auth/register}"
URL="${API_BASE_URL%/}${ENDPOINT_PATH}"

# --- Base de usuários (edite esta lista) -----------------------------------
USUARIOS=(
  "joao.silva"
  "maria.souza"
  "carlos.lima"
  "ana.pereira"
  "pedro.santos"
  "jose.santos"
  "heloise.maria"
  "antonio.oliveira"
)

# --- Cadastro --------------------------------------------------------------
ok=0; fail=0
echo "Endpoint: $URL"
echo "Total de usuários: ${#USUARIOS[@]}"
echo "----------------------------------------"

for u in "${USUARIOS[@]}"; do
  # Evita quebrar o JSON com caracteres especiais
  if [[ ! "$u" =~ ^[A-Za-z0-9._@-]+$ ]]; then
    echo "[PULADO] '$u' contém caracteres inválidos"
    ((fail++)); continue
  fi

  payload=$(printf '{"username":"%s","password":"%s"}' "$u" "$u")

  status=$(curl -s -o /tmp/resp_cadastro.txt -w '%{http_code}' \
    -X POST "$URL" \
    -H "Content-Type: application/json" \
    -d "$payload")

  if [[ "$status" =~ ^2 ]]; then
    echo "[OK]    $u (HTTP $status)"
    ((ok++))
  else
    echo "[ERRO]  $u (HTTP $status) -> $(cat /tmp/resp_cadastro.txt)"
    ((fail++))
  fi
done

rm -f /tmp/resp_cadastro.txt
echo "----------------------------------------"
echo "Sucesso: $ok | Falhas: $fail"