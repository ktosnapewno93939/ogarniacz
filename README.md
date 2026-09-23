# Ogarniacz

Głosowy asystent zadań dla głowy, która pamięta wszystko naraz i nic po kolei.
Działa na Macu i na iPhonie. Zadania siedzą w telefonie — bez chmury, bez opłat.

## Adres

**https://ktosnapewno93939.github.io/ogarniacz/**

Działa zawsze, nic nie trzeba uruchamiać. Na iPhonie: Safari → Udostępnij →
**Dodaj do ekranu początkowego**.

## Wgrywanie poprawek

Po każdej zmianie w kodzie:

```
~/ogarniacz/wgraj.sh
```

albo z opisem: `~/ogarniacz/wgraj.sh "poprawka mikrofonu"`

Po ~40 sekundach jest na żywo. Apka na telefonie sama wykrywa nową wersję
przy następnym otwarciu i się przeładowuje — nic nie trzeba czyścić.

## Podgląd lokalny (przed wgraniem)

```
~/ogarniacz/start.sh
```

Otworzy się na `http://localhost:8777`. Zatrzymanie: `Ctrl+C`.
Mikrofon działa, bo `localhost` liczy się jako bezpieczny adres.

## Jak używać

Na dole ekranu jest jedno pole i mikrofon. To jest cała obsługa.
Mówisz normalnie, po polsku — aplikacja sama wyciąga termin, godzinę i kategorię:

| Powiesz | Zrozumie |
|---|---|
| „spotkanie jutro na 12" | Spotkanie — jutro 12:00 |
| „zadzwoń do Marka o 15:00" | Zadzwoń do Marka — dziś 15:00, telefon |
| „zapłać ZUS do 20.09" | Zapłać ZUS — 20 wrz, finanse |
| „obróbka zdjęć z wesela w piątek rano" | Obróbka zdjęć z wesela — piątek 9:00 |
| „za 20 minut wyjść" | Wyjść — za 20 minut |
| „pilne zadzwonić do księgowej" | oznaczone jako pilne, ląduje na górze |
| „trening codziennie o 7" | powtarza się co dzień |
| „napisz maila do galerii na 30 minut" | z blokiem 30 minut na fokus |
| „kup mleko" | bez terminu → Notatnik |
| „notatka: album mini dla klientów" | → Notatnik |
| „spotkanie o wpół do trzeciej" | 14:30 |
| „zadzwoń o piętnastej" | 15:00 |
| „wizyta o dziewiątej trzydzieści" | 9:30 |
| „za dwadzieścia minut wyjść" | za 20 minut |

### Wycina rozbieg

Mówisz tak, jak myślisz — z rozbiegiem. Apka zostawia samo mięso:

| Powiesz | Zapisze |
|---|---|
| „**przypomniało mi się dzisiaj** ogarnąć sprzątanie" | Ogarnąć sprzątanie — dziś |
| „**przypomniało mi się że muszę** zadzwonić do Marka o piętnastej" | Zadzwonić do Marka — 15:00 |
| „**mam pamiętać że mam** założyć spółkę" | Założyć spółkę → notatnik |
| „**muszę jeszcze** wysłać galerię jutro" | Wysłać galerię — jutro |
| „**a właśnie** kup mleko" | Kup mleko |

Wycina m.in.: „przypomniało mi się", „muszę", „trzeba", „mam", „powinienem",
„żeby nie zapomnieć", „nie zapomnij", „chciałem", „a właśnie", „przy okazji",
„jeszcze", „do zrobienia". Jeśli po wycięciu nie zostałoby nic —
zostawia zdanie w całości.

Rozumie też: dziś / jutro / pojutrze / pojedyncze dni tygodnia / „w przyszły wtorek" /
„w weekend" / „za 2 godziny" / „za tydzień" / daty (3 października, 20.09) /
pory dnia (rano, po południu, wieczorem, w nocy).

