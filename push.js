/* Prawdziwe powiadomienia — telefon odzywa sie tez przy zamknietej apce.
   Apka wysyla na wlasny serwer tylko plan: o ktorej i z jakim tekstem.
   Serwer nie wie nic wiecej i nalezy do Ciebie. */

const PUSH_SERWER = 'https://ogarniacz-push.ogarniacz-janz.workers.dev';
const VAPID_PUBLIC = 'BNrI3aOoMCdz-HGeKSp154mr5QA7tFG3a0A_XcY6diU-DY4GfNfy8vvlETITeg2uCzB1dgIw9uoqqWGmAzqylfg';

function kluczDoBajtow(base64){
  const uzup = '='.repeat((4 - base64.length % 4) % 4);
  const zwykly = (base64 + uzup).replace(/-/g, '+').replace(/_/g, '/');
  const surowy = atob(zwykly);
  return Uint8Array.from([...surowy].map(c => c.charCodeAt(0)));
}

function pushDostepny(){
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

async function subskrypcja(){
  if (!pushDostepny()) return null;
  const reg = await navigator.serviceWorker.ready;
  return await reg.pushManager.getSubscription();
}

async function wlaczPush(){
  if (!pushDostepny()){
    toast('Ta przeglądarka nie obsługuje powiadomień');
    return false;
  }
  if (PUSH_SERWER.startsWith('PODMIEN')){
    toast('Serwer powiadomień nie jest jeszcze ustawiony');
    return false;
  }

  const zgoda = await Notification.requestPermission();
  if (zgoda !== 'granted'){
    toast('Bez zgody na powiadomienia się nie da');
    return false;
  }

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub){
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: kluczDoBajtow(VAPID_PUBLIC)
    });
  }

  stan.ustawienia.push = true;
  zapisz();
  await wyslijPlan();

  // proba, zeby od razu bylo widac, ze dziala
  try{
    await fetch(PUSH_SERWER + '/proba', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sub })
    });
  }catch(e){}
  return true;
}

async function wylaczPush(){
  const sub = await subskrypcja();
  if (sub){
    try{
      await fetch(PUSH_SERWER + '/wypisz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint })
      });
    }catch(e){}
    await sub.unsubscribe();
  }
  stan.ustawienia.push = false;
  zapisz();
}

/* Buduje plan przypomnien na najblizsze dni i wysyla go na serwer.
   Lecimy 14 dni do przodu — dalej i tak plan sie zmieni. */
function zbudujPlan(){
  const plan = [];
  const teraz = Date.now();
  const granica = teraz + 14 * 86400000;
  const przed = (stan.ustawienia.przed || 0) * 60000;
  const startPracy = naMinuty(stan.ustawienia.pracaOd);

  for (const z of stan.zadania){
    if (z.zrobione || !z.kiedy) continue;

    if (z.maGodzine){
      const t = new Date(z.kiedy).getTime() - przed;
      if (t > teraz && t < granica){
        plan.push({ id: z.id, t, tytul: z.tytul, tresc: przed ? 'za ' + (przed/60000) + ' min' : 'teraz' });
      }
    } else {
      // calodniowe i okresy — o starcie dnia pracy, kazdego dnia okresu
      const od = dzien(z.kiedy), doD = z.doKiedy ? dzien(z.doKiedy) : od;
      for (let d = od; d <= doD && d < granica; d += 86400000){
        const dt = new Date(d);
        if (!stan.ustawienia.weekend && (dt.getDay() === 0 || dt.getDay() === 6)) continue;
        const t = d + startPracy * 60000;
        if (t <= teraz) continue;
        const zostalo = Math.round((doD - d) / 86400000);
        plan.push({
          id: z.id + '-' + d, t, tytul: z.tytul,
          tresc: z.doKiedy ? (zostalo === 0 ? 'ostatni dzień' : 'zostało ' + zostalo + ' dni') : 'na dziś'
        });
      }
    }
  }

  // rytm dnia: plan rano, pytanie o jutro wieczorem
  const wieczor = naMinuty(stan.ustawienia.wieczor);
  for (let i = 0; i < 14; i++){
    const d = dzisiaj() + i * 86400000;
    const dt = new Date(d);
    const roboczy = stan.ustawienia.weekend || (dt.getDay() >= 1 && dt.getDay() <= 5);

    if (roboczy){
      const t = d + startPracy * 60000;
      if (t > teraz){
        const ile = stan.zadania.filter(z => !z.zrobione && z.kiedy && dzien(z.kiedy) === d).length;
        plan.push({ id: 'rano-' + d, t, tytul: 'Plan dnia',
          tresc: ile ? 'Masz dziś ' + ile + ' do zrobienia' : 'Dziś pusto — dobrze czy coś umyka?' });
      }
    }
    const tw = d + wieczor * 60000;
    if (tw > teraz){
      plan.push({ id: 'wieczor-' + d, t: tw, tytul: 'Co jutro?',
        tresc: 'Wrzuć teraz, żeby jutro nie szukać w głowie' });
    }
  }

  plan.sort((a, b) => a.t - b.t);
  return plan.slice(0, 200);
}

async function wyslijPlan(){
  if (!stan.ustawienia.push) return;
  const sub = await subskrypcja();
  if (!sub) return;
  try{
    await fetch(PUSH_SERWER + '/zapisz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sub, plan: zbudujPlan() })
    });
  }catch(e){}
}

/* Plan odswiezamy po kazdej zmianie zadan, ale nie czesciej niz raz na 5 sekund. */
let planTimer = null;
function planDoOdswiezenia(){
  if (!stan.ustawienia.push) return;
  clearTimeout(planTimer);
  planTimer = setTimeout(wyslijPlan, 5000);
}
