/* ===== CANVAS: CÉU ESTRELADO COM PARALAXE E ESTRELAS CADENTES ===== */
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let w, h, estrelas = [], cometas = [], corposCelestes = [];
let mouseX = 0, mouseY = 0;

function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

function criarEstrelas() {
  estrelas = [];
  const qtd = Math.floor((w * h) / 8000);
  for (let i = 0; i < qtd; i++) {
    estrelas.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.3 + 0.3,
      depth: Math.random() * 0.6 + 0.2,
      fase: Math.random() * Math.PI * 2,
      vel: Math.random() * 0.4 + 0.15
    });
  }
}
criarEstrelas();
window.addEventListener('resize', criarEstrelas);

window.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / w) - 0.5;
  mouseY = (e.clientY / h) - 0.5;
});

function spawnCometa() {
  const deLado = Math.random() > 0.5;
  cometas.push({
    x: deLado ? -50 : Math.random() * w,
    y: deLado ? Math.random() * h * 0.5 : -50,
    vx: deLado ? (Math.random() * 4 + 3) : (Math.random() * 2 - 1),
    vy: deLado ? (Math.random() * 2 - 1) : (Math.random() * 4 + 3),
    vida: 0
  });
}

const PALETA_CELESTE = [
  ['#5B8CFF', '#141b3d'],
  ['#9DBBFF', '#1f2a52'],
  ['#8B5CF6', '#241a42'],
  ['#E879C4', '#3a1c33']
];

function criarCorpoCeleste() {
  const deEsquerda = Math.random() > 0.5;
  const ehPlaneta = Math.random() > 0.5;
  const raio = ehPlaneta ? (Math.random() * 24 + 16) : (Math.random() * 7 + 4);
  const [corClara, corEscura] = PALETA_CELESTE[Math.floor(Math.random() * PALETA_CELESTE.length)];
  const pontosAsteroide = [];
  if (!ehPlaneta) {
    const n = 7 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      pontosAsteroide.push({ ang: (i / n) * Math.PI * 2, r: 0.65 + Math.random() * 0.5 });
    }
  }
  corposCelestes.push({
    tipo: ehPlaneta ? 'planeta' : 'asteroide',
    x: deEsquerda ? -raio * 3 : w + raio * 3,
    y: Math.random() * h * 0.8 + h * 0.08,
    vx: (deEsquerda ? 1 : -1) * (Math.random() * 0.15 + 0.06),
    raio, corClara, corEscura,
    rotacao: Math.random() * Math.PI * 2,
    velRotacao: (Math.random() - 0.5) * 0.003,
    temAnel: ehPlaneta && Math.random() > 0.5,
    pontosAsteroide
  });
}