Godziny rozumie też **słowami**, bo dyktowanie często tak je zapisuje:
„o dwunastej", „o piętnastej", „o wpół do trzeciej", „o dwudziestej pierwszej",
„za dwadzieścia minut", „na czterdzieści pięć minut". Przy godzinach 1–7
zakłada popołudnie („o trzeciej" = 15:00), chyba że padnie „rano".

### Cztery zakładki

- **Teraz** — jedno zadanie. To, które ma sens zrobić w tej chwili (po terminie > pilne > najbliższa godzina > szybkie). Plus timer fokusa.
- **Dziś** — zaległe, dzisiejsze i trwające okresy.
- **Kalendarz** — miesiąc jak w iPhonie: kropki pod dniami z zadaniami (pomarańczowa = pilne), dotknięcie dnia pokazuje jego listę pod spodem.
- **Notatnik** — pomysły bez terminu: projekt do zrobienia, coś do sprawdzenia, myśl której szkoda stracić.

### Okresy i zakresy

Nie wszystko da się przypiąć do jednej godziny. „Zrobić to w tym tygodniu"
to prawdziwy termin, tylko szerszy — apka zapisuje go jako okno czasu
z początkiem i końcem:

| Powiesz | Okres |
|---|---|
| „ogarnąć sprzątanie **w tym tygodniu**" | dziś → niedziela |
| „**na ten tydzień** przygotować ofertę" | dziś → niedziela |
| „**w przyszłym tygodniu** rozliczyć ZUS" | pon → niedz |
| „**w tym miesiącu** założyć spółkę" | dziś → koniec miesiąca |
| „obróbka **od poniedziałku do środy**" | pon → śr |
| „urlop **od 10.10 do 15.10**" | 10 paź → 15 paź |
| „sesja **w weekend**" | sob → niedz |

Takie zadanie widać w kalendarzu **w każdym dniu okresu**, a na karcie jest
licznik: „zostało 3 dni", „został 1 dzień", „ostatni dzień". Pilność liczy się
od końca okna — dopóki okno trwa, nic nie wisi.

### Asystent decyduje, gdzie to trafi

Nie każde zdanie jest zadaniem. Apka rozdziela to na trzy przypadki:

| Powiesz | Co się stanie |
|---|---|
| „spotkanie **jutro o 12**" | → **Kalendarz**, konkretny termin |
| „spotkanie **w tym tygodniu**" | → **Kalendarz**, okres pon–niedz |
| „zadzwoń **niedługo**" | → **dopyta**, który to dzień |
| „mam **założyć spółkę**" | → **Notatnik**, bo to jeszcze nie zadanie |

**Nic nie ląduje w kalendarzu bez Twojej decyzji.** Zgadywanie za użytkownika
kończy się zadaniem w złym dniu — a takiemu kalendarzowi przestaje się ufać
i wtedy cała apka jest do wyrzucenia.

Terminy mgliste, na które apka dopyta: „na dniach", „niedługo", „wkrótce",
„kiedyś", „w wolnej chwili", „jak będzie czas". („W tym tygodniu" już nie —
to jest konkretny okres, patrz wyżej.)
Wtedy dostajesz rząd dni (dziś, jutro, 5 kolejnych) i godzin
(cały dzień, 9:00, 12:00, 15:00, 18:00) — jedno dotknięcie i gotowe.
Obok jest **→ notatnik**, jeśli jednak nie chcesz tego planować.

Przy zwykłym wpisywaniu, pod podglądem, są skróty:
**za 30 min · za godzinę · dziś 18:00 · jutro 9:00**.

### Notatnik — na to, co nie jest jeszcze zadaniem

Powiedz z dowolnego ekranu **„notatka…"**, **„pomysł…"**, **„zanotuj…"**
albo **„pamiętaj…"** — wyląduje w notatniku zamiast w zadaniach.
Będąc na zakładce Notatnik, wszystko co wpiszesz idzie tam bez słowa-klucza.

- dotknięcie treści — poprawianie w miejscu, notatka może być długa
- **☆** — przypięcie na górę
- **→ zadanie** — zamienia notatkę w zadanie na dziś, stamtąd ustawiasz termin

W drugą stronę też: przy każdym zadaniu jest **📝**, które przenosi je
do notatnika, gdy okaże się, że to jednak nie rzecz na konkretny dzień.

