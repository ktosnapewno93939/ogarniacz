#!/bin/bash
# Wgrywa aktualna wersje Ogarniacza na zywo.
# Uzycie:  ~/ogarniacz/wgraj.sh            (opis wpisze sie sam)
#          ~/ogarniacz/wgraj.sh "poprawka mikrofonu"
cd "$(dirname "$0")" || exit 1

OPIS="${1:-poprawka $(date '+%d.%m %H:%M')}"

if [ -z "$(git status --porcelain)" ]; then
  echo ""
  echo "  Nic sie nie zmienilo — nie ma czego wgrywac."
  echo ""
  exit 0
fi

echo ""
echo "  Zmienione pliki:"
git status --porcelain | sed 's/^/    /'
echo ""

git add -A
git -c commit.gpgsign=false commit -q -m "$OPIS"

echo "  Wysylam..."
if ! git push -q origin main 2>&1; then
  echo ""
  echo "  Nie udalo sie wyslac. Sprawdz polaczenie albo zaloguj sie: gh auth login"
  echo ""
  exit 1
fi

ADRES=$(cat .adres 2>/dev/null)
echo ""
echo "  Wgrane: $OPIS"
[ -n "$ADRES" ] && echo "  Za ~40 sekund bedzie widoczne pod: $ADRES"
echo ""
echo "  Na telefonie: odswiez strone. Jesli apka jest na ekranie poczatkowym"
echo "  i pokazuje stara wersje — zamknij ja calkiem i otworz ponownie."
echo ""
