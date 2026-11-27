// Administration : connexion Google, modification de tout le contenu du site, photo, CV, messages.
import { fetchContent, cachedContent, esc } from './data.js';
import { defaultsFor } from './content.js';
import { isConfigured, getDb, getAuth, ADMIN_EMAILS } from './firebase.js';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const form = $('#editor');
let content, photo, newPhoto = null, dirty = false, savedSnap = '';

/* =====================================================================
   Petits outils
   ===================================================================== */
function toast(msg, type = 'info', ms = 4000) {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  $('#toasts').append(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, ms);
}
const lines = v => String(v || '').split('\n').map(s => s.trim()).filter(Boolean);
const setDirty = v => { dirty = v; $('#dirty').hidden = !v; };
// « Non enregistré » = le formulaire diffère vraiment de la dernière version enregistrée.
const snap = () => JSON.stringify({ ...read(), updatedAt: 0 }) + (newPhoto ? '|photo' : '');
const markSaved = () => { savedSnap = snap(); setDirty(false); };
const refreshDirty = () => setDirty(snap() !== savedSnap);
const LEVELS = ['Excellent', 'Très bien', 'Bien', 'Assez bien', 'Moyen', 'Notions'];

/* =====================================================================
   Onglets
   ===================================================================== */
function openTab(name) {
  $$('[data-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
  $$('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== name; });
  $('.savebar').hidden = name === 'messages';
  if (name === 'messages') loadMessages();
  try { sessionStorage.setItem('admin-tab', name); } catch { /* sans importance */ }
}
$$('[data-tab]').forEach(b => b.addEventListener('click', () => openTab(b.dataset.tab)));

/* =====================================================================
   Listes modifiables (services, expériences, langues, étapes…)
   Chaque élément est un bloc repliable : son titre s'affiche dans l'en-tête.
   ===================================================================== */
const TEXT = (k, label, extra = '') => ({ k, label, type: 'input', extra });
const AREA = (k, label, rows = 3) => ({ k, label, type: 'textarea', rows });
const LISTS = {
  services:    { add: 'end', blank: { title: '', text: '' }, fields: [TEXT('title', 'Titre', 'maxlength="100"'), AREA('text', 'Description')] },
  audience:    { add: 'end', blank: { title: '', text: '' }, fields: [TEXT('title', 'Type de client', 'maxlength="100"'), AREA('text', 'Description', 2)] },
  steps:       { add: 'end', blank: { title: '', text: '' }, fields: [TEXT('title', 'Étape', 'maxlength="100"'), AREA('text', 'Explication', 2)] },
  values:      { add: 'end', blank: { title: '', text: '' }, fields: [TEXT('title', 'Engagement', 'maxlength="60"'), AREA('text', 'Explication', 2)] },
  languages:   { add: 'end', blank: { name: '', level: 'Bien' }, inline: true,
                 fields: [TEXT('name', 'Langue', 'maxlength="40"'), { k: 'level', label: 'Niveau', type: 'select', opts: LEVELS }] },
  experiences: { add: 'top', blank: { title: '', org: '', place: '', period: '', tasks: [] },
                 fields: [TEXT('title', 'Poste', 'maxlength="160"'), { row: [TEXT('org', 'Structure'), TEXT('place', 'Ville'), TEXT('period', 'Période', 'placeholder="2015 – 2018"')] },
                          { k: 'tasks', label: 'Tâches (une par ligne)', type: 'lines', rows: 4 },
                          { k: 'show', label: 'Afficher', type: 'select', opts: [['both', 'Sur le site et le CV'], ['cv', 'Seulement sur le CV'], ['site', 'Seulement sur le site']] }] }
};
const titleOf = (key, it) => (key === 'languages' ? [it.name, it.level].filter(Boolean).join(' — ') : it.title) || '(sans titre)';

function fieldHtml(f, it) {
  if (f.row) return `<div class="row2">${f.row.map(x => fieldHtml(x, it)).join('')}</div>`;
  let v = it[f.k];
  if (f.k === 'show') v = it.cvOnly ? 'cv' : it.hideCv ? 'site' : 'both';
  if (f.type === 'textarea') return `<label>${f.label}<textarea data-k="${f.k}" rows="${f.rows}">${esc(v)}</textarea></label>`;
  if (f.type === 'lines') return `<label>${f.label}<textarea data-k="${f.k}" rows="${f.rows}">${esc((v || []).join('\n'))}</textarea></label>`;
  if (f.type === 'select') {
    const opts = f.opts.map(o => (Array.isArray(o) ? o : [o, o]));
    // Niveau saisi librement autrefois : on le garde dans la liste
    if (v && !opts.some(([val]) => val.toLowerCase() === String(v).toLowerCase())) opts.unshift([v, v]);
    return `<label>${f.label}<select data-k="${f.k}">${opts.map(([val, lab]) => `<option value="${esc(val)}" ${String(v).toLowerCase() === val.toLowerCase() ? 'selected' : ''}>${esc(lab)}</option>`).join('')}</select></label>`;
  }
  return `<label>${f.label}<input data-k="${f.k}" value="${esc(v)}" ${f.extra || ''}></label>`;
}

function itemHtml(key, it, open = false) {
  const cfg = LISTS[key];
  const badge = key === 'experiences' && (it.cvOnly || it.hideCv) ? `<em class="tag">${it.cvOnly ? 'CV seulement' : 'site seulement'}</em>` : '';
  return `
    <details class="item${cfg.inline ? ' inline' : ''}" ${open ? 'open' : ''}>
      <summary><span class="item-title">${esc(titleOf(key, it))}</span>${badge}
        <span class="item-tools">
          <button type="button" data-move="-1" title="Monter" aria-label="Monter">↑</button>
          <button type="button" data-move="1" title="Descendre" aria-label="Descendre">↓</button>
          <button type="button" class="del" data-del title="Supprimer" aria-label="Supprimer">🗑️</button>
        </span>
      </summary>
      <div class="item-body">${cfg.fields.map(f => fieldHtml(f, it)).join('')}</div>
    </details>`;
}

const listBox = key => $(`[data-list="${key}"]`);
function renderList(key, list) { listBox(key).innerHTML = (list || []).map(it => itemHtml(key, it)).join(''); }

function readItem(div) {
  const o = {};
  $$('[data-k]', div).forEach(f => {
    if (f.dataset.k === 'tasks') o.tasks = lines(f.value);
    else if (f.dataset.k === 'show') { o.cvOnly = f.value === 'cv'; o.hideCv = f.value === 'site'; }
    else o[f.dataset.k] = f.value.trim();
  });
  return o;
}
// Les éléments sans titre (ou sans nom de langue) sont ignorés à l'enregistrement.
const readList = key => $$(':scope > .item', listBox(key)).map(readItem).filter(o => o.title || o.name);

form.addEventListener('click', ev => {
  const t = ev.target.closest('button');
  if (!t) return;
  const item = t.closest('.item');
  if (t.dataset.add) {
    const key = t.dataset.add, cfg = LISTS[key];
    listBox(key).insertAdjacentHTML(cfg.add === 'top' ? 'afterbegin' : 'beforeend', itemHtml(key, structuredClone(cfg.blank), true));
    const el = cfg.add === 'top' ? listBox(key).firstElementChild : listBox(key).lastElementChild;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    $('input', el)?.focus({ preventScroll: true });
    refreshDirty();
  } else if (item && t.hasAttribute('data-del')) {
    ev.preventDefault();
    if (confirm(`Supprimer « ${$('.item-title', item).textContent} » ?`)) { item.remove(); refreshDirty(); }
  } else if (item && t.dataset.move) {
    ev.preventDefault(); // ne pas replier le bloc
    const sib = t.dataset.move === '-1' ? item.previousElementSibling : item.nextElementSibling;
    if (sib) { t.dataset.move === '-1' ? sib.before(item) : sib.after(item); refreshDirty(); }
  } else if (t.dataset.reset) {
    if (!confirm('Remettre les textes par défaut de cet onglet ? (Rien n\'est perdu tant que vous n\'enregistrez pas.)')) return;
    const def = defaultsFor(t.dataset.reset.split(','));
    fill({ ...read(), ...def }, false);
    refreshDirty();
    toast('↺ Textes par défaut remis. Cliquez sur 💾 Enregistrer pour les publier.');
  }
});

// Le titre d'un bloc suit ce qu'on tape
form.addEventListener('input', ev => {
  refreshDirty();
  const item = ev.target.closest('.item');
  if (item) { const key = item.parentElement.dataset.list; $('.item-title', item).textContent = titleOf(key, readItem(item)); }
});
form.addEventListener('change', ev => {
  // Étiquette « CV seulement / site seulement » d'une expérience
  if (ev.target.dataset.k === 'show') {
    const sum = $('summary', ev.target.closest('.item'));
    $('.tag', sum)?.remove();
    const label = { cv: 'CV seulement', site: 'site seulement' }[ev.target.value];
    if (label) $('.item-title', sum).insertAdjacentHTML('afterend', `<em class="tag">${label}</em>`);
  }
  refreshDirty();
});

/* =====================================================================
   Remplir / lire le formulaire
   ===================================================================== */
const SIMPLE = ['name', 'eyebrow', 'title', 'tagline', 'about', 'birth', 'contactIntro', 'address', 'email', 'whatsapp', 'offer', 'servicesIntro', 'travelTitle', 'travel'];
const field = name => form.elements.namedItem(name);

function fill(c, withPhoto = true) {
  for (const k of SIMPLE) field(k).value = c[k] ?? '';
  field('phones').value = (c.phones || []).join('\n');
  field('skills').value = (c.skills || []).join('\n');
  field('interests').value = (c.interests || []).join('\n');
  for (const key of Object.keys(LISTS)) renderList(key, c[key]);
  const cv = c.cv || {};
  field('cv.headline').value = cv.headline ?? '';
  field('cv.summary').value = cv.summary ?? '';
  for (const k of ['photo', 'services', 'interests']) field(`cv.${k}`).checked = cv[k] !== false;
  if (withPhoto) $('#photo-preview').src = newPhoto || photo;
}

function read() {
  const v = k => field(k).value.trim();
  const out = Object.fromEntries(SIMPLE.map(k => [k, v(k)]));
  out.whatsapp = out.whatsapp.replace(/\D/g, '');
  out.phones = lines(v('phones'));
  out.skills = lines(v('skills'));
  out.interests = lines(v('interests'));
  for (const key of Object.keys(LISTS)) out[key] = readList(key);
  out.cv = {
    headline: v('cv.headline'), summary: v('cv.summary'),
    photo: field('cv.photo').checked, services: field('cv.services').checked, interests: field('cv.interests').checked
  };
  out.updatedAt = content?.updatedAt; // pour la date affichée sur l'aperçu du CV
  return out;
}

/** Contrôles avant enregistrement. Renvoie un message d'erreur ou ''. */
function check(d) {
  if (!d.name) return ['profil', 'Le nom est obligatoire.'];
  if (d.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) return ['profil', "L'adresse email n'est pas valide."];
  if (d.whatsapp && (d.whatsapp.length < 8 || d.whatsapp.length > 15)) return ['profil', 'Le numéro WhatsApp doit contenir entre 8 et 15 chiffres, indicatif compris (ex. 2290197900204).'];
  if (!d.services.length) return ['services', 'Ajoutez au moins un service.'];
  const empty = d.experiences.find(e => !e.period);
  if (empty) return ['parcours', `Indiquez la période de « ${empty.title} ».`];
  return null;
}

/* =====================================================================
   Photo : redimensionnée dans le navigateur (≤ 800 px, JPEG)
   ===================================================================== */
$('#photo-input').addEventListener('change', async ev => {
  const file = ev.target.files[0];
  ev.target.value = '';
  if (!file) return;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    let max = 800, data;
    do { // on réduit jusqu'à ce que la photo pèse moins de ~400 Ko
      const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
      const cv = Object.assign(document.createElement('canvas'), { width: Math.round(bmp.width * scale), height: Math.round(bmp.height * scale) });
      cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
      data = cv.toDataURL('image/jpeg', 0.85);
      max = Math.round(max * 0.8);
    } while (data.length > 550_000 && max > 200);
    bmp.close?.();
    newPhoto = data;
    $('#photo-preview').src = newPhoto;
    refreshDirty();
    toast('📷 Nouvelle photo prête. Cliquez sur 💾 Enregistrer pour la publier.');
  } catch {
    toast("❌ Cette image n'est pas lisible. Utilisez une photo JPG ou PNG (les photos iPhone HEIC ne sont pas acceptées).", 'err', 7000);
  }
});

/* =====================================================================
   Enregistrement
   ===================================================================== */
addEventListener('beforeunload', ev => { if (dirty) { ev.preventDefault(); ev.returnValue = ''; } });
addEventListener('keydown', ev => {
  if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's' && !$('#app').hidden) { ev.preventDefault(); form.requestSubmit(); }
});