To rozdzielenie jest celowe: zadania mają terminy i pilnują Cię same,
notatki czekają spokojnie, aż sam zdecydujesz, że to robisz.

### Przyciski przy zadaniu

- duży `✓` po lewej — zrobione (jeśli powtarzalne, samo tworzy następne)
- `⋯` po prawej — menu z dużymi wierszami: przełóż o 15 minut / o godzinę /
  na jutro, przenieś do notatnika, usuń

Wszystkie pola dotyku mają minimum 44 px, bo mniejsze to loteria —
zwłaszcza w ruchu. „Usuń" leży osobno na dole menu, daleko od „Zrobione".

### Kolory — skala, nie alarm

| Stan | Kolor | Znaczenie |
|---|---|---|
| dalej niż jutro | szary, przygaszony | cicho, nie zawraca głowy |
| dziś / jutro | niebieski | jest na radarze |
| w ciągu godziny albo pilne | bursztynowy | rusz się |
| po terminie | pomarańczowy, lekko oddycha | wisi |
| zrobione | zielony, przygaszone | z głowy |

Nic nie jest czerwone. Czerwień uruchamia wstyd, wstyd kończy się unikaniem
aplikacji — a apka, której się unika, nie działa wcale.

## Dlaczego tak, a nie inaczej (pod ADHD)

- **Wrzut zawsze pod ręką** — pole i mikrofon są przyklejone do dołu na każdym ekranie. Pomysł ginie w 5 sekund, więc zapis musi trwać 2.
- **Zero formularzy** — żadnego wyboru daty, priorytetu, projektu. Mówisz zdanie, reszta dzieje się sama.
- **Jedno zadanie na ekranie „Teraz"** — lista 30 rzeczy to paraliż, jedna rzecz to decyzja.
- **Podgląd na żywo** — nad polem widzisz, co aplikacja zrozumiała, zanim zatwierdzisz. Bez niespodzianek.
- **Zaległe bez czerwieni i wykrzykników** — nagłówek mówi „bez wyrzutów, po prostu przesuń albo zrób". Wstyd = unikanie aplikacji.
- **Licznik „zrobione dziś"** — natychmiastowa nagroda, widoczna od razu po `✓`.
- **Timer fokusa** — start jednym kliknięciem, z tytułem zadania na ekranie, żeby nie odpłynąć.
- **Skrzynka** — rzeczy bez terminu nie znikają i nie zaśmiecają dnia.
- **Godzina w osobnej kolumnie** — duża, wyrównana, z kreską oddzielającą. Wzrok łapie ją od razu, bez czytania zdania.
- **Kolorowy pasek z lewej karty** — zielony = zaraz, pomarańczowy = pilne, czerwony = po terminie. Rozpoznajesz stan bez czytania.
- **Poprawianie tekstu dotknięciem** — dyktowanie przekręci imię, poprawiasz w miejscu, termin zostaje.

## iPhone

Otwórz w Safari: **https://ktosnapewno93939.github.io/ogarniacz/**
→ Udostępnij → **Dodaj do ekranu początkowego**.

Przy pierwszym kliknięciu mikrofonu Safari zapyta o zgodę — zezwól.
Adres jest po HTTPS, więc mikrofon działa (to jest warunek, który stawia Safari).

**Dyktowanie działa tak samo na Macu i na iPhonie:** klikasz mikrofon, mówisz,
apka sama zapisuje po skończeniu zdania. Ponowne kliknięcie kończy nagrywanie od razu.

**Kilka rzeczy naraz jednym tchem:** „zadzwoń do Marka o 15 **oraz** kup mleko,
**a potem** wyślij galerię" → trzy osobne zadania. Tnie na `oraz`, `potem`,
`a potem`, `i jeszcze`, `;` — samo `i` zostaje, żeby „Marka i Anny" się nie rozpadło.

## Przypomnienia i rytm dnia

Ustawienia → **Mój rytm dnia**: godziny pracy (domyślnie 8:00–16:30),
pora wieczornego pytania o jutro (21:00) i czy pracujesz w weekendy.

Co to zmienia:

