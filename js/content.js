// Contenu par défaut du site, tiré du CV de Laurent OLOUKOU.
// Il s'affiche tant que rien n'a été enregistré depuis la page d'administration.
// Dès qu'il enregistre, c'est la version stockée dans Firebase qui est utilisée.

export const BRAND = 'Prestalia';

export const DEFAULT_CONTENT = {
  name: 'Laurent OLOUKOU',
  title: 'Prestataire de services en gestion, logistique et suivi de projets',
  tagline: 'Un prestataire de services, de près comme de loin.',
  about:
    "De nationalité béninoise et originaire de Savè, j'ai travaillé de 1994 à 2018 avec le PAM " +
    "(Programme Alimentaire Mondial) à Lokossa et à Cotonou : gestion de stocks, logistique, " +
    "coordination de projets, suivi-évaluation, statistiques et mobilisation de ressources. " +
    "Aujourd'hui, je mets cette expérience à votre service à travers Prestalia.",
  birth: 'Né vers 1967 à Savè (Département des Collines)',
  address: 'Agnivèdji, Lokossa, Bénin',
  phones: ['0197900204', '0195235215', '0148928307'],
  email: 'oloukoulau@gmail.com',
  whatsapp: '2290197900204',
  services: [
    { title: 'Gestion de stocks et logistique', text: "Réception, stockage, répartition et suivi des marchandises, des vivres et du matériel, du port jusqu'aux entrepôts." },
    { title: 'Gestion administrative et du patrimoine', text: 'Gestion des biens meubles et immeubles, du matériel et des fournitures, inventaires et organisation administrative.' },
    { title: 'Conception et suivi-évaluation de projets', text: "Montage de projets, suivi de l'exécution, mesure d'impact et rapports pour les structures et les associations." },
    { title: 'Collecte et analyse de données', text: 'Enquêtes, collecte de données terrain, statistiques et exploitation des informations pour la décision.' },
    { title: 'Mobilisation de ressources et partenariats', text: 'Recherche de partenaires, rédaction de dossiers de mobilisation de ressources, animation de partenariats.' },
    { title: 'Conseil en commerce général', text: "Accompagnement des commerçants : organisation de la boutique, approvisionnement, gestion des stocks et de la caisse." }
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

/** Complète un contenu enregistré avec les valeurs par défaut manquantes. */
export function withDefaults(saved) {
  const out = { ...DEFAULT_CONTENT };
  if (saved && typeof saved === 'object') {
    for (const k of Object.keys(DEFAULT_CONTENT)) {
      if (saved[k] !== undefined && saved[k] !== null) out[k] = saved[k];
    }
  }
  return out;
}
