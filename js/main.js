// Site public : affiche le contenu, télécharge le CV, envoie les messages.
// La page s'affiche immédiatement (cache local ou contenu par défaut),
// puis se met à jour discrètement quand Firestore répond.
import { cachedContent, fetchContent, esc } from './data.js';
import { isConfigured, getDb } from './firebase.js';

const $ = s => document.querySelector(s);
let c, photo, lastJson = '';

function render(data) {
  const json = JSON.stringify(data);
  if (json === lastJson) return false; // rien n'a changé : on ne touche pas au DOM
  lastJson = json;
  ({ content: c, photo } = data);

  document.querySelectorAll('[data-f]').forEach(el => { el.textContent = c[el.dataset.f] ?? ''; });
  document.querySelectorAll('[data-photo]').forEach(img => { if (img.getAttribute('src') !== photo) img.src = photo; });

  // Chiffres clés (animés par anim.js)
  const firstYear = Math.min(...c.experiences.map(e => parseInt(e.period, 10)).filter(Boolean));
  const counts = { years: new Date().getFullYear() - (Number.isFinite(firstYear) ? firstYear : 1994), services: c.services.length, languages: c.languages.length };
  document.querySelectorAll('[data-count]').forEach(el => {
    const v = counts[el.dataset.count];
    el.dataset.target = v;
    if (!el.dataset.animating) el.textContent = v + (el.dataset.count === 'years' ? '+' : '');
  });

  $('#services-list').innerHTML = c.services.map((s, i) => `
    <article class="card service" data-reveal style="--d:${(i % 3) * 120}ms">
      <span class="num">${String(i + 1).padStart(2, '0')}</span>
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.text)}</p>
    </article>`).join('');

  $('#skills').innerHTML = c.skills.map(s => `<li>${esc(s)}</li>`).join('');
  $('#interests').innerHTML = c.interests.map(s => `<li>${esc(s)}</li>`).join('');
  $('#languages').innerHTML = c.languages.map(l => `<li><span>${esc(l.name)}</span><span>${esc(l.level)}</span></li>`).join('');

  $('#experiences').innerHTML = c.experiences.filter(e => !e.cvOnly).map(e => `
    <li data-reveal="right">
      <p class="period">${esc(e.period)}</p>
      <h3>${esc(e.title)}</h3>
      <p class="org">${esc([e.org, e.place].filter(Boolean).join(' — '))}</p>
      ${e.tasks?.length ? `<ul>${e.tasks.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
    </li>`).join('');

  $('#phones').innerHTML = c.phones.map(p => `<a href="tel:+229${esc(String(p).replace(/\D/g, ''))}">${esc(p)}</a>`).join(' / ');
  $('#email-link').textContent = c.email;
  $('#email-link').href = `mailto:${c.email}`;
  const wa = String(c.whatsapp || '').replace(/\D/g, '');
  $('#whatsapp').hidden = !wa;
  if (wa) $('#whatsapp').href = `https://wa.me/${wa}`;

  const sel = $('#subject'), prev = sel.value;
  sel.innerHTML = [...c.services.map(s => s.title), 'Autre demande'].map(t => `<option>${esc(t)}</option>`).join('');
  if ([...sel.options].some(o => o.value === prev)) sel.value = prev;
  return true;
}

$('#year').textContent = new Date().getFullYear();

// 1. Affichage immédiat
render(cachedContent());
document.documentElement.dataset.ready = '1';
document.dispatchEvent(new Event('content-ready'));

// 2. Mise à jour depuis Firestore, sans bloquer la page
fetchContent().then(data => {
  if (data && render(data)) document.dispatchEvent(new Event('content-updated'));
});

// Téléchargement du CV (le générateur PDF n'est chargé qu'au clic)
document.querySelectorAll('[data-cv]').forEach(btn => btn.addEventListener('click', async () => {
  const label = btn.textContent;
  btn.disabled = true; btn.textContent = 'Préparation du CV…';
  try { const { downloadCv } = await import('./cv.js'); await downloadCv(c, photo); }
  catch (e) { alert(e.message); }
  finally { btn.disabled = false; btn.textContent = label; }
}));

// Formulaire de contact
const form = $('#contact-form'), status = form.querySelector('.form-status');
const setStatus = (msg, cls = '') => { status.textContent = msg; status.className = 'form-status' + (cls ? ' ' + cls : ''); };
form.addEventListener('submit', async ev => {
  ev.preventDefault();
  if (!form.reportValidity()) return;
  const d = Object.fromEntries(new FormData(form));
  if (!isConfigured) {
    // Sans Firebase : on ouvre la messagerie du visiteur.
    const body = `${d.message}\n\n${d.name}\n${d.email}\n${d.phone}`;
    location.href = `mailto:${c.email}?subject=${encodeURIComponent(d.subject)}&body=${encodeURIComponent(body)}`;
    return;
  }
  // Mêmes contrôles que firestore.rules, pour un message d'erreur clair.
  if (!d.name.trim()) return setStatus('Indiquez votre nom.', 'err');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email.trim())) return setStatus('Adresse email invalide.', 'err');
  if (d.message.trim().length < 5) return setStatus('Votre message est trop court.', 'err');
  if (!navigator.onLine) return setStatus("Pas de connexion Internet. Réessayez, ou écrivez sur WhatsApp.", 'err');
  const btn = form.querySelector('button');
  btn.disabled = true; setStatus('Envoi…');
  try {
    const { db, fs } = await getDb();
    await fs.addDoc(fs.collection(db, 'messages'), {
      name: d.name.trim(), email: d.email.trim(), phone: (d.phone || '').trim(),
      subject: String(d.subject || '').slice(0, 200), message: d.message.trim(),
      createdAt: fs.serverTimestamp(), read: false
    });
    form.reset();
    setStatus('Merci ! Votre message a bien été envoyé.', 'ok');
  } catch (e) {
    console.error(e);
    setStatus("L'envoi a échoué. Appelez-moi ou écrivez sur WhatsApp.", 'err');
  } finally { btn.disabled = false; }
});

// Prépare Firebase dès que le visiteur s'approche du formulaire (envoi plus rapide).
if (isConfigured) form.addEventListener('focusin', () => getDb().catch(() => {}), { once: true });
