// Lecture du contenu du site : Firestore si configuré, sinon contenu par défaut.
import { DEFAULT_CONTENT, withDefaults } from './content.js';
import { isConfigured, getDb, safeImage } from './firebase.js';

export const DEFAULT_PHOTO = 'assets/photo.jpg';

export async function loadContent() {
  if (!isConfigured) return { content: structuredClone(DEFAULT_CONTENT), photo: DEFAULT_PHOTO };
  try {
    const { db, fs } = await getDb();
    const [c, p] = await Promise.all([
      fs.getDoc(fs.doc(db, 'site', 'content')),
      fs.getDoc(fs.doc(db, 'site', 'photo'))
    ]);
    return {
      content: withDefaults(c.exists() ? c.data() : null),
      photo: (p.exists() && safeImage(p.data().data)) || DEFAULT_PHOTO
    };
  } catch (e) {
    console.warn('Lecture Firebase impossible, contenu par défaut affiché.', e);
    return { content: structuredClone(DEFAULT_CONTENT), photo: DEFAULT_PHOTO };
  }
}

/** Échappe le texte avant insertion dans le HTML. */
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
