// Site public : affiche le contenu, télécharge le CV, envoie les messages.
import { loadContent, esc } from './data.js';
import { isConfigured, getDb } from './firebase.js';
import { downloadCv } from './cv.js';

const $ = s => document.querySelector(s);
const { content: c, photo } = await loadContent();

document.querySelectorAll('[data-f]').forEach(el => { el.textContent = c[el.dataset.f] ?? ''; });
document.querySelectorAll('[data-photo]').forEach(img => { img.src = photo; });
$('#year').textContent = new Date().getFullYear();

$('#services-list').innerHTML = c.services.map((s, i) => `
  <article class="card service">
    <span class="num">${String(i + 1).padStart(2, '0')}</span>
    <h3>${esc(s.title)}</h3>
    <p>${esc(s.text)}</p>
  </article>`).join('');

$('#skills').innerHTML = c.skills.map(s => `<li>${esc(s)}</li>`).join('');
$('#interests').innerHTML = c.interests.map(s => `<li>${esc(s)}</li>`).join('');
$('#languages').innerHTML = c.languages.map(l => `<li><span>${esc(l.name)}</span><span>${esc(l.level)}</span></li>`).join('');

$('#experiences').innerHTML = c.experiences.map(e => `
  <li>
    <p class="period">${esc(e.period)}</p>
    <h3>${esc(e.title)}</h3>
    <p class="org">${esc([e.org, e.place].filter(Boolean).join(' — '))}</p>
    ${e.tasks?.length ? `<ul>${e.tasks.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
  </li>`).join('');

$('#phones').innerHTML = c.phones.map(p => `<a href="tel:+229${esc(p)}">${esc(p)}</a>`).join(' / ');
$('#email-link').textContent = c.email;
$('#email-link').href = `mailto:${c.email}`;
const wa = String(c.whatsapp || '').replace(/\D/g, '');
if (wa) $('#whatsapp').href = `https://wa.me/${wa}`; else $('#whatsapp').hidden = true;

$('#subject').innerHTML = [...c.services.map(s => s.title), 'Autre demande']
  .map(t => `<option>${esc(t)}</option>`).join('');

// Téléchargement du CV
document.querySelectorAll('[data-cv]').forEach(btn => btn.addEventListener('click', async () => {
  const label = btn.textContent;
  btn.disabled = true; btn.textContent = 'Préparation du CV…';
  try { await downloadCv(c, photo); }
  catch (e) { alert(e.message); }
  finally { btn.disabled = false; btn.textContent = label; }
}));

// Formulaire de contact
const form = $('#contact-form'), status = form.querySelector('.form-status');
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
  const btn = form.querySelector('button');
  btn.disabled = true; status.textContent = 'Envoi…'; status.className = 'form-status';
  try {
    const { db, fs } = await getDb();
    await fs.addDoc(fs.collection(db, 'messages'), {
      name: d.name.trim(), email: d.email.trim(), phone: d.phone.trim(),
      subject: d.subject, message: d.message.trim(),
      createdAt: fs.serverTimestamp(), read: false
    });
    form.reset();
    status.textContent = 'Merci ! Votre message a bien été envoyé.'; status.classList.add('ok');
  } catch (e) {
    console.error(e);
    status.textContent = "L'envoi a échoué. Appelez-moi ou écrivez sur WhatsApp."; status.classList.add('err');
  } finally { btn.disabled = false; }
});
