// Administration : connexion Google, modification du contenu, photo, messages.
import { fetchContent, cachedContent, esc } from './data.js';
import { isConfigured, getDb, getAuth, ADMIN_EMAIL } from './firebase.js';

const $ = s => document.querySelector(s);
const form = $('#editor');
let content, photo, newPhoto = null, dirty = false;

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
    <label>Tâches (une par ligne)<textarea data-k="tasks" rows="4">${esc((e.tasks || []).join('\n'))}</textarea></label>
    <label class="check"><input type="checkbox" data-k="cvOnly" ${e.cvOnly ? 'checked' : ''}> Afficher seulement dans le CV (masqué sur le site)</label>`
};

function renderList(key, list) {
  $(`#${key}-ed`).innerHTML = list.map(item => `
    <div class="item">
      <div class="item-tools">
        <button type="button" data-move="-1" title="Monter">↑</button>
        <button type="button" data-move="1" title="Descendre">↓</button>
        <button type="button" class="del" data-del>🗑️ Supprimer</button>
      </div>
      ${TEMPLATES[key](item)}
    </div>`).join('');
}

function readList(key) {
  return [...$(`#${key}-ed`).children].map(div => {
    const o = {};
    div.querySelectorAll('[data-k]').forEach(f => { o[f.dataset.k] = f.type === 'checkbox' ? f.checked : f.dataset.k === 'tasks' ? lines(f.value) : f.value.trim(); });
    return o;
  }).filter(o => o.title);
}

form.addEventListener('click', ev => {
  const item = ev.target.closest('.item');
  if (ev.target.dataset.add || ev.target.dataset.move || ev.target.hasAttribute('data-del')) dirty = true;
  if (ev.target.dataset.add) {
    const key = ev.target.dataset.add;
    // Une nouvelle expérience est la plus récente : elle va en haut. Un service va à la fin.
    const blank = key === 'services' ? { title: '', text: '' } : { title: '', org: '', place: '', period: '', tasks: [] };
    const top = key === 'experiences';
    renderList(key, top ? [blank, ...readListRaw(key)] : [...readListRaw(key), blank]);
    const el = top ? $(`#${key}-ed`).firstElementChild : $(`#${key}-ed`).lastElementChild;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.querySelector('input').focus({ preventScroll: true });
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
  div.querySelectorAll('[data-k]').forEach(f => { o[f.dataset.k] = f.type === 'checkbox' ? f.checked : f.dataset.k === 'tasks' ? lines(f.value) : f.value; });
  return o;
});

const lines = v => v.split('\n').map(s => s.trim()).filter(Boolean);

/* ---------- Remplir / lire le formulaire ---------- */
function fill(c) {
  for (const k of ['name', 'title', 'tagline', 'travel', 'birth', 'about', 'address', 'email', 'whatsapp', 'offer', 'modalities']) form.elements[k].value = c[k] || '';
  form.elements.phones.value = c.phones.join('\n');
  form.elements.audience.value = (c.audience || []).map(a => `${a.title} — ${a.text}`).join('\n');
  form.elements.engagements.value = (c.values || []).map(a => `${a.title} — ${a.text}`).join('\n');
  form.elements.skills.value = c.skills.join('\n');
  form.elements.interests.value = c.interests.join('\n');
  form.elements.languages.value = c.languages.map(l => `${l.name} — ${l.level}`).join('\n');
  renderList('services', c.services);
  renderList('experiences', c.experiences);
  $('#photo-preview').src = photo;
}

// « Titre — description » → { title, text }
const pairs = txt => lines(txt).map(l => {
  const [title, ...rest] = l.split(/\s+[—–-]\s+/);
  return { title: title.trim(), text: rest.join(' — ').trim() };
});

function read() {
  const v = k => form.elements[k].value.trim();
  return {
    name: v('name'), title: v('title'), tagline: v('tagline'), travel: v('travel'), birth: v('birth'), about: v('about'),
    address: v('address'), email: v('email'), whatsapp: v('whatsapp').replace(/\D/g, ''),
    phones: lines(v('phones')),
    skills: lines(v('skills')),
    interests: lines(v('interests')),
    languages: lines(v('languages')).map(l => {
      const [name, ...rest] = l.split(/\s+[—–-]\s+/);
      return { name: name.trim(), level: rest.join(' — ').trim() };
    }),
    offer: v('offer'), modalities: v('modalities'),
    audience: pairs(v('audience')),
    values: pairs(v('engagements')),
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
    status('📷 Nouvelle photo prête : cliquez sur « 💾 Enregistrer ».');
  } catch { alert("Ce fichier n'est pas une image lisible."); }
});

/* ---------- Enregistrement ---------- */
function status(msg, cls = '') { const s = $('#save-status'); s.textContent = msg; s.className = cls; }

// Avertit si on quitte la page avec des modifications non enregistrées
form.addEventListener('input', () => { dirty = true; });
addEventListener('beforeunload', ev => { if (dirty || newPhoto) { ev.preventDefault(); ev.returnValue = ''; } });

form.addEventListener('submit', async ev => {
  ev.preventDefault();
  if (!isConfigured) return status('⚠️ Mode démo : configurez Firebase pour enregistrer.', 'err');
  const data = read();
  if (!data.name) return status('⚠️ Le nom est obligatoire.', 'err');
  const btn = form.querySelector('[type=submit]');
  if (btn.disabled) return;
  btn.disabled = true;
  status('⏳ Enregistrement…');
  try {
    const { db, fs } = await getDb();
    await fs.setDoc(fs.doc(db, 'site', 'content'), { ...data, updatedAt: fs.serverTimestamp() });
    if (newPhoto) { await fs.setDoc(fs.doc(db, 'site', 'photo'), { data: newPhoto }); photo = newPhoto; newPhoto = null; }
    content = data; dirty = false;
    status('✅ Modifications enregistrées : elles sont visibles sur le site et dans le CV.', 'ok');
  } catch (e) { console.error(e); status(`❌ Échec : ${e.code === 'permission-denied' ? "ce compte n'a pas le droit d'enregistrer" : e.message}`, 'err'); }
  finally { btn.disabled = false; }
});

