/* Ogarniacz — asystent dla glowy, ktora pamieta wszystko naraz i nic po kolei.
   Dane trzymane lokalnie (localStorage). Zero kont, zero chmury, zero oplat. */

const KLUCZ = 'ogarniacz.v1';

const stan = wczytaj();
let widok = 'teraz';
let fokus = null;          // { id, koniec, tick }

function wczytaj(){
  try{
    const s = JSON.parse(localStorage.getItem(KLUCZ));
    if (s && Array.isArray(s.zadania)) {
      s.zadania.forEach(z => { if (z.kiedy) z.kiedy = new Date(z.kiedy); });
      s.ustawienia = Object.assign({ przed:10, fokus:25 }, s.ustawienia || {});
      s.seria = s.seria || { dzien:null, ile:0 };
      s.slownik = Array.isArray(s.slownik) ? s.slownik : [];
      s.notatki = Array.isArray(s.notatki) ? s.notatki : [];
      // zadania z dawnej "skrzynki" dostaja termin na dzis — nic nie ginie
      s.zadania.forEach(z => { if (!z.kiedy){ z.kiedy = new Date(); z.kiedy.setHours(0,0,0,0); z.maGodzine = false; } });
      return s;
    }
  }catch(e){}
  return { zadania:[], notatki:[], ustawienia:{ przed:10, fokus:25 }, seria:{ dzien:null, ile:0 }, slownik:[] };
}
function zapisz(){ localStorage.setItem(KLUCZ, JSON.stringify(stan)); }

/* ---------------- pomocnicze ---------------- */
const $ = s => document.querySelector(s);
const dzien = d => { const x = new Date(d); x.setHours(0,0,0,0); return x.getTime(); };
const dzisiaj = () => dzien(new Date());

function ludzkaData(z){
  if (!z.kiedy) return null;
  const d = new Date(z.kiedy);
  const roznica = Math.round((dzien(d) - dzisiaj()) / 86400000);
  const godz = z.maGodzine ? d.toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'}) : null;
  let dzienTxt;
  if (roznica === 0) dzienTxt = 'dziś';
  else if (roznica === 1) dzienTxt = 'jutro';
  else if (roznica === -1) dzienTxt = 'wczoraj';
  else if (roznica > 1 && roznica < 7) dzienTxt = d.toLocaleDateString('pl-PL',{weekday:'long'});
  else dzienTxt = d.toLocaleDateString('pl-PL',{day:'numeric',month:'short'});
  return godz ? dzienTxt + ' ' + godz : dzienTxt;
}

function zaIle(z){
  if (!z.kiedy || !z.maGodzine) return null;
  const min = Math.round((new Date(z.kiedy) - new Date()) / 60000);
  if (min < 0)  return { txt:'minęło ' + trwanieTxt(-min), spoznione:true };
  if (min < 60) return { txt:'za ' + min + ' min' };
  if (min < 600) return { txt:'za ' + trwanieTxt(min) };
  return null;
}
function trwanieTxt(min){
  if (min < 60) return min + ' min';
  const h = Math.floor(min/60), m = min % 60;
  return h + ' godz' + (m ? ' ' + m + ' min' : '');
}

