# Gbola PSD — site de Laurent OLOUKOU

Site vitrine pour promouvoir les prestations de services de Laurent OLOUKOU
(gestion de stocks, logistique, gestion administrative, suivi de projets, conseil).
HTML / CSS / JavaScript sans framework, relié à **Firebase** pour l'administration.

## Fichiers

```
index.html           Site public : services, à propos, parcours, contact, CV
admin.html           Espace admin : profil, photo, services, parcours, compétences, messages
css/style.css        Styles du site (couleurs claires : bleu, blanc, vert, rouge)
css/admin.css        Styles de l'administration
js/content.js        Contenu par défaut (tiré du CV)
js/data.js           Lecture du contenu (Firebase ou contenu par défaut)
js/main.js           Logique du site public
js/admin.js          Logique de l'administration
js/cv.js             Génération du CV en PDF (pdfmake), toujours à jour
js/firebase*.js      Configuration et chargement de Firebase
firestore.rules      Règles de sécurité
```

## Tester en local

```bash
python3 -m http.server 8000
# puis http://localhost:8000 et http://localhost:8000/admin.html
```

Sans configuration Firebase, le site affiche le contenu par défaut et l'admin
fonctionne en **mode démo** (rien n'est enregistré).

## Mise en ligne (projet Firebase du client)

1. Créer un projet sur https://console.firebase.google.com (au nom du client).
2. Activer **Firestore** et **Authentication → Google**.
3. Ajouter une application Web et coller sa configuration dans `js/firebase-config.js`.
4. Vérifier l'email admin dans `js/firebase-config.js` **et** `firestore.rules`.
5. `firebase deploy --only firestore:rules,hosting`
