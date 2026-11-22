// Génération du CV en PDF dans le navigateur, à partir du contenu actuel du site.
// Le CV est toujours à jour : photo, expériences, compétences… viennent de l'administration.
// Palette : bleu nuit + ambre. Emojis : police Noto Emoji (monochrome, colorée par le texte).
const NAVY = '#13294b', NAVY_2 = '#1f3d6b', AMBER = '#e0a526', AMBER_SOFT = '#fdf3dc',
  INK = '#1c2533', MUTED = '#6b7380', ON_NAVY = '#e9eef6', ON_NAVY_MUTED = '#a9b8cf';
const SIDE_W = 190, PAGE_W = 595.28, PAGE_H = 841.89;

let pdfP;
function loadPdfMake() {
  pdfP ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = new URL('vendor/pdfmake.min.js', import.meta.url).href;
    s.onload = () => {
      const f = new URL('../assets/fonts/', import.meta.url).href;
      const n = f + 'manrope-latin-400-normal.ttf', b = f + 'manrope-latin-700-normal.ttf', e = f + 'noto-emoji-cv.ttf';
      window.pdfMake.addFonts({
        Manrope: { normal: n, bold: b, italics: n, bolditalics: b },
        Emoji: { normal: e, bold: e, italics: e, bolditalics: e }
      });
      resolve(window.pdfMake);
    };
    s.onerror = () => { pdfP = null; reject(new Error('Impossible de charger le générateur de PDF.')); };
    document.head.append(s);
  });
  return pdfP;
}

/** Photo recadrée en rond avec un anneau ambre (PNG transparent, accepté par pdfmake). */
async function roundPhoto(src) {
  const img = new Image();
  img.src = src;
  await img.decode();
  const size = 360, ring = 14, c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = AMBER;
  g.beginPath(); g.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); g.fill();
  g.save();
  g.beginPath(); g.arc(size / 2, size / 2, size / 2 - ring, 0, Math.PI * 2); g.clip();
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  // Cadrage centré, un peu vers le haut (visage)
  const sx = (img.naturalWidth - side) / 2, sy = Math.max(0, (img.naturalHeight - side) * 0.3);
  g.drawImage(img, sx, sy, side, side, ring, ring, size - 2 * ring, size - 2 * ring);
  g.restore();
  return c.toDataURL('image/png');
}

// L'espace après l'emoji est en Manrope (la police emoji ne contient que les emojis).
const emo = (e, color) => [{ text: e, font: 'Emoji', color }, { text: '  ' }];

/* Titres de la colonne bleue */
const sideTitle = (e, t) => [
  { text: [...emo(e, AMBER), { text: t.toUpperCase(), bold: true, characterSpacing: 1.2 }], color: '#fff', fontSize: 9.5, margin: [0, 16, 0, 4] },
  { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 28, y2: 0, lineWidth: 2, lineColor: AMBER }], margin: [0, 0, 0, 7] }
];

/* Titres de la colonne principale */
const mainTitle = (e, t) => ({
  table: { widths: ['*'], body: [[{ text: [...emo(e, NAVY), { text: t.toUpperCase(), bold: true, characterSpacing: 1.2 }], color: NAVY, fontSize: 11, margin: [8, 4, 0, 4] }]] },
  layout: { hLineWidth: () => 0, vLineWidth: i => (i === 0 ? 3 : 0), vLineColor: () => AMBER, fillColor: () => AMBER_SOFT, paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 },
  margin: [0, 16, 0, 8]
});

const contactLine = (e, t) => t ? { text: [...emo(e, AMBER), { text: t }], fontSize: 8.6, color: ON_NAVY, margin: [0, 0, 0, 5] } : '';

/** Niveau de langue → nombre de points sur 5. */
function levelDots(level) {
  const l = String(level || '').toLowerCase();
  const n = /excellent|courant|maternel|natif/.test(l) ? 5 : /très bien|tres bien/.test(l) ? 4 : /assez/.test(l) ? 3
    : /bien/.test(l) ? 4 : /moyen|passable/.test(l) ? 2 : /notion|débutant|debutant/.test(l) ? 1 : 3;
  return { canvas: [0, 1, 2, 3, 4].map(i => ({ type: 'ellipse', x: 4 + i * 11, y: 4, r1: 3.6, r2: 3.6, color: i < n ? AMBER : NAVY_2 })), width: 56 };
}

