// parser.js — rozumienie polskiego jezyka mowionego -> zadanie z terminem
// Wszystko lokalnie, bez internetu, bez API.

const DNI = {
  'poniedzialek':1,'poniedziałek':1,
  'wtorek':2,
  'sroda':3,'środa':3,'srode':3,'środę':3,
  'czwartek':4,
  'piatek':5,'piątek':5,
  'sobota':6,'sobote':6,'sobotę':6,
  'niedziela':0,'niedziele':0,'niedzielę':0
};

const MIESIACE = {
  'stycznia':0,'styczen':0,'styczeń':0,
  'lutego':1,'luty':1,
  'marca':2,'marzec':2,
  'kwietnia':3,'kwiecien':3,'kwiecień':3,
  'maja':4,'maj':4,
  'czerwca':5,'czerwiec':5,
  'lipca':6,'lipiec':6,
  'sierpnia':7,'sierpien':7,'sierpień':7,
  'wrzesnia':8,'września':8,'wrzesien':8,'wrzesień':8,
  'pazdziernika':9,'października':9,'pazdziernik':9,'październik':9,
  'listopada':10,'listopad':10,
  'grudnia':11,'grudzien':11,'grudzień':11
};

const PORY = {
  'nad ranem': 7,
  'rano': 9,
  'przed poludniem': 11, 'przed południem': 11,
  'w poludnie': 12, 'w południe': 12,
  'po poludniu': 15, 'po południu': 15,
  'popoludniu': 15, 'popołudniu': 15,
  'wieczorem': 19, 'wieczor': 19, 'wieczór': 19,
  'w nocy': 22, 'noca': 22, 'nocą': 22
};

const LICZBY = {
  'jedna':1,'jednej':1,'dwie':2,'dwa':2,'dwoch':2,'dwóch':2,'trzy':3,'trzech':3,
  'cztery':4,'czterech':4,'piec':5,'pięć':5,'pieciu':5,'pięciu':5,'szesc':6,'sześć':6,
  'siedem':7,'osiem':8,'dziewiec':9,'dziewięć':9,'dziesiec':10,'dziesięć':10,
  'kwadrans':15,'pol':30,'pół':30
};

const KATEGORIE = [
  { id:'telefon',  ikona:'PHONE', slowa:['zadzwon','zadzwoń','dzwonic','dzwonić','telefon','oddzwon','oddzwoń','zadzwonic','zadzwonić'] },
  { id:'spotkanie',ikona:'MEET',  slowa:['spotkanie','spotkac','spotkać','spotykam','wizyta','sesja','plan zdjeciowy','plan zdjęciowy','klient','umowione'] },
  { id:'mail',     ikona:'MAIL',  slowa:['napisz','mail','maila','email','wyslij','wyślij','wiadomosc','wiadomość','odpisz','odpowiedz'] },
  { id:'kasa',     ikona:'KASA',  slowa:['zaplac','zapłać','faktur','platnos','płatnoś','przelew','zus','podatek','ksef','oplac','opłać','rachunek'] },
  { id:'zakupy',   ikona:'ZAKUP', slowa:['kup','kupic','kupić','zamow','zamów','zamowic','zamówić'] },
  { id:'praca',    ikona:'PRACA', slowa:['obrobka','obróbka','zdjec','zdjęc','edytuj','galeri','retusz','montaz','montaż'] },
  { id:'zdrowie',  ikona:'ZDROW', slowa:['lekarz','dentysta','apteka','recept','badani','trening','silowni','siłowni'] }
];

const PILNE = ['pilne','pilnie','na juz','na już','wazne','ważne','asap','natychmiast','koniecznie'];

/* Dyktowanie czesto zapisuje godziny slowami: "o pietnastej", "o wpol do trzeciej".
   Klucze bez ogonkow, bo tekst jest wczesniej normalizowany. */
