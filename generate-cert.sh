#!/bin/sh
# Generates a self-signed TLS certificate for use with Telegram webhooks.
# Telegram accepts self-signed certs when you upload cert.pem during bot connect.
#
# Usage: ./generate-cert.sh <IP_OR_DOMAIN>
# Example: ./generate-cert.sh 109.73.193.125

set -eu

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <IP_OR_DOMAIN>" >&2
  exit 1
fi

HOST="$1"
OUT_DIR="nginx/certs"

mkdir -p "$OUT_DIR"

openssl req -x509 \
  -newkey rsa:2048 \
  -keyout "$OUT_DIR/key.pem" \
  -out "$OUT_DIR/cert.pem" \
  -days 3650 \
  -nodes \
  -subj "/CN=$HOST" \
  -addext "subjectAltName=IP:$HOST"

echo "Certificate generated:"
echo "  $OUT_DIR/cert.pem  (public cert — uploaded to Telegram)"
echo "  $OUT_DIR/key.pem   (private key — keep secret)"