function desenharCorposCelestes() {
  corposCelestes.forEach(c => {
    c.x += c.vx;
    c.rotacao += c.velRotacao;

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rotacao);
    ctx.globalAlpha = 0.45;

    if (c.tipo === 'planeta') {
      const grad = ctx.createRadialGradient(-c.raio * 0.3, -c.raio * 0.3, c.raio * 0.1, 0, 0, c.raio);
      grad.addColorStop(0, c.corClara);
      grad.addColorStop(1, c.corEscura);
      ctx.beginPath();
      ctx.arc(0, 0, c.raio, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      if (c.temAnel) {
        ctx.globalAlpha = 0.28;
        ctx.strokeStyle = c.corClara;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, c.raio * 1.8, c.raio * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      c.pontosAsteroide.forEach((p, idx) => {
        const px = Math.cos(p.ang) * p.r * c.raio;
        const py = Math.sin(p.ang) * p.r * c.raio;
        if (idx === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fillStyle = c.corEscura;
      ctx.fill();
    }
    ctx.restore();
  });
  corposCelestes = corposCelestes.filter(c => c.x > -c.raio * 4 && c.x < w + c.raio * 4);
}

let temporizador = 0;
function desenhar() {
  ctx.clearRect(0, 0, w, h);
  temporizador += 1;

  estrelas.forEach(s => {
    const brilho = 0.5 + 0.5 * Math.sin(temporizador * 0.02 * s.vel + s.fase);
    const px = s.x + mouseX * 30 * s.depth;
    const py = s.y + mouseY * 30 * s.depth;
    ctx.beginPath();
    ctx.arc(px, py, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(230,235,255,${brilho * 0.85})`;
    ctx.fill();
  });

  cometas.forEach((c, i) => {
    c.x += c.vx;
    c.y += c.vy;
    c.vida += 1;
    ctx.beginPath();
    const grad = ctx.createLinearGradient(c.x, c.y, c.x - c.vx * 8, c.y - c.vy * 8);
    grad.addColorStop(0, 'rgba(157,187,255,0.9)');
    grad.addColorStop(1, 'rgba(157,187,255,0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x - c.vx * 8, c.y - c.vy * 8);
    ctx.stroke();
    if (c.x > w + 100 || c.y > h + 100 || c.vida > 400) cometas.splice(i, 1);
  });

  if (!reducedMotion && Math.random() < 0.006 && cometas.length < 2) spawnCometa();

  desenharCorposCelestes();
  if (!reducedMotion && Math.random() < 0.0007 && corposCelestes.length < 1) criarCorpoCeleste();

  requestAnimationFrame(desenhar);
}
desenhar();

/* ===== SCROLL REVEAL ===== */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('in-view');
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* ===== FILTRO DA GALERIA ===== */
const filtros = document.querySelectorAll('.filtro');
const cards = document.querySelectorAll('.card');

function aplicarFiltro(categoria) {
  filtros.forEach(b => b.classList.toggle('ativo', b.dataset.filtro === categoria));
  cards.forEach(card => {
    const mostrar = card.dataset.cat === categoria;
    card.classList.toggle('hide', !mostrar);
  });
}

filtros.forEach(botao => {
  botao.addEventListener('click', () => aplicarFiltro(botao.dataset.filtro));
});

/* ===== CONSTELAÇÃO INTERATIVA ===== */
const nodeInfo = document.getElementById('node-info');
const descricoes = {
  design: 'Identidade visual, artes e composição gráfica.',
  video: 'Corte, cor e narrativa audiovisual.',
  drone: 'Captação aérea e enquadramento a partir do céu.',
  dev: 'Desenvolvimento de produtos e ferramentas, com apoio de IA.'
};

document.querySelectorAll('.node').forEach(node => {
  const key = node.dataset.node;
  const linhaRelacionada = document.querySelector(`.linha[data-node="${key}"]`);

  function ativar() {
    document.querySelectorAll('.linha[data-node]').forEach(l => l.classList.remove('ativa'));
    if (linhaRelacionada) linhaRelacionada.classList.add('ativa');
    nodeInfo.querySelector('.node-info-tag').textContent = `// ${key.toUpperCase()}`;
    nodeInfo.querySelector('.node-info-desc').textContent = descricoes[key];
  }

  function irParaGaleria() {
    aplicarFiltro(key);
    document.getElementById('trabalhos').scrollIntoView({ behavior: 'smooth' });
  }

  node.addEventListener('mouseenter', ativar);
  node.addEventListener('focus', ativar);
  node.addEventListener('click', irParaGaleria);
  node.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); irParaGaleria(); }
  });
});

/* ===== CONTADOR DE ACESSOS ===== */
const visitCounterEl = document.getElementById('visit-counter');
fetch('https://abacus.jasoncameron.dev/hit/ramonlima-portfolio/visits')
  .then(r => r.json())
  .then(data => {
    const total = String(data.value).padStart(4, '0');
    visitCounterEl.textContent = `Total de acessos: ${total}`;
  })
  .catch(() => { visitCounterEl.textContent = ''; });

/* ===== GALERIAS (LIGHTBOX) ===== */
const galerias = {
  'design-armazem': [
    'assets/design/Armazem dos tubos/web/ARMAZEM DOS TUBOS COM FUNDO LOGO.psd.png',
    'assets/design/Armazem dos tubos/web/AMARELO.png'
  ],
  'design-acai': [
    'assets/design/Açaí Kidelicia/web/Logo com fundo açai em 3D.png',
    'assets/design/Açaí Kidelicia/web/Logo com fundo branco em 3D.png',
    'assets/design/Açaí Kidelicia/web/AÇAI KI DELICIA.png',
    'assets/design/Açaí Kidelicia/web/AÇAITERIA-SOCIAL-MEDIA-01.png'
  ],
  'design-fazenda': [
    'assets/design/Fazenda Renascer/web/Logo marca em 3d.png',
    'assets/design/Fazenda Renascer/web/Logo marca em 3d.png222.png',
    'assets/design/Fazenda Renascer/web/Completo.png'
  ],
  'design-jadson': [
    'assets/design/Folder/web/Folder Jadson.png'
  ],
  'design-jhenifer': [
    'assets/design/Jhenifer Kayte/web/page-1.png'
  ],
  'design-sfcloset': [
    'assets/design/SF Closet/web/Logo Com frase Mockup Efeito 3D.png',
    'assets/design/SF Closet/web/Logo Apenas Letras SF -  SF CLOSET Mockup Efeito 3D.png',
    'assets/design/SF Closet/web/Caneca Mockup 3D SF Closet.png',
    'assets/design/SF Closet/web/Exposição Cartão de Agradecimento SF Closet.png',
    'assets/design/SF Closet/web/Sacola SF CLost.png'
  ],
  'design-transportes': [
    'assets/design/Transportes pé no chão/web/Diferencial dianteiro completo.png',
    'assets/design/Transportes pé no chão/web/AMORTECEDOR.png',
    'assets/design/Transportes pé no chão/web/JOGO DE BANCOS.png',
    'assets/design/Transportes pé no chão/web/MOTOR DE TRAÇÃO.png'
  ],
  'design-camping': [
    'assets/design/Camping Maloca E Rodas/web/page-1.png',
    'assets/design/Camping Maloca E Rodas/web/page-2.png',
    'assets/design/Camping Maloca E Rodas/web/page-3.png',
    'assets/design/Camping Maloca E Rodas/web/page-4.png',
    'assets/design/Camping Maloca E Rodas/web/page-5.png',
    'assets/design/Camping Maloca E Rodas/web/page-6.png',
    'assets/design/Camping Maloca E Rodas/web/page-7.png',
    'assets/design/Camping Maloca E Rodas/web/page-8.png',
    'assets/design/Camping Maloca E Rodas/web/page-9.png',
    'assets/design/Camping Maloca E Rodas/web/page-10.png',
    'assets/design/Camping Maloca E Rodas/web/page-11.png',
    'assets/design/Camping Maloca E Rodas/web/page-12.png'
  ],
  'design-wicity': [
    'assets/design/WiCity/web/Mockup fachada intera.png',
    'assets/design/WiCity/web/Mockup Painel de dados.png',
    'assets/design/WiCity/web/Mockup Caneta e timbrado.png'
  ],
  video: [
    // adicione aqui os caminhos das imagens/thumbs de vídeo
  ],
  drone: [
    'assets/drone/web/DJI_0077.jpg',
    'assets/drone/web/DJI_0121.jpg',
    'assets/drone/web/DJI_0250.jpg',
    'assets/drone/web/DJI_0600.jpg',
    'assets/drone/web/DJI_0602.jpg',
    'assets/drone/web/DJI_0623.jpg',
    'assets/drone/web/DJI_0627.jpg',
    'assets/drone/web/DJI_0637.jpg',
    'assets/drone/web/DJI_0645.jpg',
    'assets/drone/web/DJI_0649.jpg',
    'assets/drone/web/DJI_0671.jpg',
    'assets/drone/web/DJI_0788.jpg',
    'assets/drone/web/DJI_0790.jpg',
    'assets/drone/web/DJI_0807.jpg',
    'assets/drone/web/dji_fly_579101011_081320_627_1765552634356_photo.jpg',
    'assets/drone/web/dji_fly_583500917_111320_137_1781802467195_photo.jpg'
  ]
};

const mosaic = document.getElementById('mosaic');
const mosaicGrid = document.getElementById('mosaic-grid');
const mosaicTitle = document.getElementById('mosaic-title');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCounter = document.getElementById('lightbox-counter');
let galeriaAtual = [];
let indiceAtual = 0;

const videoGalerias = {
  reels: [
    'https://www.instagram.com/p/DaFvMtep4Wo/',
    'https://www.instagram.com/p/DYw0YtKJ4Dw/',
    'https://www.instagram.com/p/DYW9gvhxHaJ/',
    'https://www.instagram.com/p/DW831M6iTuS/',
    'https://www.instagram.com/p/DbV9w3PIxYl/',
    'https://www.instagram.com/reel/DIG4Gd5A2hp/'
  ]
};

function abrirMosaicoVideo(nomeGaleria) {
  const videos = videoGalerias[nomeGaleria];
  if (!videos || !videos.length) return;
  mosaicTitle.textContent = `// ${videos.length} VÍDEOS`;
  mosaicGrid.innerHTML = '';
  mosaicGrid.classList.add('mosaic-grid-video');
  videos.forEach(url => {
    const bq = document.createElement('blockquote');
    bq.className = 'instagram-media';
    bq.setAttribute('data-instgrm-permalink', url);
    bq.setAttribute('data-instgrm-version', '14');
    mosaicGrid.appendChild(bq);
  });
  mosaic.classList.add('aberto');
  mosaic.setAttribute('aria-hidden', 'false');
  if (window.instgrm) window.instgrm.Embeds.process();
}

function abrirMosaico(nomeGaleria) {
  const fotos = galerias[nomeGaleria];
  if (!fotos || !fotos.length) return;
  mosaicGrid.classList.remove('mosaic-grid-video');
  mosaicTitle.textContent = `// ${fotos.length} FOTOS`;
  mosaicGrid.innerHTML = '';
  fotos.forEach((src, i) => {
    const item = document.createElement('div');
    item.className = 'mosaic-item';
    item.style.backgroundImage = `url('${src}')`;
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `Abrir foto ${i + 1}`);
    const abrir = () => { fecharMosaico(); abrirLightbox(nomeGaleria, i); };
    item.addEventListener('click', abrir);
    item.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } });
    mosaicGrid.appendChild(item);
  });
  mosaic.classList.add('aberto');
  mosaic.setAttribute('aria-hidden', 'false');
}

