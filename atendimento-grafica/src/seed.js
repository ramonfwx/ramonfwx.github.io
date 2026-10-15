// Dados iniciais. Só roda se o banco estiver vazio. TUDO aqui pode ser editado depois no painel.
import { db, getSetting, setSetting } from './db.js';

const dia = (abre, fecha) => ({ open: abre, close: fecha });

export const DEFAULT_SETTINGS = {
  business: {
    name: 'Gráfica Exemplo',
    owner: 'Seu Nome',
    cnpj: '',
    phone: '',
    email: '',
    address: 'Rua Exemplo, 123 - Centro',
    instagram: '',
    pix_key: '',
  },
  // null = fechado. Índice do JS: 0 = domingo ... 6 = sábado
  hours: [null, dia('08:00', '18:00'), dia('08:00', '18:00'), dia('08:00', '18:00'), dia('08:00', '18:00'), dia('08:00', '18:00'), dia('08:00', '12:00')],
  entry_percent: 50,
  payment_methods: ['PIX', 'Cartão de crédito', 'Cartão de débito', 'Dinheiro', 'Transferência'],
  public_url: '',
  notify_status: true,
  terms:
    'O cliente é responsável pelo conteúdo e pela revisão da arte aprovada. Após o início da produção não há cancelamento nem troca por erro de arte aprovada. O prazo começa a contar após a confirmação do pagamento do sinal e a aprovação da arte. Pedidos não retirados em 30 dias poderão ser descartados.',
  messages: {
    greeting:
      'Olá{nome}! 👋 Aqui é o atendimento da *{grafica}*.\n\nSegue nossa tabela de valores:\n\n{tabela}\n\n👉 Para montar seu orçamento na hora, é só acessar:\n{link}\n\nSe preferir, responda *atendente* que alguém fala com você.',
    outside_hours: '🕗 No momento estamos fechados ({horario}). Você já pode montar seu orçamento no link e respondemos o resto assim que abrirmos.',
    menu: 'Como posso ajudar? Responda com o número:\n\n1️⃣ Tabela de preços\n2️⃣ Fazer orçamento\n3️⃣ Status do meu pedido\n4️⃣ Endereço e horário\n5️⃣ Falar com atendente',
    handoff: 'Certo! Já chamei um atendente. Em instantes ele responde por aqui. 🙌',
    quote_link: 'Monte seu orçamento por aqui, é rápido e já sai o pedido em PDF:\n{link}',
    order_received:
      '✅ Pedido *#{numero}* recebido, {nome}!\n\nTotal: *{total}*\nSinal para iniciar: *{sinal}* ({pagamento})\n\nSeu pedido em PDF: {pdf}\n\nQualquer dúvida é só responder aqui.',
    status: {
      novo: '',
      arte: '🎨 Pedido #{numero}: estamos preparando/aguardando a *arte*.',
      aprovacao: '👀 Pedido #{numero}: a arte está *aguardando sua aprovação*.',
      producao: '🖨️ Pedido #{numero}: entrou em *produção*.',
      pronto: '📦 Pedido #{numero}: *pronto*! Pode vir retirar (ou já saímos para entrega).',
      entregue: '🙏 Pedido #{numero} entregue. Obrigado pela preferência, volte sempre!',
      cancelado: '❌ Pedido #{numero} foi cancelado. Se foi engano, responda aqui.',
    },
  },
};

