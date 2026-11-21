// =====================================================================
//  CONFIGURATION FIREBASE (projet Firebase du client, PAS celui de Cénuel)
//  1. Console Firebase → ⚙️ Paramètres du projet → « Vos applications »
//  2. Ajoute une application Web (</>) puis copie l'objet firebaseConfig ici.
//  Ces valeurs ne sont pas secrètes : la sécurité vient de firestore.rules.
//  Tant que apiKey est vide, le site affiche le contenu par défaut (js/content.js).
// =====================================================================

export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// Seul ce compte Google peut se connecter à /admin.html.
// ⚠️ Doit être identique à l'email écrit dans firestore.rules.
export const ADMIN_EMAIL = "oloukoulau@gmail.com";
