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
      return s;
    }
  }catch(e){}
  return { zadania:[], ustawienia:{ przed:10, fokus:25 }, seria:{ dzien:null, ile:0 } };
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

/* ---------------- zadania ---------------- */
function dodajZTekstu(tekst){
  if (!tekst.trim()) return null;
  const p = parsuj(tekst);
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
  const data = ludzkaData(z);
  const bliskoTxt = zaIle(z);
  const klasy = ['zad'];
  if (z.zrobione) klasy.push('zrobione');
  if (z.pilne) klasy.push('pilne');
  if (bliskoTxt && !bliskoTxt.spoznione) klasy.push('terazTermin');
  const meta = [];
  if (data) meta.push('<span class="tag">' + data + '</span>');
  if (bliskoTxt) meta.push('<span class="' + (bliskoTxt.spoznione ? 'spoznione' : '') + '">' + bliskoTxt.txt + '</span>');
  if (z.trwanie) meta.push('<span>' + trwanieTxt(z.trwanie) + '</span>');
  if (z.powtarzanie) meta.push('<span class="tag">powtarza się</span>');
  return '<div class="' + klasy.join(' ') + '" data-id="' + z.id + '">' +
    '<button class="ptak" data-akcja="zrobione">✓</button>' +
    '<div class="tresc"><div class="tytul">' + esc(z.tytul) + '</div>' +
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
  else ekran.innerHTML = widokWszystko();
  if (fokus) rysujTimer();
}

function widokTeraz(){
  const z = coTeraz();
  const naDzis = stan.zadania.filter(x => !x.zrobione && x.kiedy && dzien(x.kiedy) <= dzisiaj()).length;
  const skrzynka = stan.zadania.filter(x => !x.zrobione && !x.kiedy).length;

  let html = '<div class="licznik">' +
    '<div class="licznikBox"><b>' + naDzis + '</b><span>na dziś</span></div>' +
    '<div class="licznikBox"><b>' + skrzynka + '</b><span>bez terminu</span></div>' +
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
  const bez = otwarte.filter(z => !z.kiedy);
  const zrobioneDzis = stan.zadania.filter(z => z.zrobione && z.kiedy && dzien(z.kiedy) === dzisiaj());

  let html = '';
  if (spoznione.length) html += '<h2 class="sekcja">Zaległe — bez wyrzutów, po prostu przesuń albo zrób</h2>' + spoznione.map(kartaHTML).join('');
  if (dzis.length) html += '<h2 class="sekcja">Dziś</h2>' + dzis.map(kartaHTML).join('');
  if (bez.length) html += '<h2 class="sekcja">Skrzynka — do rozdzielenia (' + bez.length + ')</h2>' + bez.map(kartaHTML).join('');
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
  if (widok !== 'wszystko') rysuj();
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
    $('#pole').value = txt;
    pokazPodglad(txt);
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
  el.innerHTML = linie.join('<br>');
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
  const dodane = rozbij(txt).map(dodajZTekstu).filter(Boolean);
  if (!dodane.length) return;
  $('#pole').value = '';
  $('#podglad').classList.add('ukryty');
  rysuj();
  if (navigator.vibrate) navigator.vibrate([10,40,10]);
  if (dodane.length === 1){
    const z = dodane[0];
    toast(z.kiedy ? 'Zapisane: ' + ludzkaData(z) : 'Wrzucone do skrzynki');
  } else {
    toast('Zapisane ' + dodane.length + ' rzeczy');
  }
}

/* ---------------- zdarzenia ---------------- */
$('#btnDodaj').onclick = zatwierdz;
$('#btnMic').onclick = mikrofon;
$('#pole').addEventListener('input', e => pokazPodglad(e.target.value));
$('#pole').addEventListener('keydown', e => { if (e.key === 'Enter') zatwierdz(); });

$('#tabs').addEventListener('click', e => {
  const b = e.target.closest('.tab'); if (!b) return;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  b.classList.add('active');
  widok = b.dataset.widok;
  rysuj();
});

$('#ekran').addEventListener('click', e => {
  const btn = e.target.closest('[data-akcja]'); if (!btn) return;
  const kontener = btn.closest('[data-id]'); if (!kontener) return;
  const id = kontener.dataset.id;
  const a = btn.dataset.akcja;
  if (a === 'zrobione'){ if (fokus && fokus.id === id) stopFokus(); zrobione(id); }
  else if (a === 'plus') przesun(id, 15);
  else if (a === 'jutro') naJutro(id);
  else if (a === 'usun') usun(id);
  else if (a === 'fokus') startFokus(id);
  else if (a === 'stopFokus') stopFokus();
});

/* ---------------- ustawienia ---------------- */
$('#btnUstawienia').onclick = () => {
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