form.addEventListener('submit', async ev => {
  ev.preventDefault();
  const btn = $('#save-btn');
  if (btn.disabled) return;
  if (!isConfigured) return toast('⚠️ Mode démo : configurez Firebase pour enregistrer.', 'err');
  const data = read();
  delete data.updatedAt;
  const problem = check(data);
  if (problem) { openTab(problem[0]); return toast('⚠️ ' + problem[1], 'err', 6000); }
  if (JSON.stringify(data).length > 900_000) return toast('❌ Contenu trop volumineux.', 'err');
  if (!navigator.onLine) return toast('📡 Pas de connexion Internet : rien n\'a été enregistré.', 'err');
  btn.disabled = true; btn.textContent = '⏳ Enregistrement…';
  try {
    const { db, fs } = await getDb();
    await fs.setDoc(fs.doc(db, 'site', 'content'), { ...data, updatedAt: fs.serverTimestamp() });
    if (newPhoto) { await fs.setDoc(fs.doc(db, 'site', 'photo'), { data: newPhoto }); photo = newPhoto; newPhoto = null; }
    content = { ...data, updatedAt: new Date().toISOString() };
    try { localStorage.removeItem('gbola-psd-content-v2'); } catch { /* ignore */ }
    markSaved();
    toast('✅ Enregistré ! Le site et le CV sont à jour.', 'ok');
  } catch (e) {
    console.error(e);
    toast(`❌ Échec de l'enregistrement : ${e.code === 'permission-denied' ? "ce compte n'a pas le droit de modifier le site" : (e.code || e.message)}`, 'err', 8000);
  } finally { btn.disabled = false; btn.textContent = '💾 Enregistrer'; }
});