function toast(txt){
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = txt;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

/* ---------------- moje imiona ----------------
   Dyktowanie Apple'a przekreca rzadsze polskie imiona ("Eryk" -> "Erica").
   Apka trzyma liste Twoich slow i prostuje je po dyktowaniu.
   Porownujemy "na ucho": bez ogonkow, y=i, c=k — wtedy "erica" i "eryk"
   wygladaja jak "erika" i "erik", a to juz widac jako to samo imie. */
function fonetyk(s){
  return s.toLowerCase()
    .replace(/[ąćęłńóśźż]/g, z => ({'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z'}[z]))
    .replace(/y/g,'i').replace(/c/g,'k');
}

function odleglosc(a, b){
  const m = a.length, n = b.length;
  let prev = Array.from({length:n+1}, (_,j) => j);
  for (let i = 1; i <= m; i++){
    const cur = [i];
    for (let j = 1; j <= n; j++){
      cur[j] = Math.min(prev[j] + 1, cur[j-1] + 1, prev[j-1] + (a[i-1] === b[j-1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

function poprawSlownikiem(tekst){
  if (!stan.slownik.length) return { tekst, zmiany: [] };
  const zmiany = [];
  const wynik = tekst.replace(/[\p{L}]{3,}/gu, slowo => {
    const fs = fonetyk(slowo);
    for (const wzor of stan.slownik){
      const fw = fonetyk(wzor);
      // brzmi tak samo — bierzemy Twoja pisownie ("Malgosia" -> "Małgosia")
      if (fs === fw){
        if (wzor !== slowo) zmiany.push([slowo, wzor]);
        return wzor;
      }
      // odmiana: "Eryka" przy wzorcu "Eryk" — zostawiamy koncowke
      if (fs.startsWith(fw) && fs.length - fw.length <= 3){
        const poprawione = wzor + slowo.slice(wzor.length);
        if (poprawione !== slowo) zmiany.push([slowo, poprawione]);
        return poprawione;
      }
      // literowka: "Erik" przy wzorcu "Eryk"
      if (Math.abs(fs.length - fw.length) <= 1 && odleglosc(fs, fw) <= 1){
        if (wzor !== slowo) zmiany.push([slowo, wzor]);
        return wzor;
      }
    }
    return slowo;
  });
  return { tekst: wynik, zmiany };
}

function zapamietajSlowo(w){
  const czyste = w.replace(/[^\p{L}-]/gu, '');
  if (czyste.length < 3) return false;
  if (stan.slownik.some(x => fonetyk(x) === fonetyk(czyste))) return false;
  stan.slownik.push(czyste);
  zapisz();
  return true;
}

/* ---------------- notatnik ----------------
   Miejsce na pomysly, ktore nie sa jeszcze zadaniem: projekt do zrobienia,
   cos ciekawego do sprawdzenia, mysl ktora nie moze uciec.
   Zadania ZAWSZE maja termin — bez terminu rzecz ginie. Tu terminu nie ma
   i o to chodzi: notatka czeka, az sam zdecydujesz, ze to robisz. */
/* Uwaga: zadnego \b po tych slowach — "pomysl'" konczy sie polska litera,
   a \b jej nie uznaje za litere i wzorzec by nie trafil. */
const SLOWA_NOTATKI = /^\s*(notatka|notatke|notatkę|notuj|zanotuj|pomysl|pomysł|pomysly|pomysły|zapamietaj|zapamiętaj|pamietaj|pamiętaj|idea|mysl|myśl)(?=$|[\s:,.\-—])[\s:,.\-—]*/i;

function czyNotatka(tekst){
  return SLOWA_NOTATKI.test(tekst);
}

function dodajNotatke(tekst){
  const czysty = tekst.replace(SLOWA_NOTATKI, '').trim();
  if (!czysty) return null;
  const n = {
    id: Date.now() + '-' + Math.random().toString(36).slice(2,7),
    tresc: czysty.charAt(0).toUpperCase() + czysty.slice(1),
    przypiete: false,
    utworzone: new Date().toISOString()
  };
  stan.notatki.unshift(n);
  zapisz();
  return n;
}

function notatkaNaZadanie(id){
  const i = stan.notatki.findIndex(n => n.id === id);
  if (i < 0) return;
  const n = stan.notatki[i];
  const z = dodajZTekstu(n.tresc);
  stan.notatki.splice(i, 1);
  zapisz(); rysuj();
  toast(z ? 'Zadanie na ' + ludzkaData(z) : 'Zrobione zadanie');
}

/* ---------------- zadania ---------------- */
function dodajZTekstu(tekst){
  if (!tekst.trim()) return null;
  const p = parsuj(tekst);
  // brak terminu = dzis. Rzecz bez daty nie istnieje — przepada miedzy dniami.
  if (!p.kiedy){
    p.kiedy = new Date();
    p.kiedy.setHours(0,0,0,0);
    p.maGodzine = false;
  }
  const z = {
    id: Date.now() + '-' + Math.random().toString(36).slice(2,7),
    tytul: p.tytul,
    kiedy: p.kiedy,
    maGodzine: p.maGodzine,
    kategoria: p.kategoria,
    pilne: p.pilne,
    trwanie: p.trwanie,
    powtarzanie: p.powtarzanie,
    surowy: p.surowy,
    zrobione: false,
    powiadomiono: false,
    utworzone: new Date().toISOString()
  };
  stan.zadania.push(z);
  zapisz();
  return z;
}

function zrobione(id){
  const z = stan.zadania.find(x => x.id === id);
  if (!z) return;
  z.zrobione = !z.zrobione;
  if (z.zrobione){
    liczSerie();
    if (z.powtarzanie && z.kiedy){
      const n = Object.assign({}, z, {
        id: Date.now() + '-' + Math.random().toString(36).slice(2,7),
        zrobione:false, powiadomiono:false, kiedy:new Date(z.kiedy)
      });
      if (z.powtarzanie === 'dziennie') n.kiedy.setDate(n.kiedy.getDate()+1);
      if (z.powtarzanie === 'tygodniowo') n.kiedy.setDate(n.kiedy.getDate()+7);
      if (z.powtarzanie === 'miesiecznie') n.kiedy.setMonth(n.kiedy.getMonth()+1);
      stan.zadania.push(n);
    }
  }
  zapisz(); rysuj();
}

function liczSerie(){
  const d = dzisiaj();
  if (stan.seria.dzien !== d){ stan.seria.dzien = d; stan.seria.ile = 0; }
  stan.seria.ile++;
}

function przesun(id, minuty){
  const z = stan.zadania.find(x => x.id === id);
  if (!z) return;
  const baza = z.kiedy && new Date(z.kiedy) > new Date() ? new Date(z.kiedy) : new Date();
  baza.setMinutes(baza.getMinutes() + minuty);
  z.kiedy = baza; z.maGodzine = true; z.powiadomiono = false;
  zapisz(); rysuj();
  toast('Przełożone na ' + ludzkaData(z));
}

function naJutro(id){
  const z = stan.zadania.find(x => x.id === id);
  if (!z) return;
  const d = z.kiedy ? new Date(z.kiedy) : new Date();
  if (!z.kiedy) d.setHours(9,0,0,0);
  d.setDate(d.getDate()+1);
  z.kiedy = d; z.powiadomiono = false;
  zapisz(); rysuj(); toast('Na jutro');
}

/* Dyktowanie potrafi przekrecic imie ("do Zosi" -> "do Zosii").
   Dotkniecie tekstu zamienia go w pole do poprawienia. */
function edytuj(el, id){
  const z = stan.zadania.find(x => x.id === id);
  if (!z || el.querySelector('input')) return;

  const inp = document.createElement('input');
  inp.type = 'text';
  inp.className = 'edycja';
  inp.value = z.tytul;
  el.textContent = '';
  el.appendChild(inp);
  inp.focus();
  inp.setSelectionRange(inp.value.length, inp.value.length);

  let zamkniete = false;
  const zapiszTytul = () => {
    if (zamkniete) return;
    zamkniete = true;
    const nowy = inp.value.trim();
    if (nowy && nowy !== z.tytul){
      // jesli podmieniles jedno slowo na inne — zapamietujemy Twoja pisownie
      const stareS = z.tytul.split(/\s+/), noweS = nowy.split(/\s+/);
      const doda = noweS.filter(w => !stareS.includes(w) && /^[\p{Lu}]/u.test(w));
      z.tytul = nowy; zapisz();
      if (stareS.length === noweS.length && doda.length === 1 && zapamietajSlowo(doda[0])){
        toast('Zapamiętam pisownię: ' + doda[0]);
      }
    }
    rysuj();
  };
  inp.addEventListener('blur', zapiszTytul);
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter'){ e.preventDefault(); inp.blur(); }
    if (e.key === 'Escape'){ zamkniete = true; rysuj(); }
  });
}

function usun(id){
  const i = stan.zadania.findIndex(x => x.id === id);
  if (i >= 0){ stan.zadania.splice(i,1); zapisz(); rysuj(); toast('Usunięte'); }
}

/* ---------------- wybor: co teraz ---------------- */
function coTeraz(){
  const otwarte = stan.zadania.filter(z => !z.zrobione);
  if (!otwarte.length) return null;
  const teraz = new Date();
  const punkty = z => {
    let p = 0;
    if (z.kiedy){
      const minDo = (new Date(z.kiedy) - teraz) / 60000;
      if (minDo < 0) p += 900;                       // po terminie — najpierw
      else if (minDo < 60) p += 1000 - minDo;        // zaraz
      else if (dzien(z.kiedy) === dzisiaj()) p += 500 - minDo/60;
      else p += Math.max(0, 200 - minDo/60);
    } else {
      p += 60;                                       // skrzynka bez terminu
    }
    if (z.pilne) p += 300;
    if (z.trwanie && z.trwanie <= 15) p += 40;       // szybka wygrana
    return p;
  };
  return otwarte.slice().sort((a,b) => punkty(b) - punkty(a))[0];
}

/* ---------------- render ---------------- */
function kartaHTML(z){
  const bliskoTxt = zaIle(z);
  const klasy = ['zad'];
  if (z.zrobione) klasy.push('zrobione');
  if (z.pilne) klasy.push('pilne');
  if (bliskoTxt && bliskoTxt.spoznione) klasy.push('poTerminie');
  else if (bliskoTxt) klasy.push('zaraz');

  // godzina jako osobna, mocna kolumna — najlatwiej zlapac wzrokiem
  let czas;
  if (z.kiedy && z.maGodzine){
    const d = new Date(z.kiedy);
    czas = '<div class="czas"><b>' + d.toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'}) + '</b>' +
           (z.trwanie ? '<span>' + trwanieTxt(z.trwanie) + '</span>' : '') + '</div>';
  } else if (z.kiedy){
    czas = '<div class="czas caly"><b>cały</b><span>dzień</span></div>';
  } else {
    czas = '<div class="czas pusta"><b>—</b></div>';
  }

  const meta = [];
  const data = ludzkaData(z);
  if (data && widok !== 'kalendarz'){
    const bezGodz = z.maGodzine ? data.replace(/\s+\d{2}:\d{2}$/, '') : data;
    if (bezGodz) meta.push('<span class="tag">' + bezGodz + '</span>');
  }
  if (bliskoTxt) meta.push('<span class="' + (bliskoTxt.spoznione ? 'spoznione' : 'blisko') + '">' + bliskoTxt.txt + '</span>');
  if (z.pilne) meta.push('<span class="tag pilnyTag">pilne</span>');
  if (z.powtarzanie) meta.push('<span class="tag">powtarza się</span>');

  return '<div class="' + klasy.join(' ') + '" data-id="' + z.id + '">' +
    czas +
    '<button class="ptak" data-akcja="zrobione">✓</button>' +
    '<div class="tresc"><div class="tytul" data-akcja="edytuj" title="Dotknij, żeby poprawić">' + esc(z.tytul) + '</div>' +
      (meta.length ? '<div class="meta">' + meta.join('') + '</div>' : '') +
    '</div>' +
    '<div class="akcje">' +
      '<button class="mini" data-akcja="plus" title="+15 min">+15</button>' +
      '<button class="mini" data-akcja="usun" title="Usuń">✕</button>' +
    '</div></div>';
}
function esc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function rysuj(){
  const ekran = $('#ekran');
  if (widok === 'teraz') ekran.innerHTML = widokTeraz();
  else if (widok === 'dzis') ekran.innerHTML = widokDzis();
  else if (widok === 'kalendarz') ekran.innerHTML = widokKalendarz();
  else if (widok === 'notatnik') ekran.innerHTML = widokNotatnik();
  else ekran.innerHTML = widokWszystko();
  if (fokus) rysujTimer();
}

function widokNotatnik(){
  if (!stan.notatki.length){
    return '<div class="pusto"><b>Notatnik pusty.</b>' +
      'Tu trafia to, co nie ma jeszcze terminu: pomysł na projekt, coś do sprawdzenia, myśl której szkoda stracić.<br><br>' +
      'Powiedz <b>„notatka…"</b> albo <b>„pomysł…"</b> z dowolnego ekranu — wyląduje tutaj. ' +
      'Albo pisz na tej zakładce, wtedy wszystko idzie do notatnika.</div>';
  }
  const przypiete = stan.notatki.filter(n => n.przypiete);
  const reszta = stan.notatki.filter(n => !n.przypiete);
  let html = '';
  if (przypiete.length) html += '<h2 class="sekcja">Przypięte</h2>' + przypiete.map(notatkaHTML).join('');
  if (reszta.length) html += (przypiete.length ? '<h2 class="sekcja">Reszta</h2>' : '') + reszta.map(notatkaHTML).join('');
  return html;
}

function notatkaHTML(n){
  const d = new Date(n.utworzone);
  const kiedyTxt = d.toLocaleDateString('pl-PL',{day:'numeric', month:'short'});
  return '<div class="notka' + (n.przypiete ? ' przypieta' : '') + '" data-id="' + n.id + '">' +
    '<div class="notkaTresc" data-akcja="edytujNotke">' + esc(n.tresc) + '</div>' +
    '<div class="notkaStopka">' +
      '<span class="notkaData">' + kiedyTxt + '</span>' +
      '<div class="notkaBtny">' +
        '<button class="mini" data-akcja="przypnij" title="Przypnij">' + (n.przypiete ? '★' : '☆') + '</button>' +
        '<button class="mini szeroka" data-akcja="naZadanie">→ zadanie</button>' +
        '<button class="mini" data-akcja="usunNotke" title="Usuń">✕</button>' +
      '</div>' +
    '</div></div>';
}

function edytujNotke(el, id){
  const n = stan.notatki.find(x => x.id === id);
  if (!n || el.querySelector('textarea')) return;
  const ta = document.createElement('textarea');
  ta.className = 'edycjaNotki';
  ta.value = n.tresc;
  el.textContent = '';
  el.appendChild(ta);
  ta.style.height = Math.max(ta.scrollHeight, 60) + 'px';
  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);
  ta.addEventListener('input', () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; });
  ta.addEventListener('blur', () => {
    const nowy = ta.value.trim();
    if (nowy && nowy !== n.tresc){ n.tresc = nowy; zapisz(); }
    rysuj();
  });
}

/* ---------------- KALENDARZ (jak w iPhonie) ---------------- */
const MIESIACE_PL = ['styczeń','luty','marzec','kwiecień','maj','czerwiec',
  'lipiec','sierpień','wrzesień','październik','listopad','grudzień'];

let mcPokazany = (() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; })();
let dzienWybrany = dzisiaj();

function zadaniaDnia(ts){
  return stan.zadania.filter(z => z.kiedy && dzien(z.kiedy) === ts).sort(sortuj);
}

function widokKalendarz(){
  const rok = mcPokazany.getFullYear(), mies = mcPokazany.getMonth();
  const pierwszy = new Date(rok, mies, 1);
  // poniedzialek jako pierwszy dzien tygodnia
  const przesun_ = (pierwszy.getDay() + 6) % 7;
  const start = new Date(rok, mies, 1 - przesun_);

  let html = '<div class="kalNag">' +
    '<button class="kalStrz" data-ruch="-1">‹</button>' +
    '<div class="kalMc">' + MIESIACE_PL[mies] + ' <span>' + rok + '</span></div>' +
    '<button class="kalStrz" data-ruch="1">›</button>' +
    '</div>';

  html += '<div class="kalDni">' +
    ['pn','wt','śr','cz','pt','so','nd'].map(d => '<div>' + d + '</div>').join('') +
    '</div>';

  html += '<div class="kalSiatka">';
  for (let i = 0; i < 42; i++){
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const ts = dzien(d);
    const zad = zadaniaDnia(ts);
    const otwarte = zad.filter(z => !z.zrobione);
    const klasy = ['kalDzien'];
    if (d.getMonth() !== mies) klasy.push('obcy');
    if (ts === dzisiaj()) klasy.push('dzisiaj');
    if (ts === dzienWybrany) klasy.push('wybrany');
    if ((d.getDay() + 6) % 7 >= 5) klasy.push('weekend');

    let kropki = '';
    if (otwarte.length){
      const pilne = otwarte.some(z => z.pilne);
      const ile = Math.min(otwarte.length, 3);
      kropki = '<div class="kalKropki">' +
        Array.from({length: ile}, () => '<i class="' + (pilne ? 'pilna' : '') + '"></i>').join('') +
        '</div>';
    }
    html += '<button class="' + klasy.join(' ') + '" data-dzien="' + ts + '">' +
      '<span class="kalNr">' + d.getDate() + '</span>' + kropki + '</button>';
  }
  html += '</div>';

  // --- lista wybranego dnia ---
  const wyb = new Date(dzienWybrany);
  const nazwa = wyb.toLocaleDateString('pl-PL',{weekday:'long', day:'numeric', month:'long'});
  const zad = zadaniaDnia(dzienWybrany);
  html += '<div class="kalDzienNag">' + nazwa.charAt(0).toUpperCase() + nazwa.slice(1) +
          (dzienWybrany === dzisiaj() ? ' <b>dziś</b>' : '') + '</div>';

  if (!zad.length){
    html += '<div class="pusto" style="padding:26px 20px">Nic tego dnia.</div>';
  } else {
    html += zad.map(kartaHTML).join('');
  }

  return html;
}

function widokTeraz(){
  const z = coTeraz();
  const naDzis = stan.zadania.filter(x => !x.zrobione && x.kiedy && dzien(x.kiedy) <= dzisiaj()).length;
  const ileNotatek = stan.notatki.length;

  let html = '<div class="licznik">' +
    '<div class="licznikBox"><b>' + naDzis + '</b><span>na dziś</span></div>' +
    '<div class="licznikBox"><b>' + ileNotatek + '</b><span>w notatniku</span></div>' +
    '<div class="licznikBox"><b>' + (stan.seria.dzien === dzisiaj() ? stan.seria.ile : 0) + '</b><span>zrobione dziś</span></div>' +
    '</div>';

  html += '<div id="timerMiejsce"></div>';

  if (!z){
    html += '<div class="pusto"><b>Czysto.</b>Nic nie wisi. Jak coś Ci wpadnie do głowy — wciśnij mikrofon na dole i powiedz.</div>';
    return html;
  }

  const data = ludzkaData(z);
  const blisko = zaIle(z);
  html += '<div class="hero">' +
    '<div class="heroNag">Zrób to teraz</div>' +
    '<div class="heroTytul">' + esc(z.tytul) + '</div>' +
    '<div class="heroMeta">' + (data ? data : 'bez terminu') + (blisko ? ' · ' + blisko.txt : '') +
      (z.trwanie ? ' · ' + trwanieTxt(z.trwanie) : '') + '</div>' +
    '<div class="heroBtny" data-id="' + z.id + '">' +
      '<button class="btn glowny" data-akcja="zrobione">Zrobione ✓</button>' +
      '<button class="btn" data-akcja="fokus">Start ' + (z.trwanie || stan.ustawienia.fokus) + ' min</button>' +
      '<button class="btn" data-akcja="plus">+15 min</button>' +
      '<button class="btn" data-akcja="jutro">Jutro</button>' +
    '</div></div>';

  const reszta = stan.zadania.filter(x => !x.zrobione && x.id !== z.id);
  if (reszta.length){
    html += '<h2 class="sekcja">Potem (' + reszta.length + ')</h2>';
    html += reszta.sort(sortuj).slice(0,4).map(kartaHTML).join('');
    if (reszta.length > 4) html += '<div class="pusto" style="padding:12px">…i ' + (reszta.length-4) + ' więcej w zakładce Wszystko</div>';
  }
  return html;
}

function sortuj(a,b){
  if (!a.kiedy && !b.kiedy) return 0;
  if (!a.kiedy) return 1;
  if (!b.kiedy) return -1;
  return new Date(a.kiedy) - new Date(b.kiedy);
}

function widokDzis(){
  const otwarte = stan.zadania.filter(z => !z.zrobione);
  const spoznione = otwarte.filter(z => z.kiedy && dzien(z.kiedy) < dzisiaj()).sort(sortuj);
  const dzis = otwarte.filter(z => z.kiedy && dzien(z.kiedy) === dzisiaj()).sort(sortuj);
  const zrobioneDzis = stan.zadania.filter(z => z.zrobione && z.kiedy && dzien(z.kiedy) === dzisiaj());

  let html = '';
  if (spoznione.length) html += '<h2 class="sekcja">Zaległe — bez wyrzutów, po prostu przesuń albo zrób</h2>' + spoznione.map(kartaHTML).join('');
  if (dzis.length) html += '<h2 class="sekcja">Dziś</h2>' + dzis.map(kartaHTML).join('');
  if (zrobioneDzis.length) html += '<h2 class="sekcja">Zrobione dziś</h2>' + zrobioneDzis.map(kartaHTML).join('');
  if (!html) html = '<div class="pusto"><b>Dziś pusto.</b>Wrzuć coś głosem — reszta sama się poukłada.</div>';
  return html;
}

function widokWszystko(){
  const otwarte = stan.zadania.filter(z => !z.zrobione);
  const pozniej = otwarte.filter(z => z.kiedy && dzien(z.kiedy) > dzisiaj()).sort(sortuj);
  const reszta = otwarte.filter(z => !z.kiedy || dzien(z.kiedy) <= dzisiaj()).sort(sortuj);
  const zrobione_ = stan.zadania.filter(z => z.zrobione).slice(-30).reverse();

  let html = '';
  if (reszta.length) html += '<h2 class="sekcja">Aktualne</h2>' + reszta.map(kartaHTML).join('');
  if (pozniej.length) html += '<h2 class="sekcja">Nadchodzące</h2>' + pozniej.map(kartaHTML).join('');
  if (zrobione_.length) html += '<h2 class="sekcja">Historia</h2>' + zrobione_.map(kartaHTML).join('');
  if (!html) html = '<div class="pusto"><b>Pusto.</b>Zacznij od mikrofonu na dole.</div>';
  return html;
}

/* ---------------- fokus (timer) ---------------- */
function startFokus(id){
  const z = stan.zadania.find(x => x.id === id);
  if (!z) return;
  const minuty = z.trwanie || stan.ustawienia.fokus;
  fokus = { id, koniec: Date.now() + minuty*60000 };
  clearInterval(fokus.tick);
  fokus.tick = setInterval(rysujTimer, 1000);
  rysuj();
}
function stopFokus(){
  if (fokus) clearInterval(fokus.tick);
  fokus = null; rysuj();
}
function rysujTimer(){
  const miejsce = document.getElementById('timerMiejsce');
  if (!miejsce || !fokus) return;
  const z = stan.zadania.find(x => x.id === fokus.id);
  const zostalo = Math.max(0, Math.round((fokus.koniec - Date.now())/1000));
  const mm = String(Math.floor(zostalo/60)).padStart(2,'0');
  const ss = String(zostalo%60).padStart(2,'0');
  miejsce.innerHTML = '<div class="timer">' +
    '<div class="timerCyfry">' + mm + ':' + ss + '</div>' +
    '<div class="timerOpis">' + (z ? esc(z.tytul) : '') + '</div>' +
    '<div class="heroBtny" style="justify-content:center" data-id="' + fokus.id + '">' +
      '<button class="btn glowny" data-akcja="zrobione">Zrobione ✓</button>' +
      '<button class="btn" data-akcja="stopFokus">Przerwij</button>' +
    '</div></div>';
  if (zostalo === 0){
    clearInterval(fokus.tick);
    powiadom('Koniec bloku', z ? z.tytul : 'Fokus skończony');
    fokus = null;
  }
}

/* ---------------- powiadomienia ---------------- */
function powiadom(tytul, tresc){
  try{
    if ('Notification' in window && Notification.permission === 'granted'){
      new Notification(tytul, { body: tresc, icon:'icon.png', tag: tytul + tresc });
    } else { toast(tytul + ' — ' + tresc); }
  }catch(e){ toast(tytul); }
}

setInterval(() => {
  const teraz = Date.now();
  const przed = (stan.ustawienia.przed || 0) * 60000;
  let zmiana = false;
  for (const z of stan.zadania){
    if (z.zrobione || !z.kiedy || !z.maGodzine || z.powiadomiono) continue;
    const t = new Date(z.kiedy).getTime();
    if (teraz >= t - przed && teraz < t + 3600000){
      const ile = Math.round((t - teraz)/60000);
      powiadom(z.tytul, ile > 0 ? 'za ' + ile + ' min' : 'teraz');
      z.powiadomiono = true; zmiana = true;
    }
  }
  if (zmiana) zapisz();
  // nie przerysowuj, gdy ktos wlasnie poprawia tekst zadania
  if (!document.querySelector('input.edycja')) rysuj();
}, 20000);

/* ---------------- .ics — realne przypomnienia w iPhone ---------------- */
function icsData(d){
  const p = n => String(n).padStart(2,'0');
  return d.getUTCFullYear() + p(d.getUTCMonth()+1) + p(d.getUTCDate()) + 'T' +
         p(d.getUTCHours()) + p(d.getUTCMinutes()) + '00Z';
}
function zrobIcs(lista){
  const teraz = new Date();
  let out = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Ogarniacz//PL','CALSCALE:GREGORIAN'];
  for (const z of lista){
    if (!z.kiedy) continue;
    const start = new Date(z.kiedy);
    const koniec = new Date(start.getTime() + (z.trwanie || 30)*60000);
    out.push('BEGIN:VEVENT');
    out.push('UID:' + z.id + '@ogarniacz');
    out.push('DTSTAMP:' + icsData(teraz));
    out.push('DTSTART:' + icsData(start));
    out.push('DTEND:' + icsData(koniec));
    out.push('SUMMARY:' + String(z.tytul).replace(/[,;\\]/g, m => '\\' + m));
    if (z.powtarzanie === 'dziennie') out.push('RRULE:FREQ=DAILY');
    if (z.powtarzanie === 'tygodniowo') out.push('RRULE:FREQ=WEEKLY');
    if (z.powtarzanie === 'miesiecznie') out.push('RRULE:FREQ=MONTHLY');
    out.push('BEGIN:VALARM','TRIGGER:-PT' + (stan.ustawienia.przed || 10) + 'M','ACTION:DISPLAY','DESCRIPTION:' + String(z.tytul).replace(/[,;\\]/g, m => '\\' + m),'END:VALARM');
    out.push('END:VEVENT');
  }
  out.push('END:VCALENDAR');
  return out.join('\r\n');
}
function pobierz(nazwa, tresc, typ){
  const blob = new Blob([tresc], { type: typ || 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = nazwa;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

/* ---------------- glos ----------------
   Safari na iOS (14.5+) i Chrome na Macu maja webkitSpeechRecognition.
   Klikasz raz, mowisz, apka sama zapisuje. Klikniecie w trakcie = koniec. */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rozpoznawanie = null, sluchaTeraz = false, celowoStop = false, cosUslyszano = false;
let ostatniePoprawki = [];

function inicjujGlos(){
  if (!SR) return null;
  const r = new SR();
  r.lang = 'pl-PL';
  r.continuous = false;       // iOS i tak ignoruje true; obslugujemy restartem
  r.interimResults = true;
  r.maxAlternatives = 1;

  r.onstart = () => {
    sluchaTeraz = true; cosUslyszano = false;
    $('#btnMic').classList.add('slucha');
    if (navigator.vibrate) navigator.vibrate(12);
  };

  r.onresult = (e) => {
    let txt = '';
    for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
    if (txt.trim()) cosUslyszano = true;
    const pop = poprawSlownikiem(txt);
    if (pop.zmiany.length) ostatniePoprawki = pop.zmiany;
    $('#pole').value = pop.tekst;
    pokazPodglad(pop.tekst);
  };

  r.onerror = (e) => {
    sluchaTeraz = false;
    $('#btnMic').classList.remove('slucha');
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed'){
      celowoStop = true;
      toast('Brak zgody na mikrofon — wpuść go dla tej strony');
    } else if (e.error === 'no-speech'){
      // cisza: nie traktujemy jak bledu, onend zdecyduje czy wznowic
    } else if (e.error === 'network'){
      celowoStop = true;
      toast('Rozpoznawanie mowy potrzebuje internetu');
    }
  };

  r.onend = () => {
    sluchaTeraz = false;
    $('#btnMic').classList.remove('slucha');
    const txt = $('#pole').value.trim();
    if (txt){ zatwierdz(); celowoStop = false; return; }
    // iOS potrafi uciac nasluch po ~1s ciszy — dajemy jeszcze jedno podejscie
    if (!celowoStop && !cosUslyszano){
      celowoStop = true;                       // tylko jeden restart, bez petli
      try{ rozpoznawanie.start(); }catch(err){}
      return;
    }
    celowoStop = false;
  };
  return r;
}

function mikrofon(){
  if (!SR){
    // starsze Safari / przegladarka bez Web Speech: dyktowanie z klawiatury
    $('#pole').focus();
    toast('Wciśnij mikrofon na klawiaturze i mów');
    return;
  }
  if (!rozpoznawanie) rozpoznawanie = inicjujGlos();
  if (sluchaTeraz){ celowoStop = true; rozpoznawanie.stop(); return; }
  $('#pole').value = '';
  $('#podglad').classList.add('ukryty');
  celowoStop = false;
  try{
    rozpoznawanie.start();
  }catch(e){
    // "already started" — ubijamy i probujemy raz jeszcze
    try{ rozpoznawanie.abort(); rozpoznawanie.start(); }
    catch(e2){ toast('Mikrofon zajęty, kliknij jeszcze raz'); }
  }
}

/* ---------------- podglad parsowania ---------------- */
function pokazPodglad(txt){
  const el = $('#podglad');
  if (!txt.trim()){ el.classList.add('ukryty'); return; }
  const linie = rozbij(txt).map(kawalek => {
    const p = parsuj(kawalek);
    const czesci = ['<b>' + esc(p.tytul) + '</b>'];
    czesci.push(p.kiedy ? ludzkaData({ kiedy:p.kiedy, maGodzine:p.maGodzine }) : 'bez terminu');
    if (p.pilne) czesci.push('pilne');
    if (p.trwanie) czesci.push(trwanieTxt(p.trwanie));
    if (p.powtarzanie) czesci.push(p.powtarzanie);
    return czesci.join(' · ');
  });
  const p1 = parsuj(rozbij(txt)[0]);
  let chipy = '';
  if (!czyNotatka(txt) && widok !== 'notatnik' && !p1.maGodzine){
    chipy = '<div class="szybkie">' +
      [['za 30 minut','za 30 min'],['za godzinę','za godzinę'],
       ['dziś o 18','dziś 18:00'],['jutro o 9','jutro 9:00']]
      .map(([fraza,etykieta]) => '<button data-szybko="' + fraza + '">' + etykieta + '</button>').join('') +
      '</div>';
  }
  el.innerHTML = linie.join('<br>') + chipy;
  el.classList.remove('ukryty');
}

/* Jednym tchem mozna wyrzucic kilka rzeczy naraz:
   "zadzwon do Marka o 15 oraz kup mleko, a potem wyslij galerie".
   Tniemy tylko na jednoznacznych spojnikach — zwykle "i" zostawiamy w spokoju,
   zeby "Marka i Anny" nie rozpadlo sie na dwa zadania. */
function rozbij(txt){
  const czesci = String(txt)
    .split(/\s*(?:;|\n|,?\s*(?:a potem|a nastepnie|a następnie|i jeszcze|oraz|potem|nastepnie|następnie)\s+)/i)
    .map(s => s.trim())
    .filter(s => s.length > 2);
  return czesci.length ? czesci : [txt];
}

function zatwierdz(){
  const txt = $('#pole').value;
  if (!txt.trim()) return;

  // "notatka ..." / "pomysl ..." zawsze do notatnika; w zakladce Notatnik — wszystko
  if (czyNotatka(txt) || widok === 'notatnik'){
    const n = dodajNotatke(txt);
    if (!n) return;
    $('#pole').value = '';
    $('#podglad').classList.add('ukryty');
    ostatniePoprawki = [];
    if (widok !== 'notatnik'){ widok = 'notatnik'; ustawZakladke('notatnik'); }
    rysuj();
    if (navigator.vibrate) navigator.vibrate([10,40,10]);
    toast('Zapisane w notatniku');
    return;
  }

  const dodane = rozbij(txt).map(dodajZTekstu).filter(Boolean);
  if (!dodane.length) return;
  $('#pole').value = '';
  $('#podglad').classList.add('ukryty');
  rysuj();
  if (navigator.vibrate) navigator.vibrate([10,40,10]);
  if (ostatniePoprawki.length){
    toast('Poprawione: ' + ostatniePoprawki.map(z => z[1]).join(', '));
    ostatniePoprawki = [];
  } else if (dodane.length === 1){
    const z = dodane[0];
    toast(z.kiedy ? 'Zapisane: ' + ludzkaData(z) : 'Wrzucone do skrzynki');
  } else {
    toast('Zapisane ' + dodane.length + ' rzeczy');
  }
}

/* ---------------- zdarzenia ---------------- */
$('#podglad').addEventListener('click', e => {
  const b = e.target.closest('[data-szybko]'); if (!b) return;
  const pole = $('#pole');
  pole.value = pole.value.trim() + ' ' + b.dataset.szybko;
  pokazPodglad(pole.value);
});

$('#btnDodaj').onclick = zatwierdz;
$('#btnMic').onclick = mikrofon;
$('#pole').addEventListener('input', e => pokazPodglad(e.target.value));
$('#pole').addEventListener('keydown', e => { if (e.key === 'Enter') zatwierdz(); });

function ustawZakladke(nazwa){
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.widok === nazwa));
}

$('#tabs').addEventListener('click', e => {
  const b = e.target.closest('.tab'); if (!b) return;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  b.classList.add('active');
  widok = b.dataset.widok;
  rysuj();
});

$('#ekran').addEventListener('click', e => {
  // nawigacja kalendarza
  const strz = e.target.closest('[data-ruch]');
  if (strz){
    mcPokazany.setMonth(mcPokazany.getMonth() + (+strz.dataset.ruch));
    rysuj(); return;
  }
  const kom = e.target.closest('[data-dzien]');
  if (kom){
    dzienWybrany = +kom.dataset.dzien;
    const d = new Date(dzienWybrany);
    if (d.getMonth() !== mcPokazany.getMonth()){
      mcPokazany = new Date(d.getFullYear(), d.getMonth(), 1);
    }
    rysuj(); return;
  }

  const btn = e.target.closest('[data-akcja]'); if (!btn) return;
  const kontener = btn.closest('[data-id]'); if (!kontener) return;
  const id = kontener.dataset.id;
  const a = btn.dataset.akcja;
  if (a === 'edytujNotke'){ edytujNotke(btn, id); return; }
  if (a === 'naZadanie'){ notatkaNaZadanie(id); return; }
  if (a === 'przypnij'){
    const n = stan.notatki.find(x => x.id === id);
    if (n){ n.przypiete = !n.przypiete; zapisz(); rysuj(); }
    return;
  }
  if (a === 'usunNotke'){
    const i = stan.notatki.findIndex(x => x.id === id);
    if (i >= 0){ stan.notatki.splice(i,1); zapisz(); rysuj(); toast('Notatka usunięta'); }
    return;
  }
  if (a === 'edytuj'){ edytuj(btn, id); return; }
  if (a === 'zrobione'){ if (fokus && fokus.id === id) stopFokus(); zrobione(id); }
  else if (a === 'plus') przesun(id, 15);
  else if (a === 'jutro') naJutro(id);
  else if (a === 'usun') usun(id);
  else if (a === 'fokus') startFokus(id);
  else if (a === 'stopFokus') stopFokus();
});

/* ---------------- ustawienia ---------------- */
function rysujSlownik(){
  const el = $('#listaSlow');
  if (!el) return;
  if (!stan.slownik.length){
    el.innerHTML = '<div class="slownikPusto">Jeszcze nic. Dodaj imiona, ktore dyktowanie przekreca.</div>';
    return;
  }
  el.innerHTML = stan.slownik.map((w, i) =>
    '<span class="slowo">' + esc(w) + '<button data-slowo="' + i + '">\u00d7</button></span>'
  ).join('');
}

$('#listaSlow').addEventListener('click', e => {
  const b = e.target.closest('[data-slowo]'); if (!b) return;
  stan.slownik.splice(+b.dataset.slowo, 1);
  zapisz(); rysujSlownik();
});

$('#btnSlowo').onclick = () => {
  const w = $('#inpSlowo').value.trim();
  if (!w) return;
  if (zapamietajSlowo(w)) { $('#inpSlowo').value = ''; rysujSlownik(); }
  else toast('Juz to znam');
};
$('#inpSlowo').addEventListener('keydown', e => { if (e.key === 'Enter') $('#btnSlowo').click(); });

$('#btnUstawienia').onclick = () => {
  rysujSlownik();
  $('#selPrzed').value = String(stan.ustawienia.przed);
  $('#selFokus').value = String(stan.ustawienia.fokus);
  $('#btnPowiadomienia').textContent =
    ('Notification' in window && Notification.permission === 'granted') ? 'Włączone ✓' : 'Włącz';
  $('#modal').classList.remove('ukryty');
};
$('#btnZamknij').onclick = () => $('#modal').classList.add('ukryty');
$('#selPrzed').onchange = e => { stan.ustawienia.przed = +e.target.value; zapisz(); };
$('#selFokus').onchange = e => { stan.ustawienia.fokus = +e.target.value; zapisz(); };
$('#btnPowiadomienia').onclick = async () => {
  if (!('Notification' in window)) { toast('Ta przeglądarka nie ma powiadomień'); return; }
  const w = await Notification.requestPermission();
  $('#btnPowiadomienia').textContent = w === 'granted' ? 'Włączone ✓' : 'Odmowa';
  if (w === 'granted') powiadom('Ogarniacz', 'Powiadomienia działają.');
};
$('#btnIcsWszystko').onclick = () => {
  const lista = stan.zadania.filter(z => !z.zrobione && z.kiedy);
  if (!lista.length){ toast('Brak zadań z terminem'); return; }
  pobierz('ogarniacz.ics', zrobIcs(lista), 'text/calendar;charset=utf-8');
};
$('#btnEksport').onclick = () => pobierz('ogarniacz-kopia.json', JSON.stringify(stan,null,2), 'application/json');
$('#inpImport').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try{
      const s = JSON.parse(r.result);
      if (!Array.isArray(s.zadania)) throw 0;
      stan.zadania = s.zadania.map(z => (z.kiedy ? Object.assign({}, z, { kiedy:new Date(z.kiedy) }) : z));
      stan.ustawienia = Object.assign(stan.ustawienia, s.ustawienia || {});
      zapisz(); rysuj(); toast('Wczytane: ' + stan.zadania.length + ' zadań');
    }catch(err){ toast('Nie udało się wczytać pliku'); }
  };
  r.readAsText(f);
};

/* ---------------- start ---------------- */
if ('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js').then(reg => {
    // nowa wersja wgrana ze skryptu wgraj.sh — bierzemy ja od razu
    reg.addEventListener('updatefound', () => {
      const nowy = reg.installing;
      if (!nowy) return;
      nowy.addEventListener('statechange', () => {
        if (nowy.state === 'installed' && navigator.serviceWorker.controller){
          nowy.postMessage('odswiez');
          toast('Nowa wersja — odświeżam');
          setTimeout(() => location.reload(), 900);
        }
      });
    });
    // sprawdzaj przy kazdym powrocie do apki
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) reg.update().catch(() => {});
    });
  }).catch(() => {});
}
rysuj();
