// Administration : connexion Google, modification du contenu, photo, messages.
import { loadContent, esc } from './data.js';
import { isConfigured, getDb, getAuth, ADMIN_EMAIL } from './firebase.js';
import { downloadCv } from './cv.js';

const $ = s => document.querySelector(s);
const form = $('#editor');
let content, photo, newPhoto = null;

/* ---------- Onglets ---------- */
document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('active', x === b));
  document.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== b.dataset.tab; });
  if (b.dataset.tab === 'messages') loadMessages();
}));

/* ---------- Listes éditables (services, expériences) ---------- */
const TEMPLATES = {
  services: s => `
    <label>Titre<input data-k="title" value="${esc(s.title)}"></label>
    <label>Description<textarea data-k="text" rows="3">${esc(s.text)}</textarea></label>`,
  experiences: e => `
    <label>Poste<input data-k="title" value="${esc(e.title)}"></label>
    <div class="row2">
      <label>Structure<input data-k="org" value="${esc(e.org)}"></label>
      <label>Ville<input data-k="place" value="${esc(e.place)}"></label>
      <label>Période<input data-k="period" value="${esc(e.period)}" placeholder="2015 – 2018"></label>
    </div>
    <label>Tâches (une par ligne)<textarea data-k="tasks" rows="4">${esc((e.tasks || []).join('\n'))}</textarea></label>`
};

function renderList(key, list) {
  $(`#${key}-ed`).innerHTML = list.map(item => `
    <div class="item">
      <div class="item-tools">
        <button type="button" data-move="-1" title="Monter">↑</button>
        <button type="button" data-move="1" title="Descendre">↓</button>
        <button type="button" class="del" data-del>Supprimer</button>
      </div>
      ${TEMPLATES[key](item)}
    </div>`).join('');
}

function readList(key) {
  return [...$(`#${key}-ed`).children].map(div => {
    const o = {};
    div.querySelectorAll('[data-k]').forEach(f => { o[f.dataset.k] = f.dataset.k === 'tasks' ? lines(f.value) : f.value.trim(); });
    return o;
  }).filter(o => o.title);
}

form.addEventListener('click', ev => {
  const item = ev.target.closest('.item');
  if (ev.target.dataset.add) {
    const key = ev.target.dataset.add;
    renderList(key, [...readListRaw(key), key === 'services' ? { title: '', text: '' } : { title: '', org: '', place: '', period: '', tasks: [] }]);
    $(`#${key}-ed`).lastElementChild.querySelector('input').focus();
  } else if (item && ev.target.hasAttribute('data-del')) {
    if (confirm('Supprimer cet élément ?')) item.remove();
  } else if (item && ev.target.dataset.move) {
    const sib = ev.target.dataset.move === '-1' ? item.previousElementSibling : item.nextElementSibling;
    if (sib) ev.target.dataset.move === '-1' ? sib.before(item) : sib.after(item);
  }
});
// Comme readList, mais garde les éléments vides (pour l'ajout).
const readListRaw = key => [...$(`#${key}-ed`).children].map(div => {
  const o = {};
  div.querySelectorAll('[data-k]').forEach(f => { o[f.dataset.k] = f.dataset.k === 'tasks' ? lines(f.value) : f.value; });
  return o;
});

const lines = v => v.split('\n').map(s => s.trim()).filter(Boolean);

/* ---------- Remplir / lire le formulaire ---------- */
function fill(c) {
  for (const k of ['name', 'title', 'tagline', 'birth', 'about', 'address', 'email', 'whatsapp']) form.elements[k].value = c[k] || '';
  form.elements.phones.value = c.phones.join('\n');
  form.elements.skills.value = c.skills.join('\n');
  form.elements.interests.value = c.interests.join('\n');
  form.elements.languages.value = c.languages.map(l => `${l.name} — ${l.level}`).join('\n');
  renderList('services', c.services);
  renderList('experiences', c.experiences);
  $('#photo-preview').src = photo;
}

function read() {
  const v = k => form.elements[k].value.trim();
  return {
    name: v('name'), title: v('title'), tagline: v('tagline'), birth: v('birth'), about: v('about'),
    address: v('address'), email: v('email'), whatsapp: v('whatsapp').replace(/\D/g, ''),
    phones: lines(v('phones')),
    skills: lines(v('skills')),
    interests: lines(v('interests')),
    languages: lines(v('languages')).map(l => {
      const [name, ...rest] = l.split(/\s+[—–-]\s+/);
      return { name: name.trim(), level: rest.join(' — ').trim() };
    }),
    services: readList('services'),
    experiences: readList('experiences')
  };
}

