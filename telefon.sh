#!/bin/bash
# Odpala Ogarniacza z adresem HTTPS, zeby mikrofon dzialal na iPhonie.
# Darmowe, bez konta. Zatrzymanie: Ctrl+C
cd "$(dirname "$0")" || exit 1
PORT=8777

sprzatnij(){ kill $SERWER $TUNEL 2>/dev/null; exit 0; }
trap sprzatnij INT TERM

# 1. serwer plikow
python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERWER=$!
sleep 1

# 2. tunel HTTPS
LOG=$(mktemp)
cloudflared tunnel --url "http://localhost:$PORT" --no-autoupdate >"$LOG" 2>&1 &
TUNEL=$!

echo ""
echo "  Szukam adresu HTTPS..."
ADRES=""
for i in $(seq 1 40); do
  ADRES=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$LOG" | head -1)
  [ -n "$ADRES" ] && break
  sleep 1
done

if [ -z "$ADRES" ]; then
  echo "  Nie udalo sie zbudowac tunelu. Log: $LOG"
  sprzatnij
fi

echo ""
echo "  ================================================"
echo "   Otworz ten adres w Safari na iPhonie:"
echo ""
echo "   $ADRES"
echo ""
echo "   Potem: Udostepnij -> Dodaj do ekranu poczatkowego"
echo "  ================================================"
echo ""
if ! nslookup "${ADRES#https://}" >/dev/null 2>&1; then
  echo "  UWAGA: Twoj router nie rozwiazuje tego adresu (ochrona DNS rebind)."
  echo "  Jesli na iPhonie nie chce sie otworzyc przez Wi-Fi — wylacz Wi-Fi"
  echo "  i wejdz przez LTE. Tunel dziala przez internet, wiec zadziala."
  echo ""
fi

echo "  Na Macu tez dziala: http://localhost:$PORT"
echo "  Zatrzymanie: Ctrl+C  (adres przestanie dzialac)"
echo ""

command -v qrencode >/dev/null && qrencode -t ANSIUTF8 "$ADRES"

printf '%s' "$ADRES" | pbcopy 2>/dev/null && echo "  (adres skopiowany do schowka)"
echo ""

wait $TUNEL