/* =====================================================================
   CV : aperçu et téléchargement (avec les modifications en cours)
   ===================================================================== */
let cvUrl;
$('#cv-refresh').addEventListener('click', async ev => {
  const btn = ev.currentTarget;
  btn.disabled = true; btn.textContent = '⏳ Préparation…';
  try {
    const { cvBlob } = await import('./cv.js');
    const blob = await cvBlob(read(), newPhoto || photo);
    if (cvUrl) URL.revokeObjectURL(cvUrl);
    cvUrl = URL.createObjectURL(blob);
    $('#cv-frame').hidden = false;
    $('#cv-frame iframe').src = cvUrl;
  } catch (e) { console.error(e); toast("❌ L'aperçu du CV a échoué.", 'err'); }
  finally { btn.disabled = false; btn.textContent = "🔄 Actualiser l'aperçu"; }
});
$$('[data-cv-download]').forEach(b => b.addEventListener('click', async () => {
  try { const { downloadCv } = await import('./cv.js'); await downloadCv(read(), newPhoto || photo); }
  catch (e) { console.error(e); toast('❌ Le CV n\'a pas pu être généré.', 'err'); }
}));

/* =====================================================================
   Messages
   ===================================================================== */
const updateBadge = n => { $('#unread').hidden = !n; $('#unread').textContent = n; };
async function loadMessages() {
  const box = $('#messages');
  if (!isConfigured) { box.innerHTML = '<p class="muted">Les messages apparaîtront ici une fois Firebase configuré.</p>'; return; }
  if (!box.children.length) box.innerHTML = '<p class="muted">⏳ Chargement…</p>';
  let list;
  try {
    const { db, fs } = await getDb();
    const snap = await fs.getDocs(fs.query(fs.collection(db, 'messages'), fs.orderBy('createdAt', 'desc')));
    list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error(e);
    box.innerHTML = `<p class="muted">Impossible de charger les messages (${esc(e.code || e.message)}). Vérifiez la connexion puis cliquez sur 🔄 Actualiser.</p>`;
    return;
  }
  updateBadge(list.filter(m => !m.read).length);
  box.innerHTML = list.length ? list.map(m => {
    const date = m.createdAt?.toDate?.().toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) ?? '';
    const reply = `mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent('Re : ' + (m.subject || 'votre demande'))}`;
    return `
    <article class="msg ${m.read ? '' : 'unread'}" data-id="${esc(m.id)}">
      <header><strong>${m.read ? '' : '🆕 '}${esc(m.name)}</strong><span class="muted">${esc(date)}</span></header>
      <p class="msg-subject">🧰 ${esc(m.subject || '—')}</p>
      <p class="msg-text">${esc(m.message)}</p>
      <div class="msg-foot">
        <span><a href="${esc(reply)}">✉️ ${esc(m.email)}</a>${m.phone ? ` · <a href="tel:${esc(String(m.phone).replace(/[^\d+]/g, ''))}">📞 ${esc(m.phone)}</a>` : ''}</span>
        <span class="msg-tools">
          ${m.read ? '' : '<button type="button" data-read>✔ Lu</button>'}
          <button type="button" class="del" data-delmsg>🗑️ Supprimer</button>
        </span>
      </div>
    </article>`;
  }).join('') : '<p class="muted">📭 Aucun message pour le moment.</p>';
}
$('#msg-refresh').addEventListener('click', loadMessages);
$('#messages').addEventListener('click', async ev => {
  const btn = ev.target.closest('button'), art = ev.target.closest('.msg');
  if (!btn || !art) return;
  const isRead = btn.hasAttribute('data-read');
  if (!isRead && !(btn.hasAttribute('data-delmsg') && confirm('Supprimer définitivement ce message ?'))) return;
  btn.disabled = true;
  try {
    const { db, fs } = await getDb();
    const ref = fs.doc(db, 'messages', art.dataset.id);
    if (isRead) await fs.updateDoc(ref, { read: true }); else await fs.deleteDoc(ref);
    await loadMessages();
  } catch (e) { console.error(e); btn.disabled = false; toast(`❌ Action impossible : ${e.code || e.message}`, 'err'); }
});