const PRODUTOS = [
  {
    name: 'Banner em lona 440g',
    category: 'Comunicação visual',
    pricing_type: 'm2',
    price: 15000,
    min_price: 4500,
    finishes: [
      { id: 'ilhos', label: 'Ilhós nos cantos', price: 1000, mode: 'item' },
      { id: 'bastao', label: 'Bastão e cordinha', price: 1500, mode: 'item' },
      { id: 'reforco', label: 'Reforço nas bordas', price: 400, mode: 'ml' },
    ],
    description: 'Lona impressa em alta resolução. Ex.: 1,00 x 0,80 m = R$ 120,00.',
    keywords: 'banner,lona,faixa',
    production_days: 2,
  },
  {
    name: 'Adesivo vinil',
    category: 'Comunicação visual',
    pricing_type: 'm2',
    price: 10000,
    min_price: 2500,
    finishes: [
      { id: 'lamina', label: 'Laminação fosca ou brilho', price: 3000, mode: 'm2' },
      { id: 'recorte', label: 'Recorte eletrônico', price: 2500, mode: 'm2' },
    ],
    description: 'Adesivo vinil impresso, para parede, vidro, carro e embalagens.',
    keywords: 'adesivo,vinil',
    production_days: 2,
  },
  {
    name: 'Fachada em ACM',
    category: 'Comunicação visual',
    pricing_type: 'm2',
    price: 45000,
    min_price: 40000,
    finishes: [{ id: 'instalacao', label: 'Instalação no local', price: 15000, mode: 'm2' }],
    description: 'Placa de fachada em ACM com adesivo. Medida final e instalação confirmadas na visita.',
    keywords: 'fachada,acm,letreiro,placa de loja',
    production_days: 7,
  },
  {
    name: 'Placa em PVC',
    category: 'Comunicação visual',
    pricing_type: 'm2',
    price: 18000,
    min_price: 3500,
    finishes: [{ id: 'furos', label: 'Furos para fixação', price: 300, mode: 'item' }],
    description: 'Placa de PVC 2 mm com adesivo impresso. Sinalização, aviso e porta de sala.',
    keywords: 'placa,pvc,sinalizacao,sinalização,aviso',
    production_days: 3,
  },
  {
    name: 'Cartão de visita',
    category: 'Impressos',
    pricing_type: 'fixed',
    variants: [
      { label: '500 un - couchê 300g', price: 8000 },
      { label: '1000 un - couchê 300g', price: 12000 },
      { label: '1000 un - couchê + verniz localizado', price: 18000 },
    ],
    description: 'Cartão 9 x 5 cm, 4x4 cores.',
    keywords: 'cartao,cartão,cartao de visita,cartão de visita',
    production_days: 3,
  },
  {
    name: 'Panfleto / Flyer A5',
    category: 'Impressos',
    pricing_type: 'unit',
    price: 60,
    tiers: [
      { min: 500, price: 25 },
      { min: 1000, price: 18 },
      { min: 5000, price: 12 },
    ],
    description: 'Flyer A5 (14,8 x 21 cm), 4x0 cores, couchê 115g. Quanto maior a quantidade, menor o valor unitário.',
    keywords: 'panfleto,flyer,folheto,santinho',
    production_days: 3,
  },
];

