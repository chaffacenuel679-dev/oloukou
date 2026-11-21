// Chargement de Firebase à la demande (aucun code Firebase n'est chargé si la config est vide).
import { firebaseConfig, ADMIN_EMAIL } from './firebase-config.js';

const CDN = 'https://www.gstatic.com/firebasejs/12.19.0';
export const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
export { ADMIN_EMAIL };

let appP, fsP, authP;
const getApp = () => (appP ??= import(`${CDN}/firebase-app.js`).then(m => m.getApps()[0] || m.initializeApp(firebaseConfig)));

/** { db, fs } — Firestore Lite (léger, suffisant pour lire/écrire des documents). */
export function getDb() {
  if (!isConfigured) return Promise.reject(new Error('Firebase non configuré'));
  return (fsP ??= Promise.all([getApp(), import(`${CDN}/firebase-firestore-lite.js`)])
    .then(([app, fs]) => ({ db: fs.getFirestore(app), fs })));
}

/** { auth, authMod } — utilisé seulement par l'administration. */
export function getAuth() {
  return (authP ??= Promise.all([getApp(), import(`${CDN}/firebase-auth.js`)]).then(([app, authMod]) => {
    const auth = authMod.getAuth(app);
    auth.languageCode = 'fr';
    return { auth, authMod };
  }));
}

/** N'accepte que des images en data URL (évite l'injection de liens). */
export const safeImage = src =>
  typeof src === 'string' && /^data:image\/(webp|jpeg|png);base64,/.test(src) ? src : '';