const GODZINY_SLOWNIE = {
  'pierwszej':1,'drugiej':2,'trzeciej':3,'czwartej':4,'piatej':5,'szostej':6,
  'siodmej':7,'osmej':8,'dziewiatej':9,'dziesiatej':10,'jedenastej':11,'dwunastej':12,
  'trzynastej':13,'czternastej':14,'pietnastej':15,'szesnastej':16,'siedemnastej':17,
  'osiemnastej':18,'dziewietnastej':19,'dwudziestej':20,
  'dwudziestej pierwszej':21,'dwudziestej drugiej':22,'dwudziestej trzeciej':23,
  // formy mianownikowe, tez sie zdarzaja
  'pierwsza':1,'druga':2,'trzecia':3,'czwarta':4,'piata':5,'szosta':6,'siodma':7,
  'osma':8,'dziewiata':9,'dziesiata':10,'jedenasta':11,'dwunasta':12,
  'trzynasta':13,'czternasta':14,'pietnasta':15,'szesnasta':16,'siedemnasta':17,
  'osiemnasta':18,'dziewietnasta':19,'dwudziesta':20
};

/* Liczebniki glowne — do "za dwadziescia minut", "na czterdziesci piec minut". */
const LICZEBNIKI = {
  'jeden':1,'jedna':1,'dwa':2,'dwie':2,'trzy':3,'cztery':4,'piec':5,'szesc':6,
  'siedem':7,'osiem':8,'dziewiec':9,'dziesiec':10,'jedenascie':11,'dwanascie':12,
  'trzynascie':13,'czternascie':14,'pietnascie':15,'szesnascie':16,'siedemnascie':17,
  'osiemnascie':18,'dziewietnascie':19,'dwadziescia':20,'trzydziesci':30,
  'czterdziesci':40,'piecdziesiat':50,'szescdziesiat':60
};

/* "dwadziescia piec" = 25 — sklada dziesiatke z jednostka. */
function liczbaZeSlow(txt){
  const slowa = txt.trim().split(/\s+/);
  let suma = 0, cos = false;
  for (const w of slowa){
    if (LICZEBNIKI[w] === undefined) return null;
    suma += LICZEBNIKI[w]; cos = true;
  }
  return cos ? suma : null;
}

/* Polskie znaki na ASCII — zamiana jeden do jednego, wiec pozycje liter
   zostaja te same i dalej mozemy odciac dopasowane fragmenty z tytulu.
   Bez tego granica slowa \b nie dziala po literach a c e l n o s z:
   "za tydzien'" czy "dzis'" nigdy sie nie dopasowywaly. */
const OGONKI = { 'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z' };

function bezOgonkow(s){
  return s.replace(/[ąćęłńóśźż]/g, z => OGONKI[z]);
}

const MIESIACE_ASCII = {};
for (const k of Object.keys(MIESIACE)) MIESIACE_ASCII[bezOgonkow(k)] = MIESIACE[k];

function norm(s){
  return bezOgonkow(s.toLowerCase()).replace(/\s+/g,' ').trim();
}

function startOfDay(d){ const x = new Date(d); x.setHours(0,0,0,0); return x; }

/* --- wycinanie rozbiegu ---
   Mowi sie "przypomnialo mi sie ze musze jeszcze ogarnac sprzatanie".
   Zadaniem jest "ogarnac sprzatanie" — reszta to rozbieg, ktory tylko
   zasmieca liste i utrudnia skanowanie wzrokiem.
   Kolejnosc ma znaczenie: dluzsze frazy przed krotszymi. */
const WYPELNIACZE = [
  'wlasnie mi sie przypomnialo ze','wlasnie mi sie przypomnialo',
  'przypomnialo mi sie ze','przypomnialo mi sie','przypomnial mi sie',
  'przypominam sobie ze','przypomina mi sie ze','przypomina mi sie',
  'mam pamietac o tym ze','mam pamietac ze','musze pamietac ze','musze pamietac o',
  'zeby nie zapomniec ze','zeby nie zapomniec o','zeby nie zapomniec',
  'nie zapomniec o','nie zapomniec','nie zapomnij o','nie zapomnij',
  'mam do zrobienia','do zrobienia','mam jeszcze','musze jeszcze','trzeba jeszcze',
  'musze koniecznie','trzeba koniecznie',
  'chcialbym','chcialem','chce jeszcze',
  'powinienem','powinnam','wypadaloby','nalezy',
  'a wlasnie','wlasnie','przy okazji','tak przy okazji','no i jeszcze','no i','aha',
  'musze','trzeba by','trzeba','mam','jeszcze','zeby','ze','o tym'
];