function fecharMosaico() {
  mosaic.classList.remove('aberto');
  mosaic.setAttribute('aria-hidden', 'true');
}

function mostrarFoto() {
  lightboxImg.src = galeriaAtual[indiceAtual];
  lightboxCounter.textContent = `${indiceAtual + 1} / ${galeriaAtual.length}`;
}

function abrirLightbox(nomeGaleria, indiceInicial = 0) {
  galeriaAtual = galerias[nomeGaleria];
  if (!galeriaAtual || !galeriaAtual.length) return;
  indiceAtual = indiceInicial;
  mostrarFoto();
  lightbox.classList.add('aberto');
  lightbox.setAttribute('aria-hidden', 'false');
}

function fecharLightbox() {
  lightbox.classList.remove('aberto');
  lightbox.setAttribute('aria-hidden', 'true');
}

function fotoAnterior() {
  indiceAtual = (indiceAtual - 1 + galeriaAtual.length) % galeriaAtual.length;
  mostrarFoto();
}

function proximaFoto() {
  indiceAtual = (indiceAtual + 1) % galeriaAtual.length;
  mostrarFoto();
}

document.querySelectorAll('[data-galeria]').forEach(card => {
  card.addEventListener('click', () => abrirMosaico(card.dataset.galeria));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirMosaico(card.dataset.galeria); }
  });
});
document.querySelectorAll('[data-video-galeria]').forEach(card => {
  card.addEventListener('click', () => abrirMosaicoVideo(card.dataset.videoGaleria));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirMosaicoVideo(card.dataset.videoGaleria); }
  });
});

