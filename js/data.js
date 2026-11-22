// Lecture du contenu du site : Firestore si configuré, sinon contenu par défaut.
// Un cache local (localStorage) permet d'afficher la dernière version connue
// immédiatement, sans attendre le réseau.
import { DEFAULT_CONTENT, withDefaults } from './content.js';
import { isConfigured, getDb, safeImage } from './firebase.js';

export const DEFAULT_PHOTO = 'assets/photo.jpg';
const CACHE_KEY = 'prestalia-content-v1';
const TIMEOUT_MS = 8000;

const defaults = () => ({ content: structuredClone(DEFAULT_CONTENT), photo: DEFAULT_PHOTO });

/** Contenu disponible tout de suite : cache local, sinon contenu par défaut. */
export function cachedContent() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const { content, photo } = JSON.parse(raw);
      return { content: withDefaults(content), photo: safeImage(photo) || DEFAULT_PHOTO };
    }
  } catch { /* cache illisible ou stockage bloqué : on ignore */ }
  return defaults();
}

function saveCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); }
  catch { /* quota dépassé ou navigation privée : pas grave */ }
}

const withTimeout = (p, ms) => Promise.race([
  p, new Promise((_, rej) => setTimeout(() => rej(new Error('Délai dépassé')), ms))
]);

/** Contenu à jour depuis Firestore. Renvoie null si la lecture échoue. */
export async function fetchContent() {
  if (!isConfigured) return defaults();
  try {
    const { db, fs } = await withTimeout(getDb(), TIMEOUT_MS);
    const [c, p] = await withTimeout(Promise.all([
      fs.getDoc(fs.doc(db, 'site', 'content')),
      fs.getDoc(fs.doc(db, 'site', 'photo'))
    ]), TIMEOUT_MS);
    const data = {
      content: withDefaults(c.exists() ? c.data() : null),
      photo: (p.exists() && safeImage(p.data().data)) || DEFAULT_PHOTO
    };
    saveCache(data);
    return data;
  } catch (e) {
    console.warn('Lecture Firebase impossible, dernière version connue affichée.', e);
    return null;
  }
}

/** Version « tout ou rien » utilisée par l'administration. */
export async function loadContent() {
  return (await fetchContent()) ?? cachedContent();
}

/** Échappe le texte avant insertion dans le HTML. */
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