function definition(c, photo) {
  const wa = String(c.whatsapp || '').replace(/\D/g, '');
  const side = [
    photo ? { image: photo, width: 118, alignment: 'center', margin: [0, 0, 0, 4] } : '',
    ...sideTitle('📌', 'Contact'),
    contactLine('📍', c.address),
    contactLine('📞', (c.phones || []).join(' / ')),
    contactLine('✉', c.email),
    wa ? contactLine('💬', `WhatsApp +${wa}`) : '',
    ...(c.skills?.length ? [...sideTitle('🛠', 'Compétences'),
      ...c.skills.map(s => ({ text: [{ text: '•  ', color: AMBER, bold: true }, s], fontSize: 8.8, color: ON_NAVY, margin: [0, 0, 0, 3] }))] : []),
    ...(c.languages?.length ? [...sideTitle('🌍', 'Langues'),
      ...c.languages.map(l => ({ columns: [{ text: l.name, bold: true, fontSize: 8.8, color: '#fff', width: '*' }, levelDots(l.level)], margin: [0, 0, 0, 2] }))] : []),
    ...(c.interests?.length ? [...sideTitle('⭐', "Centres d'intérêt"),
      { text: c.interests.join('  •  '), fontSize: 8.6, color: ON_NAVY, lineHeight: 1.3 }] : [])
  ];

  const main = [
    { text: c.name, fontSize: 24, bold: true, color: NAVY, characterSpacing: .3 },
    { canvas: [{ type: 'rect', x: 0, y: 0, w: 60, h: 4, r: 2, color: AMBER }], margin: [0, 6, 0, 6] },
    c.birth ? { text: [...emo('🎂', MUTED), c.birth], color: MUTED, fontSize: 9.5 } : '',
    ...(c.about ? [mainTitle('👤', 'Profil'), { text: c.about, fontSize: 9.5, lineHeight: 1.3, alignment: 'justify' }] : []),
    ...(c.experiences?.length ? [mainTitle('💼', 'Expérience professionnelle'),
      ...c.experiences.map(e => ({
        unbreakable: (e.tasks || []).length < 6,
        margin: [0, 0, 0, 9],
        stack: [
          e.period ? { text: [...emo('📅', AMBER), { text: e.period, bold: true }], fontSize: 8.5, color: NAVY, margin: [0, 0, 0, 1] } : '',
          { text: e.title, bold: true, fontSize: 10, color: INK },
          [e.org, e.place].some(Boolean) ? { text: [...emo('🏢', MUTED), [e.org, e.place].filter(Boolean).join(' — ')], color: MUTED, fontSize: 8.6, italics: true, margin: [0, 2, 0, 3] } : '',
          e.tasks?.length ? { ul: e.tasks, fontSize: 8.9, markerColor: AMBER, lineHeight: 1.15, margin: [4, 0, 0, 0] } : ''
        ].filter(Boolean)
      }))] : [])
  ];

  return {
    pageSize: 'A4',
    pageMargins: [0, 34, 30, 34],
    defaultStyle: { font: 'Manrope', color: INK },
    info: { title: `CV — ${c.name}`, author: c.name },
    // Colonne bleu nuit sur chaque page + fine bande ambre en haut
    background: () => ({ svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_W}" height="${PAGE_H}"><rect width="${SIDE_W}" height="${PAGE_H}" fill="${NAVY}"/><rect x="${SIDE_W}" width="${PAGE_W - SIDE_W}" height="6" fill="${AMBER}"/></svg>` }),
    content: [{
      columns: [
        { width: SIDE_W, stack: side.filter(Boolean), margin: [22, 0, 22, 0] },
        { width: '*', stack: main.filter(Boolean), margin: [26, 0, 0, 0] }
      ]
    }]
  };
}

/** Précharge le générateur PDF (au survol du bouton) pour un téléchargement plus rapide. */
export function preloadPdf() { loadPdfMake().catch(() => {}); }

/** Génère le CV et lance le téléchargement. */
export async function downloadCv(content, photoSrc) {
  const pdfMake = await loadPdfMake();
  let photo = null;
  try { photo = await roundPhoto(photoSrc); } catch { /* CV sans photo */ }
  const file = `CV-${content.name.replace(/\s+/g, '-')}.pdf`;
  await pdfMake.createPdf(definition(content, photo)).download(file);
}

/** Même document, en Blob (pour l'aperçu ou les tests). */
export async function cvBlob(content, photoSrc) {
  const pdfMake = await loadPdfMake();
  let photo = null;
  try { photo = await roundPhoto(photoSrc); } catch { /* sans photo */ }
  return pdfMake.createPdf(definition(content, photo)).getBlob();
}