$('#cv-preview').addEventListener('click', async () => {
  try { const { downloadCv } = await import('./cv.js'); await downloadCv(read(), newPhoto || photo); } catch (e) { alert(e.message); }
});

/* ---------- Messages ---------- */
async function loadMessages() {
  const box = $('#messages');
  if (!isConfigured) { box.innerHTML = '<p class="muted">Les messages apparaîtront ici une fois Firebase configuré.</p>'; return; }
  box.textContent = '⏳ Chargement…';
  let snap;
  try {
    const { db, fs } = await getDb();
    snap = await fs.getDocs(fs.query(fs.collection(db, 'messages'), fs.orderBy('createdAt', 'desc')));
  } catch (e) {
    console.error(e);
    box.innerHTML = `<p class="muted">Impossible de charger les messages (${esc(e.code || e.message)}). Vérifiez la connexion puis rouvrez l'onglet.</p>`;
    return;
  }
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  updateBadge(list.filter(m => !m.read).length);
  box.innerHTML = list.length ? list.map(m => `
    <article class="msg ${m.read ? '' : 'unread'}" data-id="${esc(m.id)}">
      <header><strong>${esc(m.name)} — ${esc(m.subject)}</strong><span class="muted">${m.createdAt?.toDate?.().toLocaleString('fr-FR') ?? ''}</span></header>
      <div><a href="mailto:${esc(m.email)}">${esc(m.email)}</a>${m.phone ? ` · <a href="tel:${esc(m.phone)}">${esc(m.phone)}</a>` : ''}</div>
      <p>${esc(m.message)}</p>
      <div class="item-tools">
        ${m.read ? '' : '<button type="button" data-read>✔ Marquer comme lu</button>'}
        <button type="button" class="del" data-delmsg>🗑️ Supprimer</button>
      </div>
    </article>`).join('') : '<p class="muted">📭 Aucun message pour le moment.</p>';
}
const updateBadge = n => { $('#unread').hidden = !n; $('#unread').textContent = n; };

$('#messages').addEventListener('click', async ev => {
  const art = ev.target.closest('.msg');
  if (!art) return;
  const isRead = ev.target.hasAttribute('data-read');
  if (!isRead && !(ev.target.hasAttribute('data-delmsg') && confirm('Supprimer ce message ?'))) return;
  ev.target.disabled = true;
  try {
    const { db, fs } = await getDb();
    const ref = fs.doc(db, 'messages', art.dataset.id);
    if (isRead) await fs.updateDoc(ref, { read: true }); else await fs.deleteDoc(ref);
    loadMessages();
  } catch (e) { console.error(e); ev.target.disabled = false; alert(`Action impossible : ${e.code || e.message}`); }
});

/* ---------- Démarrage ---------- */
let opened = false;
async function openEditor() {
  if (opened) return; // évite d'écraser des modifications en cours
  opened = true;
  $('#login').hidden = true;
  $('#app').hidden = false;
  const fresh = await fetchContent();
  if (!fresh && isConfigured) {
    showNotice("Lecture du contenu en ligne impossible : la dernière version connue est affichée. Vérifiez la connexion avant d'enregistrer.");
  }
  ({ content, photo } = fresh ?? cachedContent());
  fill(content);
}

function showNotice(text) { const n = $('#notice'); n.hidden = false; n.textContent = text; }
const sameEmail = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase();

if (!isConfigured) {
  showNotice("Mode démo : Firebase n'est pas encore configuré (js/firebase-config.js). Vous pouvez tester l'éditeur et l'aperçu du CV, mais rien n'est enregistré.");
  openEditor();
} else {
  $('#login').hidden = false;
  try {
    const { auth, authMod } = await getAuth();
    const provider = new authMod.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    // Revient d'une connexion par redirection (mobile / fenêtre bloquée)
    authMod.getRedirectResult(auth).catch(e => console.warn(e));
    $('#login-btn').addEventListener('click', async () => {
      try { await authMod.signInWithPopup(auth, provider); }
      catch (e) {
        if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(e.code)) return authMod.signInWithRedirect(auth, provider);
        if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return;
        if (e.code === 'auth/unauthorized-domain') return alert("Ce domaine n'est pas autorisé dans Firebase (Authentication → Paramètres → Domaines autorisés).");
        if (e.code === 'auth/network-request-failed') return alert('Pas de connexion Internet.');
        alert(e.message);
      }
    });
    $('#logout').addEventListener('click', () => authMod.signOut(auth).then(() => location.reload()));
    authMod.onAuthStateChanged(auth, async user => {
      $('#logout').hidden = !user;
      $('#who').textContent = user?.email || '';
      if (user && sameEmail(user.email, ADMIN_EMAIL)) {
        await openEditor();
        loadMessages();
      } else {
        $('#app').hidden = true;
        $('#login').hidden = false;
        if (user) { alert("⛔ Ce compte n'est pas autorisé. Connectez-vous avec " + ADMIN_EMAIL + '.'); authMod.signOut(auth); }
      }
    });
  } catch (e) {
    console.error(e);
    showNotice('Impossible de charger la connexion Firebase. Vérifiez votre connexion Internet puis rechargez la page.');
  }
}
