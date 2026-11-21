// =====================================================================
//  CONFIGURATION FIREBASE (projet Firebase du client, PAS celui de Cénuel)
//  1. Console Firebase → ⚙️ Paramètres du projet → « Vos applications »
//  2. Ajoute une application Web (</>) puis copie l'objet firebaseConfig ici.
//  Ces valeurs ne sont pas secrètes : la sécurité vient de firestore.rules.
//  Tant que apiKey est vide, le site affiche le contenu par défaut (js/content.js).
// =====================================================================

export const firebaseConfig = {
  apiKey: "AIzaSyAtyuiAYeuPNKDDIC8wPI2N3rt2v_vpDkQ",
  authDomain: "prestalia-oloukou.firebaseapp.com",
  projectId: "prestalia-oloukou",
  storageBucket: "prestalia-oloukou.firebasestorage.app",
  messagingSenderId: "83386685980",
  appId: "1:83386685980:web:9aac8e40873c90b24b9dd9"
};

// Seul ce compte Google peut se connecter à /admin.html.
// ⚠️ Doit être identique à l'email écrit dans firestore.rules.
export const ADMIN_EMAIL = "oloukoulau@gmail.com";