function oczyscTytul(tytul){
  let biezacy = String(tytul).replace(/\s+/g,' ').trim();
  for (let krok = 0; krok < 6; krok++){
    const low = bezOgonkow(biezacy.toLowerCase());
    let uciete = false;
    for (const w of WYPELNIACZE){
      if (low === w) return biezacy;                 // zostaloby pusto — zostawiamy
      if (low.startsWith(w + ' ')){
        const reszta = biezacy.slice(w.length).replace(/^[\s,.:;–—-]+/, '');
        if (!reszta) return biezacy;
        biezacy = reszta; uciete = true; break;
      }
    }
    if (!uciete) break;
  }
  return biezacy.charAt(0).toUpperCase() + biezacy.slice(1);
}

// zwraca { tytul, kiedy, maGodzine, kategoria, ikona, pilne, trwanie, powtarzanie, niepewne }
function parsuj(tekst, teraz){
  teraz = teraz || new Date();
  const oryg = String(tekst || '').trim();
  const t = norm(oryg);
  const zjedzone = [];
  let data = null, godz = null, min = 0, maGodzine = false;
  let trwanie = null, powtarzanie = null;
  let m;

  const zjedz = (re) => { const r = t.match(re); if (r) zjedzone.push(r[0]); return r; };

  /* --- termin mglisty ---
     "w tym tygodniu", "niedlugo", "kiedys" to nie jest termin, tylko intencja.
     Nie zgadujemy za uzytkownika — apka dopyta, ktory to dzien. */
  let niepewne = false;
  const MGLISTE = /\b(na dniach|niedlugo|wkrotce|kiedys|jak bede mial czas|jak bedzie czas|w wolnej chwili|w tych dniach|szybko)\b/;
  if (MGLISTE.test(t)){
    niepewne = true;
    zjedzone.push(t.match(MGLISTE)[0]);
  }

  /* --- okresy: "w tym tygodniu", "od poniedzialku do srody" ---
     To nie jest termin na konkretna godzine, tylko okno czasu.
     Zadanie ma wtedy poczatek i koniec, a pilnosc liczy sie od konca. */
  let doKiedy = null;
  {
    const koniecTygodnia = (od) => {           // niedziela biezacego tygodnia
      const d = new Date(od);
      d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
      return startOfDay(d);
    };

    if ((m = zjedz(/\b(w tym tygodniu|na ten tydzien|do konca tygodnia|w ciagu tygodnia)\b/))){
      data = startOfDay(teraz);
      doKiedy = koniecTygodnia(teraz);
    }
    else if ((m = zjedz(/\b(w przyszlym tygodniu|na przyszly tydzien)\b/))){
      const pon = new Date(teraz);
      pon.setDate(pon.getDate() + ((8 - pon.getDay()) % 7 || 7));
      data = startOfDay(pon);
      doKiedy = koniecTygodnia(pon);
    }
    else if ((m = zjedz(/\b(w tym miesiacu|na ten miesiac|do konca miesiaca)\b/))){
      data = startOfDay(teraz);
      doKiedy = startOfDay(new Date(teraz.getFullYear(), teraz.getMonth() + 1, 0));
    }
    else if ((m = zjedz(/\b(w weekend|na weekend)\b/))){
      const d = new Date(teraz);
      d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
      data = startOfDay(d);
      doKiedy = startOfDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
    }
    else {
      // "od poniedzialku do srody"
      const dniRe = '(poniedzial\\w+|wtork?\\w*|srod\\w+|czwartk?\\w*|piatk?\\w*|sobot\\w+|niedziel\\w+)';
      if ((m = zjedz(new RegExp('\\bod ' + dniRe + ' do ' + dniRe)))){
        // porownujemy 4 pierwsze litery rdzenia — "srody", "srode", "sroda"
        const naDzien = (slowo) => {
          const klucz = Object.keys(DNI).find(k => slowo.slice(0,4) === bezOgonkow(k).slice(0,4));
          if (klucz === undefined) return null;
          const d = new Date(teraz);
          d.setDate(d.getDate() + ((DNI[klucz] - d.getDay() + 7) % 7));
          return startOfDay(d);
        };
        const a = naDzien(m[1]), b = naDzien(m[2]);
        if (a && b){
          data = a;
          doKiedy = b < a ? startOfDay(new Date(b.getFullYear(), b.getMonth(), b.getDate() + 7)) : b;
        }
      }
      // "od 10 do 15 marca" / "od 10.03 do 15.03"
      else if ((m = zjedz(/\bod (\d{1,2})[.\/](\d{1,2}) do (\d{1,2})[.\/](\d{1,2})\b/))){
        const rok = teraz.getFullYear();
        data = startOfDay(new Date(rok, +m[2] - 1, +m[1]));
        doKiedy = startOfDay(new Date(rok, +m[4] - 1, +m[3]));
      }
      else if ((m = zjedz(new RegExp('\\bod (\\d{1,2}) do (\\d{1,2})\\s+(' + Object.keys(MIESIACE_ASCII).join('|') + ')\\b')))){
        const mies = MIESIACE_ASCII[m[3]], rok = teraz.getFullYear();
        data = startOfDay(new Date(rok, mies, +m[1]));
        doKiedy = startOfDay(new Date(rok, mies, +m[2]));
      }
    }
  }

  // --- POWTARZANIE ---
  if ((m = zjedz(/\b(codziennie|kazdego dnia|każdego dnia)\b/))) powtarzanie = 'dziennie';
  else if ((m = zjedz(/\bco (tydzien|tydzień)\b|\bcotygodniowo\b/))) powtarzanie = 'tygodniowo';
  else if ((m = zjedz(/\bco (miesiac|miesiąc|miesiaca|miesiąca)\b/))) powtarzanie = 'miesiecznie';

  // --- "za X minut / godzin / dni / tygodni" ---
  if ((m = zjedz(/\bza (\d+|jedn\w+|dwie|dwa|trzy|cztery|piec|pięć|kwadrans|pol|pół)\s*(minut\w*|min\b|godzin\w*|godz\b|dni|dzien|dzień|tydzien|tydzień|tygodni\w*)/))) {
    const raw = m[1];
    let n = /^\d+$/.test(raw) ? parseInt(raw, 10) : (LICZBY[raw] !== undefined ? LICZBY[raw] : 1);
    const jed = m[2];
    const d = new Date(teraz);
    if (/^min/.test(jed)) {
      if (raw === 'kwadrans') n = 15;
      d.setMinutes(d.getMinutes() + n); maGodzine = true;
    } else if (/^godz/.test(jed)) {
      if (raw === 'pol' || raw === 'pół') d.setMinutes(d.getMinutes() + 30);
      else d.setHours(d.getHours() + n);
      maGodzine = true;
    } else if (/^dni|^dzie/.test(jed)) {
      d.setDate(d.getDate() + n);
    } else {
      d.setDate(d.getDate() + 7 * n);
    }
    data = startOfDay(d);
    if (maGodzine) { godz = d.getHours(); min = d.getMinutes(); }
  }

  // --- godzina podana wprost ("o 15:00", "o 11.30") — wyciagamy PRZED data,
  //     zeby "11.30" nie zostalo wziete za date dzienna ---
  if (godz === null && (m = zjedz(/\b(?:o |na |ok\.? |okolo |około )(\d{1,2})[:.](\d{2})\b/))) {
    godz = +m[1]; min = +m[2]; maGodzine = true;
  }

  // --- godzina slowem: "o pietnastej", "o dziewiatej trzydziesci", "o wpol do trzeciej" ---
  let godzZeSlow = false, juzPopoludnie = false;
  if (godz === null){
    const slowa = Object.keys(GODZINY_SLOWNIE).sort((a,b) => b.length - a.length).join('|');
    const licz  = Object.keys(LICZEBNIKI).sort((a,b) => b.length - a.length).join('|');
    const minuty = '(?:\\s+((?:' + licz + ')(?:\\s+(?:' + licz + '))?))?';

    if ((m = zjedz(new RegExp('\\b(?:o )?wpol do (' + slowa + ')\\b')))){
      godz = (GODZINY_SLOWNIE[m[1]] + 23) % 24; min = 30; maGodzine = true; godzZeSlow = true;
    }
    else if ((m = zjedz(new RegExp('\\b(?:o |na |ok\\.? |okolo )(' + slowa + ')\\b' + minuty)))){
      godz = GODZINY_SLOWNIE[m[1]]; min = 0; maGodzine = true; godzZeSlow = true;
      if (m[2]){
        const mm = liczbaZeSlow(m[2]);
        if (mm !== null && mm <= 59) min = mm;
      }
    }

    /* "o trzeciej" to w praktyce 15:00, nie 3:00 — nikt nie umawia sie w nocy.
       Godziny 1-7 przesuwamy na popoludnie, chyba ze pada "rano". */
    if (godzZeSlow && godz >= 1 && godz <= 7 && !/\b(rano|nad ranem|z rana)\b/.test(t)){
      godz += 12; juzPopoludnie = true;
    }
  }

  // --- "za dwadziescia minut", "za pol godziny" slowami ---
  if (godz === null){
    const licz = Object.keys(LICZEBNIKI).sort((a,b) => b.length - a.length).join('|');
    if ((m = zjedz(new RegExp('\\bza ((?:' + licz + ')(?: (?:' + licz + '))?)\\s*(minut\\w*|godzin\\w*)')))){
      const n = liczbaZeSlow(m[1]);
      if (n !== null){
        const d = new Date(teraz);
        if (/^minut/.test(m[2])) d.setMinutes(d.getMinutes() + n);
        else d.setHours(d.getHours() + n);
        data = startOfDay(d); godz = d.getHours(); min = d.getMinutes(); maGodzine = true;
      }
    }
  }

  // --- dzisiaj / jutro / pojutrze / weekend / za tydzien ---
  if (!data) {
    if (zjedz(/\b(dzisiaj|dzis|dziś)\b/)) data = startOfDay(teraz);
    else if (zjedz(/\bpojutrze\b/)) { const d = new Date(teraz); d.setDate(d.getDate()+2); data = startOfDay(d); }
    else if (zjedz(/\bjutro\b/)) { const d = new Date(teraz); d.setDate(d.getDate()+1); data = startOfDay(d); }
    else if (zjedz(/\b(za tydzien|za tydzień)\b/)) {
      const d = new Date(teraz); d.setDate(d.getDate()+7); data = startOfDay(d);
    }
  }

  // --- dzien tygodnia ---
  if (!data) {
    const re = /\b(?:w |we |na )?(przyszl\w+ |przyszł\w+ )?(poniedzial\w+|poniedział\w+|wtorek|srod\w+|środ\w+|czwartek|piat\w+|piąt\w+|sobot\w+|niedziel\w+)\b/;
    if ((m = t.match(re))) {
      const slowo = m[2];
      const klucz = Object.keys(DNI).find(k => slowo.slice(0,5) === bezOgonkow(k).slice(0,5));
      if (klucz !== undefined) {
        const cel = DNI[klucz];
        const d = new Date(teraz);
        let delta = (cel - d.getDay() + 7) % 7;
        if (delta === 0) delta = 7;
        if (m[1]) delta += 7;
        d.setDate(d.getDate() + delta);
        data = startOfDay(d);
        zjedzone.push(m[0]);
      }
    }
  }

  // --- data konkretna: najpierw slowna ("3 pazdziernika"), potem cyfrowa ("20.09") ---
  if (!data) {
    if ((m = zjedz(new RegExp('\\b(\\d{1,2})\\s+(' + Object.keys(MIESIACE_ASCII).join('|') + ')\\b')))) {
      const dzien = +m[1], mies = MIESIACE_ASCII[m[2]];
      let d = new Date(teraz.getFullYear(), mies, dzien);
      if (d < startOfDay(teraz)) d = new Date(teraz.getFullYear() + 1, mies, dzien);
      data = startOfDay(d);
    } else if ((m = t.match(/\b(\d{1,2})[.\/-](\d{1,2})(?:[.\/-](\d{2,4}))?\b/)) &&
               +m[1] >= 1 && +m[1] <= 31 && +m[2] >= 1 && +m[2] <= 12) {
      zjedzone.push(m[0]);
      const dzien = +m[1], mies = +m[2] - 1;
      const rok = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : teraz.getFullYear();
      let d = new Date(rok, mies, dzien);
      if (!m[3] && d < startOfDay(teraz)) d = new Date(rok + 1, mies, dzien);
      data = startOfDay(d);
    }
  }

  // --- godzina (pozostale formy) ---
  if (godz === null) {
    if ((m = zjedz(/\b(\d{1,2}):(\d{2})\b/))) { godz = +m[1]; min = +m[2]; maGodzine = true; }
    else if ((m = zjedz(/\b(?:o |na )(?:godzinie )?(\d{1,2})\b(?!\s*(?:minut|zl|zł|pln|%))/))) { godz = +m[1]; min = 0; maGodzine = true; }
  }

  // --- pora dnia ---
  for (const slowo of Object.keys(PORY)) {
    const re = new RegExp('\\b' + bezOgonkow(slowo).replace(/ /g, '\\s+') + '\\b');
    const r = t.match(re);
    if (r) {
      zjedzone.push(r[0]);
      const h = PORY[slowo];
      if (godz === null) { godz = h; min = 0; maGodzine = true; }
      else if (h >= 12 && godz <= 12 && !juzPopoludnie) { godz = (godz % 12) + 12; }
      break;
    }
  }

  // --- czas trwania ---
  if ((m = zjedz(/\b(?:na |przez )(\d+)\s*(min\w*|godz\w*|h)\b/))) {
    trwanie = /^godz|^h/.test(m[2]) ? (+m[1]) * 60 : +m[1];
  } else if ((m = zjedz(/\b(?:na |przez )(godzin\w+|pol godziny|pół godziny|kwadrans)\b/))) {
    trwanie = /kwadrans/.test(m[1]) ? 15 : (/pol|pół/.test(m[1]) ? 30 : 60);
  } else {
    const licz = Object.keys(LICZEBNIKI).sort((a,b) => b.length - a.length).join('|');
    if ((m = zjedz(new RegExp('\\b(?:na |przez )((?:' + licz + ')(?: (?:' + licz + '))?)\\s*(minut\\w*|godzin\\w*)')))){
      const n = liczbaZeSlow(m[1]);
      if (n !== null) trwanie = /^godzin/.test(m[2]) ? n * 60 : n;
    }
  }

  // --- pilnosc ---
  let pilne = false;
  for (const p of PILNE) {
    const re = new RegExp('\\b' + bezOgonkow(p).replace(/ /g, '\\s+') + '\\b');
    const r = t.match(re);
    if (r) { pilne = true; zjedzone.push(r[0]); break; }
  }

  // --- kategoria ---
  let kategoria = 'inne', ikona = 'ZADANIE';
  for (const k of KATEGORIE) {
    if (k.slowa.some(w => t.indexOf(bezOgonkow(w)) !== -1)) { kategoria = k.id; ikona = k.ikona; break; }
  }

  // --- zlozenie terminu ---
  let kiedy = null;
  if (data || maGodzine) {
    const d = data ? new Date(data) : startOfDay(teraz);
    if (maGodzine) {
      d.setHours(godz, min, 0, 0);
      if (!data && d <= teraz) d.setDate(d.getDate() + 1);
    }
    kiedy = d;
  }

  // --- czyszczenie tytulu (wycinamy zjedzone fragmenty po pozycjach) ---
  let low = norm(oryg);
  const maska = low.split('').map(() => true);
  for (const frag of zjedzone) {
    const i = low.indexOf(frag);
    if (i >= 0) for (let j = i; j < i + frag.length; j++) maska[j] = false;
  }
  const kompakt = oryg.replace(/\s+/g, ' ').trim();
  let tytul = kompakt.split('').filter((_, i) => maska[i] !== false).join('');
  tytul = tytul.replace(/\s+/g, ' ')
               .replace(/^[\s,.;:\-]+|[\s,.;:\-]+$/g, '')
               .replace(/\s+(o|na|w|we|za|do|i)$/i, '')
               .replace(/^(na|w|we|o|za|do)\s+/i, '')
               .replace(/^do zrobienia\s+/i, '')
               .trim();
  if (!tytul) tytul = kompakt;
  tytul = oczyscTytul(tytul);

  return { tytul, kiedy, doKiedy, maGodzine, kategoria, ikona, pilne, trwanie, powtarzanie, niepewne, surowy: oryg };
}

if (typeof module !== 'undefined') module.exports = { parsuj, oczyscTytul };
if (typeof window !== 'undefined'){ window.parsuj = parsuj; window.oczyscTytul = oczyscTytul; }