/* ---------- Photo : redimensionnée dans le navigateur (≤ 600 px, JPEG) ---------- */
$('#photo-input').addEventListener('change', async ev => {
  const file = ev.target.files[0];
  if (!file) return;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, 600 / Math.max(bmp.width, bmp.height));
    const cv = Object.assign(document.createElement('canvas'), { width: Math.round(bmp.width * scale), height: Math.round(bmp.height * scale) });
    cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
    newPhoto = cv.toDataURL('image/jpeg', 0.85);
    $('#photo-preview').src = newPhoto;
    status('Nouvelle photo prête : cliquez sur « Enregistrer ».');
  } catch { alert("Ce fichier n'est pas une image lisible."); }
});

/* ---------- Enregistrement ---------- */
function status(msg, cls = '') { const s = $('#save-status'); s.textContent = msg; s.className = cls; }

form.addEventListener('submit', async ev => {
  ev.preventDefault();
  if (!isConfigured) return status('Mode démo : configurez Firebase pour enregistrer.', 'err');
  const data = read();
  if (!data.name) return status('Le nom est obligatoire.', 'err');
  status('Enregistrement…');
  try {
    const { db, fs } = await getDb();
    await fs.setDoc(fs.doc(db, 'site', 'content'), { ...data, updatedAt: fs.serverTimestamp() });
    if (newPhoto) { await fs.setDoc(fs.doc(db, 'site', 'photo'), { data: newPhoto }); photo = newPhoto; newPhoto = null; }
    content = data;
    status('✔ Modifications enregistrées. Elles sont visibles sur le site.', 'ok');
  } catch (e) { console.error(e); status(`Échec : ${e.message}`, 'err'); }
});

$('#cv-preview').addEventListener('click', async () => {
  try { await downloadCv(read(), newPhoto || photo); } catch (e) { alert(e.message); }
});

/* ---------- Messages ---------- */
async function loadMessages() {
  const box = $('#messages');
  if (!isConfigured) { box.innerHTML = '<p class="muted">Les messages apparaîtront ici une fois Firebase configuré.</p>'; return; }
  box.textContent = 'Chargement…';
  const { db, fs } = await getDb();
  const snap = await fs.getDocs(fs.query(fs.collection(db, 'messages'), fs.orderBy('createdAt', 'desc')));
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  updateBadge(list.filter(m => !m.read).length);
  box.innerHTML = list.length ? list.map(m => `
    <article class="msg ${m.read ? '' : 'unread'}" data-id="${esc(m.id)}">
      <header><strong>${esc(m.name)} — ${esc(m.subject)}</strong><span class="muted">${m.createdAt?.toDate?.().toLocaleString('fr-FR') ?? ''}</span></header>
      <div><a href="mailto:${esc(m.email)}">${esc(m.email)}</a>${m.phone ? ` · <a href="tel:${esc(m.phone)}">${esc(m.phone)}</a>` : ''}</div>
      <p>${esc(m.message)}</p>
      <div class="item-tools">
        ${m.read ? '' : '<button type="button" data-read>Marquer comme lu</button>'}
        <button type="button" class="del" data-delmsg>Supprimer</button>
      </div>
    </article>`).join('') : '<p class="muted">Aucun message pour le moment.</p>';
}
const updateBadge = n => { $('#unread').hidden = !n; $('#unread').textContent = n; };

$('#messages').addEventListener('click', async ev => {
  const art = ev.target.closest('.msg');
  if (!art) return;
  const { db, fs } = await getDb();
  const ref = fs.doc(db, 'messages', art.dataset.id);
  if (ev.target.hasAttribute('data-read')) await fs.updateDoc(ref, { read: true });
  else if (ev.target.hasAttribute('data-delmsg') && confirm('Supprimer ce message ?')) await fs.deleteDoc(ref);
  else return;
  loadMessages();
});

/* ---------- Démarrage ---------- */
async function openEditor() {
  ({ content, photo } = await loadContent());
  fill(content);
  $('#login').hidden = true;
  $('#app').hidden = false;
}

if (!isConfigured) {
  const n = $('#notice');
  n.hidden = false;
  n.textContent = "Mode démo : Firebase n'est pas encore configuré (js/firebase-config.js). Vous pouvez tester l'éditeur et l'aperçu du CV, mais rien n'est enregistré.";
  openEditor();
} else {
  const { auth, authMod } = await getAuth();
  $('#login-btn').addEventListener('click', () => authMod.signInWithPopup(auth, new authMod.GoogleAuthProvider()).catch(e => alert(e.message)));
  $('#logout').addEventListener('click', () => authMod.signOut(auth));
  authMod.onAuthStateChanged(auth, async user => {
    $('#logout').hidden = !user;
    $('#who').textContent = user?.email || '';
    if (user && user.email === ADMIN_EMAIL) {
      await openEditor();
      loadMessages().catch(() => {});
    } else {
      $('#app').hidden = true;
      $('#login').hidden = false;
      if (user) { alert("Ce compte n'est pas autorisé."); authMod.signOut(auth); }
    }
  });
}
