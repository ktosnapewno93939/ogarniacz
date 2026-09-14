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

function norm(s){
  return s.toLowerCase().replace(/\s+/g,' ').trim();
}

function startOfDay(d){ const x = new Date(d); x.setHours(0,0,0,0); return x; }

// zwraca { tytul, kiedy, maGodzine, kategoria, ikona, pilne, trwanie, powtarzanie }
function parsuj(tekst, teraz){
  teraz = teraz || new Date();
  const oryg = String(tekst || '').trim();
  const t = norm(oryg);
  const zjedzone = [];
  let data = null, godz = null, min = 0, maGodzine = false;
  let trwanie = null, powtarzanie = null;
  let m;

  const zjedz = (re) => { const r = t.match(re); if (r) zjedzone.push(r[0]); return r; };

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

  // --- dzisiaj / jutro / pojutrze / weekend / za tydzien ---
  if (!data) {
    if (zjedz(/\b(dzisiaj|dzis|dziś)\b/)) data = startOfDay(teraz);
    else if (zjedz(/\bpojutrze\b/)) { const d = new Date(teraz); d.setDate(d.getDate()+2); data = startOfDay(d); }
    else if (zjedz(/\bjutro\b/)) { const d = new Date(teraz); d.setDate(d.getDate()+1); data = startOfDay(d); }
    else if (zjedz(/\b(w|na) weekend\b/)) {
      const d = new Date(teraz); const doSob = (6 - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + doSob); data = startOfDay(d);
    }
    else if (zjedz(/\b(w przyszlym tygodniu|w przyszłym tygodniu|za tydzien|za tydzień)\b/)) {
      const d = new Date(teraz); d.setDate(d.getDate()+7); data = startOfDay(d);
    }
  }

  // --- dzien tygodnia ---
  if (!data) {
    const re = /\b(?:w |we |na )?(przyszl\w+ |przyszł\w+ )?(poniedzial\w+|poniedział\w+|wtorek|srod\w+|środ\w+|czwartek|piat\w+|piąt\w+|sobot\w+|niedziel\w+)\b/;
    if ((m = t.match(re))) {
      const slowo = m[2];
      const klucz = Object.keys(DNI).find(k => slowo.slice(0,5) === k.slice(0,5));
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
    if ((m = zjedz(new RegExp('\\b(\\d{1,2})\\s+(' + Object.keys(MIESIACE).join('|') + ')\\b')))) {
      const dzien = +m[1], mies = MIESIACE[m[2]];
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
    const re = new RegExp('\\b' + slowo.replace(/ /g, '\\s+') + '\\b');
    const r = t.match(re);
    if (r) {
      zjedzone.push(r[0]);
      const h = PORY[slowo];
      if (godz === null) { godz = h; min = 0; maGodzine = true; }
      else if (h >= 12 && godz <= 12) { godz = (godz % 12) + 12; }
      break;
    }
  }

  // --- czas trwania ---
  if ((m = zjedz(/\b(?:na |przez )(\d+)\s*(min\w*|godz\w*|h)\b/))) {
    trwanie = /^godz|^h/.test(m[2]) ? (+m[1]) * 60 : +m[1];
  } else if ((m = zjedz(/\b(?:na |przez )(godzin\w+|pol godziny|pół godziny|kwadrans)\b/))) {
    trwanie = /kwadrans/.test(m[1]) ? 15 : (/pol|pół/.test(m[1]) ? 30 : 60);
  }

  // --- pilnosc ---
  let pilne = false;
  for (const p of PILNE) {
    const re = new RegExp('\\b' + p.replace(/ /g, '\\s+') + '\\b');
    const r = t.match(re);
    if (r) { pilne = true; zjedzone.push(r[0]); break; }
  }

  // --- kategoria ---
  let kategoria = 'inne', ikona = 'ZADANIE';
  for (const k of KATEGORIE) {
    if (k.slowa.some(s => t.indexOf(s) !== -1)) { kategoria = k.id; ikona = k.ikona; break; }
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
  tytul = tytul.charAt(0).toUpperCase() + tytul.slice(1);

  return { tytul, kiedy, maGodzine, kategoria, ikona, pilne, trwanie, powtarzanie, surowy: oryg };
}

if (typeof module !== 'undefined') module.exports = { parsuj };
if (typeof window !== 'undefined') window.parsuj = parsuj;
