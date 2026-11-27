// Contenu par défaut du site, tiré du CV de Laurent OLOUKOU.
// Il s'affiche tant que rien n'a été enregistré depuis la page d'administration.
// Dès qu'il enregistre, c'est la version stockée dans Firebase qui est utilisée.

export const BRAND = 'Gbola PSD';

export const DEFAULT_CONTENT = {
  name: 'Laurent OLOUKOU',
  eyebrow: 'Gbola PSD · Prestation de Services à Distance',
  title: "Je m'occupe de vos affaires sur place, quand vous ne pouvez pas être là.",
  tagline: 'Un prestataire de services, de près comme de loin.',
  about:
    "De nationalité béninoise et originaire de Savè, j'ai travaillé de 1994 à 2018 avec le PAM " +
    "(Programme Alimentaire Mondial) à Lokossa et à Cotonou : gestion de stocks, logistique, " +
    "coordination de projets, suivi-évaluation, statistiques et mobilisation de ressources. " +
    "Aujourd'hui, je mets cette expérience et mon réseau à votre service à travers Gbola PSD.",
  offer:
    "Vous manquez de temps ou vous vivez loin ? Gbola PSD (Prestation de Services à Distance) " +
    "assure à votre place le suivi de vos réalisations et de vos démarches, et vous tient informé à chaque étape.",
  audience: [
    { title: 'Administratifs et personnes très occupées', text: "Votre emploi du temps ne vous laisse pas le temps de vous déplacer ni de suivre vos dossiers." },
    { title: "Personnes vivant à l'extérieur", text: "Vous êtes hors du Bénin ou loin de Lokossa et vous avez besoin de quelqu'un de confiance sur place." },
    { title: 'Entreprises et porteurs de projets', text: "Vous cherchez un relais local pour vos chantiers, vos démarches ou vos partenariats." }
  ],
  values: [
    { title: 'Confiance', text: 'Vos affaires sont suivies comme si c\'étaient les miennes.' },
    { title: 'Honnêteté', text: 'Des comptes rendus clairs et transparents, sans surprise.' },
    { title: 'Discrétion', text: 'Vos informations et vos projets restent confidentiels.' },
    { title: 'Rapidité', text: 'Des démarches menées sans perte de temps.' }
  ],
  steps: [
    { title: 'Vous expliquez votre besoin', text: 'Par WhatsApp, téléphone, email ou le formulaire.' },
    { title: 'Nous convenons des modalités', text: 'Les modalités (tarif, délais, fréquence des comptes rendus) sont étudiées avec vous, selon chaque situation.' },
    { title: "J'agis sur place, vous êtes informé", text: "Vous suivez l'avancement à distance, en toute sérénité." }
  ],
  servicesIntro: "Liste non limitative : si votre besoin n'y figure pas, parlez-m'en.",
  travelTitle: 'Mobile pour vos missions',
  contactIntro: 'Où que vous soyez, décrivez votre besoin : je vous réponds rapidement.',
  // Réglages du CV (onglet « CV » de l'administration)
  cv: {
    headline: 'Fondateur de Gbola PSD — Prestation de Services à Distance',
    summary: '',          // vide = reprend la présentation du site
    photo: true,
    services: true,
    interests: true
  },
  travel: 'Je me déplace pour réaliser mes prestations : partout au Bénin et au-delà, selon vos besoins.',
  birth: 'Né vers 1967 à Savè (Département des Collines)',
  address: 'Agnivèdji, Lokossa, Bénin',
  phones: ['0197900204', '0195235215', '0148928307'],
  email: 'oloukoulau@gmail.com',
  whatsapp: '2290197900204',
  services: [
    { title: 'Suivi de chantier', text: "Visites régulières, contrôle de l'avancement et de la qualité des travaux, comptes rendus et photos pour le propriétaire." },
    { title: 'Courses administratives', text: "Dépôt et retrait de dossiers, suivi des démarches auprès des administrations, mairies et services publics." },
    { title: "Recherche de partenaires d'affaires", text: "Identification et mise en relation avec des partenaires, fournisseurs ou investisseurs fiables." },
    { title: 'Sécurisation foncière', text: "Contribution à la sécurisation de terrains et de biens bâtis ou non bâtis : vérifications, démarches et suivi." },
    { title: 'Gestion de stocks et logistique', text: "Réception, stockage, répartition et suivi des marchandises et du matériel." },
    { title: 'Suivi et évaluation de projets', text: "Suivi de l'exécution de vos projets, mesure des résultats et rapports réguliers." }
  ],
  experiences: [
    { title: "Gestionnaire d'un établissement de commerce général", org: 'Ets GBOLA & Fils', place: 'Lokossa', period: "2012 – Aujourd'hui", tasks: [], cvOnly: true },
    { title: "Chef Matériel de l'Office de Gestion des aides du PAM", org: 'OGP-PAM', place: 'Cotonou', period: '2016 – 2018', tasks: ['Gestion du matériel et des fournitures sur le plan national', "Gestion du patrimoine de l'office"] },
    { title: "Délégué du personnel au sein du Conseil d'Administration de l'office", org: 'OGP-PAM', place: 'Cotonou', period: '2015 – 2018', tasks: ["La défense des intérêts du personnel devant le Conseil d'Administration", "La défense de la gestion optimale des ressources de l'Office"] },
    { title: "Assistant à la Direction des Etudes, de la Mobilisation et de l'Assistance", org: 'OGP-PAM', place: 'Cotonou', period: '2015', tasks: ["Assistance aux travaux d'études, à la rédaction des thématiques de mobilisation de ressources et de recherche de partenaires à l'assistance", "Assistance à la recherche et à la mobilisation des ressources pour l'identification des cibles victimes de catastrophes naturelles"] },
    { title: 'Assistant du Chef Service logistique', org: 'Direction Nationale-PAM', place: 'Cotonou', period: '2011 – 2014', tasks: ['Assistance à la gestion des meubles et immeubles de la Direction Nationale du PAM', 'Assistance à la gestion du matériel, des stocks des vivres et des non-vivres, et des matériels roulants', "Assistance pour la réception et la répartition des vivres depuis le port jusqu'aux entrepôts", "Assistance pour la sécurisation et l'entretien phytosanitaire des vivres"] },
    { title: 'Assistant du Chef Service Informatique', org: 'Direction Nationale-PAM', place: 'Cotonou', period: '2008 – 2010', tasks: ['Création des données relatives aux projets du PAM', "Elaboration des statistiques au cours de l'exécution des projets du PAM", 'Confinement et protection des données des projets du PAM', 'Exploitation des données disponibles pour de nouveaux projets'] },
    { title: 'Chef Service de la Coopération et du Financement du Développement et Chef Cellule', org: 'PAM', place: 'Lokossa', period: '2005 – 2007', tasks: ['Collecte des données pour assistance aux groupes vulnérables', 'La mise en œuvre des politiques de développement', "Le suivi et l'évaluation des projets au niveau du département du Mono-Couffo", 'La coordination des activités du PAM dans le département du Mono-Couffo', "Animation du partenariat avec la Direction Départementale de l'Education dans le Mono-Couffo", "Mesure d'impact de l'assistance du PAM sur l'Education, les centres de formations et des orphelinats dans le département du Mono-Couffo"] },
    { title: 'Magasinier', org: 'PAM', place: 'Lokossa', period: '1994 – 2005', tasks: ['Gestion de stocks de vivres et de non-vivres', "Suivi de l'entretien des stocks des vivres dans les écoles à cantine"] }
  ],
  skills: ['Maîtrise de langue', 'Gestion Administrative', 'Informatique', 'Marketing', 'Entreprenariat', 'Animation de la vie associative', 'Conception de projets'],
  languages: [
    { name: 'Français', level: 'Excellent' },
    { name: 'Anglais', level: 'Bien' },
    { name: 'Nago', level: 'Excellent' },
    { name: 'Fon', level: 'Assez Bien' },
    { name: 'Guon', level: 'Assez Bien' }
  ],
  interests: ['Agriculture', 'Commerce général', 'Vie associative', 'Voyages']
};

