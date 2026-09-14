#!/bin/bash
# Uruchamia Ogarniacza lokalnie. Zatrzymanie: Ctrl+C
cd "$(dirname "$0")" || exit 1
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
PORT=8777
echo ""
echo "  Ogarniacz dziala."
echo "  Na Macu:      http://localhost:$PORT"
[ -n "$IP" ] && echo "  W tej samej sieci Wi-Fi (iPhone): http://$IP:$PORT"
echo ""
echo "  Zatrzymanie: Ctrl+C"
echo ""
open "http://localhost:$PORT" 2>/dev/null
python3 -m http.server "$PORT" --bind 0.0.0.0
