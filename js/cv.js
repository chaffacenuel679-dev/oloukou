// Génération du CV en PDF dans le navigateur, à partir du contenu actuel du site.
// Le CV est donc toujours à jour : il suffit de modifier le contenu dans l'administration.
const BLUE = '#1d4f91', GREEN = '#2e8b57', INK = '#1c2533', MUTED = '#5b6672', SIDE_BG = '#e8f0f8';

let pdfP;
function loadPdfMake() {
  pdfP ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = new URL('vendor/pdfmake.min.js', import.meta.url).href;
    s.onload = () => {
      const f = new URL('../assets/fonts/', import.meta.url).href;
      const n = f + 'manrope-latin-400-normal.ttf', b = f + 'manrope-latin-700-normal.ttf';
      window.pdfMake.addFonts({ Manrope: { normal: n, bold: b, italics: n, bolditalics: b } });
      resolve(window.pdfMake);
    };
    s.onerror = () => { pdfP = null; reject(new Error('Impossible de charger le générateur de PDF.')); };
    document.head.append(s);
  });
  return pdfP;
}

/** Convertit la photo en JPEG (format accepté par pdfmake). */
async function toJpeg(src) {
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  c.getContext('2d').drawImage(img, 0, 0);
  return c.toDataURL('image/jpeg', 0.9);
}

const sideTitle = t => [
  { text: t.toUpperCase(), bold: true, color: BLUE, fontSize: 10, margin: [0, 14, 0, 2] },
  { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 140, y2: 0, lineWidth: 1, lineColor: BLUE }], margin: [0, 0, 0, 6] }
];
const mainTitle = t => [
  { text: t.toUpperCase(), bold: true, color: BLUE, fontSize: 11, margin: [0, 14, 0, 2] },
  { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 345, y2: 0, lineWidth: 1, lineColor: BLUE }], margin: [0, 0, 0, 6] }
];

function definition(c, photo) {
  const side = [
    photo ? { image: photo, width: 100, alignment: 'center', margin: [0, 0, 0, 6] } : '',
    ...sideTitle('Contact'),
    { text: c.address, fontSize: 9, margin: [0, 0, 0, 3] },
    { text: (c.phones || []).join(' / '), fontSize: 9, margin: [0, 0, 0, 3] },
    { text: c.email, fontSize: 9 },
    ...sideTitle('Compétences'),
    { ul: c.skills || [], fontSize: 9, markerColor: GREEN },
    ...sideTitle('Langues'),
    ...(c.languages || []).map(l => ({ text: [{ text: l.name, bold: true }, ` — ${l.level}`], fontSize: 9, margin: [0, 0, 0, 2] })),
    ...sideTitle("Centres d'intérêt"),
    { ul: c.interests || [], fontSize: 9, markerColor: GREEN }
  ];
  const main = [
    { text: c.name, fontSize: 22, bold: true, color: BLUE },
    { text: c.birth, color: MUTED, fontSize: 10, margin: [0, 2, 0, 0] },
    { text: c.title, color: GREEN, bold: true, fontSize: 10.5, margin: [0, 6, 0, 0] },
    ...mainTitle('Profil'),
    { text: c.about, fontSize: 9.5, lineHeight: 1.25 },
    ...mainTitle('Expérience professionnelle'),
    ...(c.experiences || []).flatMap(e => [
      { text: e.title, bold: true, fontSize: 10, margin: [0, 6, 0, 1] },
      { text: [e.org, e.place].filter(Boolean).join(' — ') + (e.period ? `  |  ${e.period}` : ''), color: MUTED, fontSize: 8.5, italics: true, margin: [0, 0, 0, 2] },
      e.tasks?.length ? { ul: e.tasks, fontSize: 9, markerColor: GREEN } : ''
    ]),
    ...(c.services?.length ? [...mainTitle('Services proposés'), { ul: c.services.map(s => s.title), fontSize: 9, markerColor: GREEN }] : [])
  ];
  return {
    pageSize: 'A4',
    pageMargins: [0, 0, 30, 30],
    defaultStyle: { font: 'Manrope', color: INK },
    info: { title: `CV — ${c.name}` },
    // Bande latérale colorée sur chaque page (SVG : le « canvas » ne marche pas en arrière-plan avec cette version).
    background: () => ({ svg: `<svg xmlns="http://www.w3.org/2000/svg" width="185" height="842"><rect width="185" height="842" fill="${SIDE_BG}"/></svg>` }),
    content: [{
      columns: [
        { width: 185, stack: side, margin: [20, 30, 20, 0] },
        { width: '*', stack: main, margin: [22, 30, 0, 0] }
      ]
    }]
  };
}

/** Génère le CV et lance le téléchargement. */
export async function downloadCv(content, photoSrc) {
  const pdfMake = await loadPdfMake();
  let photo = null;
  try { photo = await toJpeg(photoSrc); } catch { /* CV sans photo */ }
  const file = `CV-${content.name.replace(/\s+/g, '-')}.pdf`;
  await pdfMake.createPdf(definition(content, photo)).download(file);
}