const LIST_KEYS = ['phones', 'services', 'experiences', 'skills', 'languages', 'interests', 'audience', 'values', 'steps'];

/**
 * Complète un contenu enregistré avec les valeurs par défaut manquantes
 * et corrige les types (une liste reste une liste, un texte reste un texte),
 * pour qu'une donnée abîmée ne casse jamais l'affichage.
 */
export function withDefaults(saved) {
  const out = structuredClone(DEFAULT_CONTENT);
  if (!saved || typeof saved !== 'object') return out;
  for (const k of Object.keys(DEFAULT_CONTENT)) {
    const v = saved[k];
    if (v === undefined || v === null) continue;
    if (LIST_KEYS.includes(k)) { if (Array.isArray(v)) out[k] = v.filter(x => x !== null && x !== undefined); }
    else if (k === 'cv') { if (typeof v === 'object') out.cv = { ...out.cv, ...v }; }
    else out[k] = String(v);
  }
  // Ancien champ « modalités » (avant les étapes modifiables) : il devient le texte de l'étape 2.
  if (typeof saved.modalities === 'string' && saved.modalities && !Array.isArray(saved.steps) && out.steps[1]) out.steps[1].text = saved.modalities;
  if (typeof saved.updatedAt === 'string') out.updatedAt = saved.updatedAt;
  return out;
}

/** Contenu par défaut d'une liste de clés (bouton « Rétablir » de l'administration). */
export const defaultsFor = keys => Object.fromEntries(keys.map(k => [k, structuredClone(DEFAULT_CONTENT[k])]));
