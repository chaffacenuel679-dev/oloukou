# Gbola PSD — site de Laurent OLOUKOU

Site de **Gbola PSD (Prestation de Services à Distance)** : suivi de chantier, courses administratives,
recherche de partenaires d'affaires, sécurisation foncière…
HTML / CSS / JavaScript sans framework, relié à **Firebase** (Firestore + connexion Google).
En ligne : https://oloukou-laurent-prestation.vercel.app — administration : `/admin`.

## Tout se gère depuis l'administration

| Onglet | Ce qu'on y modifie |
|---|---|
| 👤 Profil & contact | Photo, nom, textes de l'accueil, présentation, téléphones, email, WhatsApp |
| 🤝 Gbola PSD | Présentation de l'offre, « Pour qui ? », étapes, engagements |
| 🧰 Services | Liste des services, bandeau « déplacements » |
| 🧭 Parcours | Expériences, et où chacune s'affiche (site, CV ou les deux) |
| 🛠️ Compétences & langues | Compétences, langues (niveau → étoiles/points), centres d'intérêt |
| 📄 CV | Ligne sous le nom, profil, éléments affichés, aperçu et téléchargement |
| 📬 Messages | Messages du formulaire de contact |

Chaque onglet a un bouton **↺** pour remettre les textes par défaut (`js/content.js`).
Raccourci : **Ctrl + S** pour enregistrer.

## Le CV

Le CV PDF n'est **pas un fichier stocké** : il est fabriqué dans le navigateur (pdfmake) à partir du
contenu enregistré dans Firestore, au moment du téléchargement. Il est donc toujours identique au site.
Son pied de page indique la date du dernier enregistrement.

## Fichiers

```
index.html / admin.html   Site public / administration
css/style.css, admin.css  Styles
js/content.js             Contenu par défaut + normalisation des données
js/data.js                Lecture Firestore + cache local (affichage immédiat)
js/main.js, anim.js       Site public, animations
js/admin.js               Administration
js/cv.js                  Génération du CV (pdfmake, polices Manrope + Noto Emoji)
js/firebase*.js           Configuration et chargement de Firebase
firestore.rules           Règles de sécurité (liste des comptes administrateurs)
```

## Tester en local

```bash
python3 -m http.server 8000          # puis http://localhost:8000
```

Avec les émulateurs Firebase (aucune donnée réelle touchée) :

```bash
npx firebase-tools emulators:start --only auth,firestore --project prestalia-oloukou
# puis http://localhost:8000/?emu et http://localhost:8000/admin.html?emu
```

## Administrateurs

Liste dans `js/firebase-config.js` (`ADMIN_EMAILS`) **et** dans `firestore.rules` (`isAdmin`).
Après modification des règles : les republier dans la console Firebase (Firestore → Règles).