function abrirLink(url) {
  if (url.startsWith('#')) {
    document.querySelector(url)?.scrollIntoView({ behavior: 'smooth' });
  } else {
    window.open(url, '_blank', 'noopener');
  }
}
document.querySelectorAll('[data-link]').forEach(card => {
  card.addEventListener('click', () => abrirLink(card.dataset.link));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirLink(card.dataset.link); }
  });
});
document.getElementById('mosaic-close').addEventListener('click', fecharMosaico);
mosaic.addEventListener('click', (e) => { if (e.target === mosaic) fecharMosaico(); });

document.getElementById('lightbox-close').addEventListener('click', fecharLightbox);
document.getElementById('lightbox-prev').addEventListener('click', fotoAnterior);
document.getElementById('lightbox-next').addEventListener('click', proximaFoto);
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) fecharLightbox(); });
document.addEventListener('keydown', (e) => {
  if (lightbox.classList.contains('aberto')) {
    if (e.key === 'Escape') fecharLightbox();
    if (e.key === 'ArrowLeft') fotoAnterior();
    if (e.key === 'ArrowRight') proximaFoto();
  } else if (mosaic.classList.contains('aberto')) {
    if (e.key === 'Escape') fecharMosaico();
  }
});

/* ===== FORMULÁRIO DE CONTATO ===== */
// Envia via Web3Forms (site estático, sem backend próprio).
const form = document.getElementById('form-contato');
const status = document.getElementById('form-status');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const botao = form.querySelector('button[type="submit"]');
    botao.disabled = true;
    status.textContent = 'Enviando...';

    try {
      const resposta = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      const resultado = await resposta.json();
      if (resultado.success) {
        status.textContent = 'Mensagem enviada! Retorno em breve.';
        form.reset();
      } else {
        status.textContent = 'Não deu pra enviar. Tenta de novo?';
      }
    } catch {
      status.textContent = 'Falha de conexão. Tenta de novo?';
    } finally {
      botao.disabled = false;
    }
  });
}
