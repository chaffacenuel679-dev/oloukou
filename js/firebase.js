// Chargement de Firebase à la demande (aucun code Firebase n'est chargé si la config est vide).
import { firebaseConfig, ADMIN_EMAIL, ADMIN_EMAILS } from './firebase-config.js';

const CDN = 'https://www.gstatic.com/firebasejs/12.19.0';
// Tests en local uniquement : http://localhost:8000/?emu relie le site aux émulateurs Firebase.
const EMU = ['localhost', '127.0.0.1'].includes(location.hostname) && new URLSearchParams(location.search).has('emu');
export const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
export { ADMIN_EMAIL, ADMIN_EMAILS };

let appP, fsP, authP;
// En cas d'échec réseau, on oublie la promesse pour pouvoir réessayer plus tard.
const getApp = () => (appP ??= import(`${CDN}/firebase-app.js`)
  .then(m => m.getApps()[0] || m.initializeApp(firebaseConfig))
  .catch(e => { appP = null; throw e; }));

/** { db, fs } — Firestore Lite (léger, suffisant pour lire/écrire des documents). */
export function getDb() {
  if (!isConfigured) return Promise.reject(new Error('Firebase non configuré'));
  return (fsP ??= Promise.all([getApp(), import(`${CDN}/firebase-firestore-lite.js`)])
    .then(([app, fs]) => {
      const db = fs.getFirestore(app);
      if (EMU) fs.connectFirestoreEmulator(db, '127.0.0.1', 8080);
      return { db, fs };
    })
    .catch(e => { fsP = null; throw e; }));
}

/** { auth, authMod } — utilisé seulement par l'administration. */
export function getAuth() {
  return (authP ??= Promise.all([getApp(), import(`${CDN}/firebase-auth.js`)]).then(([app, authMod]) => {
    const auth = authMod.getAuth(app);
    if (EMU) authMod.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    auth.languageCode = 'fr';
    return { auth, authMod };
  }).catch(e => { authP = null; throw e; }));
}

/** N'accepte que des images en data URL (évite l'injection de liens). */
export const safeImage = src =>
  typeof src === 'string' && /^data:image\/(webp|jpeg|png);base64,/.test(src) ? src : '';
