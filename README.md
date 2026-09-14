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
| „kup mleko" | bez terminu → skrzynka |
| „spotkanie o wpół do trzeciej" | 14:30 |
| „zadzwoń o piętnastej" | 15:00 |
| „wizyta o dziewiątej trzydzieści" | 9:30 |
| „za dwadzieścia minut wyjść" | za 20 minut |

Rozumie też: dziś / jutro / pojutrze / pojedyncze dni tygodnia / „w przyszły wtorek" /
„w weekend" / „za 2 godziny" / „za tydzień" / daty (3 października, 20.09) /
pory dnia (rano, po południu, wieczorem, w nocy).

Godziny rozumie też **słowami**, bo dyktowanie często tak je zapisuje:
„o dwunastej", „o piętnastej", „o wpół do trzeciej", „o dwudziestej pierwszej",
„za dwadzieścia minut", „na czterdzieści pięć minut". Przy godzinach 1–7
zakłada popołudnie („o trzeciej" = 15:00), chyba że padnie „rano".

### Trzy zakładki

- **Teraz** — jedno zadanie. To, które ma sens zrobić w tej chwili (po terminie > pilne > najbliższa godzina > szybkie). Plus timer fokusa.
- **Dziś** — zaległe, dzisiejsze i skrzynka (rzeczy bez terminu, do rozdzielenia).
- **Kalendarz** — miesiąc jak w iPhonie: kropki pod dniami z zadaniami (pomarańczowa = pilne), dotknięcie dnia pokazuje jego listę pod spodem.

### Przyciski przy zadaniu

- `✓` zrobione (jeśli powtarzalne — samo tworzy następne)
- `+15` przesuń o kwadrans (bez poczucia winy, to jest normalne)
- `✕` usuń

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

**Przypomnienia, które naprawdę zadzwonią:** Ustawienia → „Wyślij wszystkie terminy
do Kalendarza/Przypomnień (.ics)". Otwórz pobrany plik na iPhonie — terminy wpadną
do Kalendarza z alarmem. To najpewniejsza droga, dopóki apka nie jest natywna.

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