/* =====================================================================
   Démarrage
   ===================================================================== */
let opened = false;
async function openEditor() {
  if (opened) return; // évite d'écraser des modifications en cours
  opened = true;
  $('#login').hidden = true;
  $('#app').hidden = false;
  let tab = 'profil';
  try { tab = sessionStorage.getItem('admin-tab') || tab; } catch { /* ignore */ }
  openTab($(`[data-tab="${tab}"]`) ? tab : 'profil');
  const fresh = await fetchContent();
  if (!fresh && isConfigured) showNotice("⚠️ Lecture du contenu en ligne impossible : la dernière version connue est affichée. Vérifiez la connexion avant d'enregistrer.");
  ({ content, photo } = fresh ?? cachedContent());
  fill(content);
  markSaved();
}

function showNotice(text) { const n = $('#notice'); n.hidden = false; n.textContent = text; }
const isAdmin = email => ADMIN_EMAILS.some(a => a.toLowerCase() === String(email || '').toLowerCase());

if (!isConfigured) {
  showNotice("Mode démo : Firebase n'est pas configuré (js/firebase-config.js). Vous pouvez tester l'éditeur et le CV, mais rien n'est enregistré.");
  openEditor();
} else {
  $('#login').hidden = false;
  try {
    const { auth, authMod } = await getAuth();
    const provider = new authMod.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    authMod.getRedirectResult(auth).catch(e => console.warn(e)); // retour d'une connexion par redirection
    $('#login-btn').addEventListener('click', async () => {
      try { await authMod.signInWithPopup(auth, provider); }
      catch (e) {
        if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(e.code)) return authMod.signInWithRedirect(auth, provider);
        if (['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(e.code)) return;
        const msg = {
          'auth/unauthorized-domain': "Ce domaine n'est pas autorisé dans Firebase (Authentication → Paramètres → Domaines autorisés).",
          'auth/network-request-failed': 'Pas de connexion Internet.',
          'auth/operation-not-allowed': "La connexion Google n'est pas activée dans Firebase (Authentication → Sign-in method)."
        }[e.code] || e.message;
        toast('❌ ' + msg, 'err', 8000);
      }
    });
    $('#logout').addEventListener('click', async () => {
      if (dirty && !confirm('Des modifications ne sont pas enregistrées. Se déconnecter quand même ?')) return;
      dirty = false;
      await authMod.signOut(auth);
      location.reload();
    });
    authMod.onAuthStateChanged(auth, async user => {
      $('#logout').hidden = !user;
      $('#who').textContent = user?.email || '';
      if (user && isAdmin(user.email)) {
        await openEditor();
        loadMessages();
      } else {
        $('#app').hidden = true;
        $('#login').hidden = false;
        if (user) { toast(`⛔ Le compte ${user.email} n'est pas autorisé.`, 'err', 8000); authMod.signOut(auth); }
      }
    });
  } catch (e) {
    console.error(e);
    showNotice('⚠️ Impossible de charger la connexion Firebase. Vérifiez votre connexion Internet puis rechargez la page.');
  }
}