- **zadania całodniowe i okresy przypominają się na starcie pracy**,
  a nie o północy, kiedy i tak nikt ich nie zrobi
- **wieczorem apka pyta o jutro** — „Masz już 3 na jutro, dorzuć resztę"
  albo „Nic nie masz na jutro, wpisz teraz"
- w weekendy cisza, jeśli nie zaznaczysz, że pracujesz

### Prawdziwe powiadomienia (działa przy zamkniętej apce)

Ustawienia → **Przypomnienia na telefon** → Włącz. iPhone zapyta o zgodę,
potem przyjdzie próbne powiadomienie.

Od tej pory telefon odzywa się sam — apka nie musi być otwarta:

- zadania z godziną, na 10 minut przed (albo ile ustawisz)
- całodniowe i okresy — o starcie pracy, każdego dnia okresu
- „Plan dnia" rano w dni robocze
- „Co jutro?" wieczorem

Działa na własnym serwerze na Cloudflare Workers — darmowy plan, bez karty.
Serwer dostaje tylko plan: **o której i z jakim tekstem**. Nic poza tym —
żadnych notatek, historii ani ustawień. Wyłączasz tym samym przyciskiem,
wtedy plan jest z serwera kasowany.

**Warunek na iPhonie:** apka musi być dodana do ekranu początkowego
(Safari → Udostępnij → Dodaj do ekranu początkowego). Z poziomu zwykłej
karty Safari iOS nie pozwala na powiadomienia.

### Zapas: eksport do Kalendarza

Niezależnie od powiadomień możesz wrzucić wszystko do Kalendarza:
Ustawienia → **Wyślij wszystko do Kalendarza iPhone (.ics)** → otwórz pobrany plik.

Do Kalendarza wpadną z alarmami:
- wszystkie zadania (okresy jako wydarzenia wielodniowe)
- **codzienny „plan dnia"** o godzinie startu pracy, pn–pt
- **codzienne „co jutro?"** o 21:00

Przydaje się, gdy chcesz mieć zadania widoczne obok innych wydarzeń
w Kalendarzu. Powtórz eksport, gdy dopiszesz nowe zadania.

## Serwer przypomnień

Kod w `~/ogarniacz-push`. Wgrywanie zmian:

```
cd ~/ogarniacz-push && npx wrangler deploy
```

Adres: `https://ogarniacz-push.ogarniacz-janz.workers.dev`
Klucze VAPID leżą w `~/ogarniacz-push/klucze.txt` (poza repozytorium).

## Moje imiona (gdy dyktowanie przekręca)

Dyktowanie Apple'a myli rzadsze polskie imiona — „Eryk" wychodzi jako „Erica".
Tego nie da się naprawić w kodzie, bo to silnik Apple'a. Ale apka to prostuje:

Ustawienia → **Moje imiona i słowa** → dopisz „Eryk".
Od tej pory:

| Dyktowanie usłyszy | Apka zapisze |
|---|---|
| „zadzwoń do Erica" | Zadzwoń do **Eryka** |
| „spotkanie z Ericiem" | Spotkanie z **Erykiem** |
| „kwiaty dla Malgosia" | Kwiaty dla **Małgosi**a |
| „napisz do Grzegoż" | Napisz do **Grzegorz**a |

Porównuje „na ucho" (bez ogonków, `y`=`i`, `c`=`k`), więc łapie też odmianę
i zgubione ogonki. Zwykłe słowa zostawia w spokoju.

**Uczy się sam:** popraw tytuł zadania dotknięciem i podmień jedno słowo —
apka zapamięta Twoją pisownię i będzie jej używać następnym razem.

## Kopia danych

Ustawienia → „Zapisz kopię danych (.json)" i „Wczytaj kopię danych".
Tym samym sposobem przenosisz zadania między Makiem a iPhonem.

## Pliki

- `parser.js` — rozumienie polskiego (daty, godziny, kategorie, pilność, powtarzanie)
- `app.js` — logika, widoki, timer, powiadomienia, eksport .ics
- `index.html`, `styles.css` — interfejs
- `sw.js`, `manifest.json`, `icon.png` — działanie offline i instalacja na ekranie głównym