// Segunda leva de serviços (preços de exemplo, ajuste em Produtos e preços).
const PRODUTOS_V2 = [
  // Comunicação visual
  {
    name: 'Adesivo perfurado (vidro e veículo)',
    category: 'Comunicação visual',
    pricing_type: 'm2',
    price: 17000,
    min_price: 4000,
    finishes: [{ id: 'instalacao', label: 'Aplicação no local', price: 6000, mode: 'm2' }],
    description: 'Película perfurada para vitrine e vidro traseiro de carro: de dentro enxerga, de fora vê a arte.',
    keywords: 'perfurado,perfurada,pelicula,película,vitrine',
    production_days: 3,
  },
  {
    name: 'Lona backlight (painel iluminado)',
    category: 'Comunicação visual',
    pricing_type: 'm2',
    price: 22000,
    min_price: 8000,
    finishes: [{ id: 'reforco', label: 'Reforço e acabamento nas bordas', price: 500, mode: 'ml' }],
    description: 'Lona translúcida para caixa de luz e painel iluminado.',
    keywords: 'backlight,caixa de luz,painel iluminado,luminoso',
    production_days: 3,
  },
  {
    name: 'Adesivo de parede (decorativo)',
    category: 'Comunicação visual',
    pricing_type: 'm2',
    price: 12000,
    min_price: 3000,
    finishes: [{ id: 'recorte', label: 'Recorte eletrônico', price: 2500, mode: 'm2' }, { id: 'instalacao', label: 'Aplicação no local', price: 5000, mode: 'm2' }],
    description: 'Adesivo vinil removível para parede, sala, quarto e loja.',
    keywords: 'parede,decorativo,decoracao,decoração,papel de parede',
    production_days: 3,
  },
  {
    name: 'Plotagem de veículo',
    category: 'Comunicação visual',
    pricing_type: 'm2',
    price: 18000,
    min_price: 12000,
    finishes: [{ id: 'lamina', label: 'Laminação de proteção', price: 3500, mode: 'm2' }, { id: 'instalacao', label: 'Aplicação no veículo', price: 9000, mode: 'm2' }],
    description: 'Adesivagem de carro, moto, van e caminhão. Orçamento final conferido com as medidas do veículo.',
    keywords: 'plotagem,veiculo,veículo,carro,moto,van,caminhao,caminhão,envelopamento',
    production_days: 5,
  },
  {
    name: 'Impressão em canvas (quadro)',
    category: 'Comunicação visual',
    pricing_type: 'm2',
    price: 35000,
    min_price: 9000,
    finishes: [{ id: 'chassi', label: 'Montagem em chassi (moldura de madeira)', price: 8000, mode: 'ml' }],
    description: 'Foto ou arte impressa em tecido canvas, para decoração.',
    keywords: 'canvas,quadro,tela,decoracao,decoração',
    production_days: 4,
  },
  {
    name: 'Pôster / cartaz em papel',
    category: 'Comunicação visual',
    pricing_type: 'm2',
    price: 9000,
    min_price: 1500,
    finishes: [{ id: 'lamina', label: 'Laminação', price: 3000, mode: 'm2' }],
    description: 'Impressão em papel fotográfico ou couchê grande formato: pôster, cartaz, mapa, planta.',
    keywords: 'poster,pôster,cartaz,plotter,planta,mapa',
    production_days: 2,
  },
  {
    name: 'Banner roll-up (retrátil)',
    category: 'Comunicação visual',
    pricing_type: 'fixed',
    variants: [
      { label: '80 x 200 cm', price: 22000 },
      { label: '100 x 200 cm', price: 26000 },
      { label: '120 x 200 cm', price: 31000 },
    ],
    description: 'Banner com estrutura retrátil e bolsa de transporte. Ótimo para evento e balcão.',
    keywords: 'rollup,roll-up,roll up,retratil,retrátil,x banner,expositor',
    production_days: 3,
  },
  {
    name: 'Wind banner (bandeira de calçada)',
    category: 'Comunicação visual',
    pricing_type: 'fixed',
    variants: [
      { label: 'Tamanho P (2,2 m)', price: 18000 },
      { label: 'Tamanho M (2,8 m)', price: 23000 },
      { label: 'Tamanho G (3,5 m)', price: 29000 },
    ],
    description: 'Bandeira vertical com haste e base. Chama atenção na calçada.',
    keywords: 'wind banner,windbanner,bandeira,flag,calcada,calçada',
    production_days: 4,
  },
  // Impressos
  {
    name: 'Folder / Flyer A4',
    category: 'Impressos',
    pricing_type: 'fixed',
    variants: [
      { label: '500 un - couchê 150g, frente e verso', price: 24000 },
      { label: '1000 un - couchê 150g, frente e verso', price: 32000 },
      { label: '2500 un - couchê 150g, frente e verso', price: 58000 },
    ],
    description: 'Folder A4 (21 x 29,7 cm) com ou sem dobra.',
    keywords: 'folder,folheto,a4,dobra',
    production_days: 4,
  },
  {
    name: 'Cardápio',
    category: 'Impressos',
    pricing_type: 'unit',
    price: 1800,
    tiers: [
      { min: 10, price: 1400 },
      { min: 30, price: 1100 },
      { min: 100, price: 800 },
    ],
    description: 'Cardápio A4 ou A3, frente e verso, laminado (resiste a gordura e líquidos).',
    keywords: 'cardapio,cardápio,menu',
    production_days: 3,
  },
  {
    name: 'Bloco / receituário / pedido',
    category: 'Impressos',
    pricing_type: 'fixed',
    variants: [
      { label: '10 blocos A5 - 50 folhas', price: 17000 },
      { label: '20 blocos A5 - 50 folhas', price: 29000 },
      { label: '10 blocos A5 - 2 vias autocopiativo', price: 26000 },
    ],
    description: 'Bloco personalizado: orçamento, comanda, recibo, receita. Com ou sem numeração.',
    keywords: 'bloco,receituario,receituário,comanda,recibo,talao,talão',
    production_days: 5,
  },
  {
    name: 'Cartão fidelidade / tag',
    category: 'Impressos',
    pricing_type: 'fixed',
    variants: [
      { label: '500 un - 9 x 5 cm', price: 8500 },
      { label: '1000 un - 9 x 5 cm', price: 13000 },
    ],
    description: 'Cartão fidelidade, tag de roupa e cartão de agradecimento.',
    keywords: 'fidelidade,tag,agradecimento,cartao fidelidade,cartão fidelidade',
    production_days: 3,
  },
  {
    name: 'Convite / cartão grande',
    category: 'Impressos',
    pricing_type: 'unit',
    price: 450,
    tiers: [
      { min: 50, price: 320 },
      { min: 100, price: 250 },
      { min: 300, price: 190 },
    ],
    description: 'Convite 10 x 15 cm ou 15 x 21 cm, papel couchê 300g ou markatto, frente e verso.',
    keywords: 'convite,casamento,aniversario,aniversário,formatura,save the date',
    production_days: 4,
  },
  {
    name: 'Calendário de mesa / parede',
    category: 'Impressos',
    pricing_type: 'fixed',
    variants: [
      { label: '100 un - mesa', price: 42000 },
      { label: '100 un - parede', price: 52000 },
    ],
    description: 'Calendário personalizado com a sua marca para dar aos clientes.',
    keywords: 'calendario,calendário',
    production_days: 7,
  },
  {
    name: 'Envelope personalizado',
    category: 'Impressos',
    pricing_type: 'fixed',
    variants: [
      { label: '250 un - ofício 4x0', price: 26000 },
      { label: '500 un - ofício 4x0', price: 42000 },
    ],
    description: 'Envelope com a sua logo, para documentos e cartas.',
    keywords: 'envelope,oficio,ofício',
    production_days: 6,
  },
  // Etiquetas e adesivos pequenos
  {
    name: 'Etiqueta / adesivo redondo ou quadrado',
    category: 'Etiquetas e adesivos',
    pricing_type: 'fixed',
    variants: [
      { label: '100 un - até 5 cm', price: 4500 },
      { label: '500 un - até 5 cm', price: 11000 },
      { label: '1000 un - até 5 cm', price: 16000 },
      { label: '100 un - até 10 cm', price: 7500 },
    ],
    description: 'Etiqueta de produto, lacre, rótulo e embalagem. Corte na forma que você quiser.',
    keywords: 'etiqueta,rotulo,rótulo,lacre,embalagem,sticker,adesivo pequeno,redondo',
    production_days: 3,
  },
  {
    name: 'Imã de geladeira',
    category: 'Etiquetas e adesivos',
    pricing_type: 'fixed',
    variants: [
      { label: '50 un - 5 x 8 cm', price: 17500 },
      { label: '100 un - 5 x 8 cm', price: 29000 },
    ],
    description: 'Imã personalizado, muito usado por clínicas, restaurantes e prestadores de serviço.',
    keywords: 'ima,imã,geladeira,magnetico,magnético',
    production_days: 4,
  },
  // Brindes
  {
    name: 'Caneca personalizada',
    category: 'Brindes e personalizados',
    pricing_type: 'unit',
    price: 3500,
    tiers: [
      { min: 6, price: 2900 },
      { min: 24, price: 2400 },
      { min: 100, price: 2000 },
    ],
    description: 'Caneca de porcelana branca 325 ml com estampa em sublimação.',
    keywords: 'caneca,xicara,xícara,sublimacao,sublimação',
    production_days: 3,
  },
  {
    name: 'Camiseta personalizada',
    category: 'Brindes e personalizados',
    pricing_type: 'unit',
    price: 5500,
    tiers: [
      { min: 10, price: 4500 },
      { min: 30, price: 3800 },
      { min: 100, price: 3200 },
    ],
    description: 'Camiseta com estampa frente. Grade de tamanhos combinada pelo WhatsApp depois do pedido.',
    keywords: 'camiseta,camisa,uniforme,estampa,estampar',
    production_days: 5,
  },
  {
    name: 'Chaveiro personalizado',
    category: 'Brindes e personalizados',
    pricing_type: 'unit',
    price: 1000,
    tiers: [
      { min: 50, price: 750 },
      { min: 100, price: 600 },
      { min: 500, price: 450 },
    ],
    description: 'Chaveiro de acrílico ou MDF com a sua marca.',
    keywords: 'chaveiro,brinde',
    production_days: 5,
  },
  // Gráfica rápida
  {
    name: 'Impressão colorida A4 / A3',
    category: 'Gráfica rápida',
    pricing_type: 'unit',
    price: 300,
    tiers: [
      { min: 20, price: 220 },
      { min: 100, price: 160 },
      { min: 500, price: 120 },
    ],
    description: 'Impressão laser colorida em papel sulfite 75g (A4). Para A3 consulte o atendente.',
    keywords: 'impressao,impressão,imprimir,xerox,copia,cópia,sulfite',
    production_days: 1,
  },
  {
    name: 'Encadernação espiral',
    category: 'Gráfica rápida',
    pricing_type: 'fixed',
    variants: [
      { label: 'Até 100 folhas', price: 800 },
      { label: 'Até 200 folhas', price: 1200 },
      { label: 'Até 300 folhas', price: 1600 },
    ],
    description: 'Espiral com capa transparente e contracapa. Trabalho, TCC, apostila.',
    keywords: 'encadernacao,encadernação,espiral,tcc,apostila,monografia',
    production_days: 1,
  },
  {
    name: 'Plastificação',
    category: 'Gráfica rápida',
    pricing_type: 'unit',
    price: 700,
    tiers: [
      { min: 10, price: 550 },
      { min: 50, price: 420 },
    ],
    description: 'Plastificação de documento, cartaz ou aviso (A4). Maior proteção contra água e uso.',
    keywords: 'plastificacao,plastificação,plastificar,laminar documento',
    production_days: 1,
  },
];

const insertProduct = (p, position) =>
  db
    .prepare(`INSERT INTO products
    (name, category, pricing_type, price, min_price, tiers, variants, finishes, description, keywords, production_days, position)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      p.name,
      p.category,
      p.pricing_type,
      p.price ?? 0,
      p.min_price ?? 0,
      JSON.stringify(p.tiers ?? []),
      JSON.stringify(p.variants ?? []),
      JSON.stringify(p.finishes ?? []),
      p.description ?? '',
      p.keywords ?? '',
      p.production_days ?? 2,
      position
    );

export function seedIfEmpty() {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    if (getSetting(key) === null) setSetting(key, value);
  }
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM products').get();
  if (n === 0) PRODUTOS.forEach((p, i) => insertProduct(p, i));

  // Segunda leva de serviços: entra uma única vez (também em bancos que já existiam),
  // sem recriar produtos que o dono apagar depois.
  if (getSetting('catalog_v2') === null) {
    const exists = db.prepare('SELECT 1 FROM products WHERE name = ?');
    let pos = db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM products').get().p;
    for (const p of PRODUTOS_V2) if (!exists.get(p.name)) insertProduct(p, pos++);
    setSetting('catalog_v2', true);
  }
}
