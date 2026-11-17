import type { Categoria } from "./categorias";
import manifesto from "./imagens.json";

// ---------------------------------------------------------------------------
// COMO CADASTRAR UM PROJETO
// 1. Coloque as imagens em `public/images/projetos/<slug>/` (ou use o script
//    de imagens) e referencie abaixo.
// 2. Copie um bloco da lista `projetos`, mude os campos e salve.
// 3. Campos opcionais que ficarem vazios simplesmente não aparecem na página.
// ---------------------------------------------------------------------------

export type Imagem = {
  tipo: "imagem";
  src: string;
  largura: number;
  altura: number;
  alt: string;
};

export type Video = {
  tipo: "video";
  provedor: "youtube" | "vimeo" | "arquivo" | "instagram";
  url: string;
  titulo: string;
  capa?: string;
};

export type Midia = Imagem | Video;

export type Projeto = {
  slug: string;
  titulo: string;
  categorias: Categoria[]; // a primeira é a principal
  ano?: string;
  resumo: string;
  destaque?: boolean; // aparece na página inicial
  capa?: Imagem; // sem capa, o site mostra um espaço reservado
  contexto?: string;
  participacao?: string;
  processo?: string;
  tecnologias?: string[];
  funcionalidades?: string[];
  links?: { rotulo: string; url: string }[];
  galeria: Midia[];
};

type Registro = { src: string; w: number; h: number };
const arquivos = manifesto as Record<string, Registro[]>;

const imagens = (slug: string, alt: string): Imagem[] =>
  (arquivos[slug] ?? []).map((i, n, todas) => ({
    tipo: "imagem" as const,
    src: i.src,
    largura: i.w,
    altura: i.h,
    alt: todas.length > 1 ? `${alt}, imagem ${n + 1}` : alt,
  }));

const capaDe = (slug: string, alt: string): Imagem | undefined =>
  imagens(slug, alt)[0];

export const projetos: Projeto[] = [
  // ----------------------------- Em destaque -----------------------------
  {
    slug: "amazon-vision",
    titulo: "Amazon Vision",
    categorias: ["design"],
    destaque: true,
    resumo:
      "Identidade visual para uma clínica de optometria, contatologia e saúde visual.",
    capa: capaDe("amazon-vision", "Fachada da Amazon Vision com a nova marca"),
    contexto:
      "Marca criada para uma clínica de optometria, contatologia e saúde visual.",
    participacao:
      "Criação da identidade visual, incluindo logotipo, papelaria e aplicações da marca.",
    galeria: imagens("amazon-vision", "Aplicação da marca Amazon Vision"),
  },
  {
    slug: "fisioflow",
    titulo: "FisioFlow",
    categorias: ["programacao"],
    destaque: true,
    resumo:
      "Calculadoras de UTI e escalas clínicas para usar no celular, à beira do leito.",
    capa: capaDe("fisioflow", "Tela inicial do FisioFlow"),
    contexto:
      "Ferramenta de apoio à decisão clínica para a rotina de fisioterapia em terapia intensiva.",
    participacao: "Concepção, design e desenvolvimento.",
    tecnologias: ["HTML", "CSS", "JavaScript", "PWA"],
    funcionalidades: [
      "Peso predito e volume corrente",
      "Driving pressure e relação P/F",
      "Gasometria com compensação esperada",
      "PImáx e PEmáx",
      "Escalas de Glasgow e RASS",
    ],
    links: [
      { rotulo: "Ver demonstração", url: "https://fisioflow-8sg.pages.dev" },
      { rotulo: "Ver código", url: "https://github.com/ramonfwx/fisioflow" },
    ],
    galeria: imagens("fisioflow", "Tela do FisioFlow"),
  },
  {
    slug: "video-ellie-e-joel",
    titulo: "Ellie SEMPRE soube que Joel mentiu",
    categorias: ["video"],
    destaque: true,
    resumo: "Vídeo editado para o meu canal no YouTube.",
    capa: capaDe("video-canal", "Miniatura do vídeo no canal do YouTube"),
    participacao: "Edição de vídeo.",
    links: [
      { rotulo: "Assistir no YouTube", url: "https://www.youtube.com/watch?v=IqP0L6Vq1pg&t=153s" },
      { rotulo: "Ver o canal", url: "https://www.youtube.com/@Sairowh" },
    ],
    galeria: [
      {
        tipo: "video" as const,
        provedor: "youtube" as const,
        url: "https://www.youtube.com/watch?v=IqP0L6Vq1pg&t=153s",
        titulo: "Ellie SEMPRE soube que Joel mentiu (não é bait)",
        capa: "/images/projetos/video-canal/01.jpg",
      },
    ],
  },
  {
    slug: "linksouw",
    titulo: "Linksouw",
    categorias: ["programacao"],
    destaque: true,
    resumo:
      "Plataforma de link na bio: cada pessoa monta sua página e compartilha um único endereço.",
    capa: capaDe("linksouw", "Página inicial do Linksouw"),
    participacao: "Desenvolvimento da plataforma.",
    funcionalidades: [
      "Cadastro e login",
      "Painel para adicionar, editar e reordenar links",
      "Prévia ao vivo em formato de celular",
      "Temas e ícones detectados pela URL",
    ],
    links: [{ rotulo: "Visitar o site", url: "https://linksouw.com.br" }],
    galeria: imagens("linksouw", "Página inicial do Linksouw"),
  },
  {
    slug: "drone",
    titulo: "Fotografia com drone",
    categorias: ["video"],
    destaque: true,
    resumo: "Praias, cidades e rios do Pará vistos do alto.",
    capa: capaDe("drone", "Rio e floresta com arco-íris vistos do alto"),
    participacao: "Pilotagem e captação.",
    galeria: imagens("drone", "Fotografia aérea do Pará"),
  },
  {
    slug: "peakiflow",
    titulo: "Peakiflow",
    categorias: ["programacao"],
    destaque: true,
    resumo:
      "Treino de memória com hologramas 3D de anatomia e um simulador de ventilação mecânica.",
    capa: capaDe("peakiflow", "Tela inicial do Peakiflow"),
    contexto:
      "Aplicativo de estudo que combina vocabulário em inglês, anatomia em 3D e ventilação mecânica.",
    participacao: "Concepção e desenvolvimento.",
    tecnologias: ["JavaScript", "three.js", "Modelos 3D BodyParts3D"],
    funcionalidades: [
      "Anatomia em holograma 3D: a parte estudada acende enquanto você digita",
      "Revisão espaçada: o que erra volta amanhã, o que acerta volta em 3, 7, 15 e 30 dias",
      "Simulador de ventilação mecânica com curvas, alarmes e casos clínicos",
    ],
    links: [{ rotulo: "Ver código", url: "https://github.com/ramonfwx/peakiflow" }],
    galeria: imagens("peakiflow", "Tela do Peakiflow"),
  },
  {
    slug: "camping-maloca-e-rodas",
    titulo: "Camping Maloca e Rodas",
    categorias: ["design"],
    destaque: true,
    resumo:
      "Manual de identidade visual com cores, fontes, posições do ícone e aplicações.",
    capa: capaDe("camping-maloca-e-rodas", "Página inicial do manual de marca"),
    participacao: "Criação da identidade visual e do manual de marca.",
    galeria: imagens("camping-maloca-e-rodas", "Página do manual de marca"),
  },
  {
    slug: "wicity-site",
    titulo: "WiCity, site",
    categorias: ["programacao"],
    destaque: true,
    resumo:
      "Melhorias e personalização do site de uma solução de Wi-Fi para marketing.",
    capa: capaDe("wicity-site", "Página inicial do site da WiCity"),
    participacao: "Melhorias e personalização do site.",
    links: [{ rotulo: "Visitar o site", url: "https://wicity.com.br" }],
    galeria: imagens("wicity-site", "Página inicial do site da WiCity"),
  },

  // --------------------------------- Design --------------------------------
  {
    slug: "wicity-identidade",
    titulo: "WiCity, identidade",
    categorias: ["design"],
    resumo: "Identidade visual e aplicações para uma solução de Wi-Fi inteligente.",
    capa: capaDe("wicity-identidade", "Recepção com a marca WiCity"),
    participacao: "Criação da identidade visual e das aplicações.",
    galeria: imagens("wicity-identidade", "Aplicação da marca WiCity"),
  },
  {
    slug: "wicity-soft",
    titulo: "WiCity Soft",
    categorias: ["design"],
    resumo: "Marca, logotipos e perfis para redes sociais.",
    capa: capaDe("wicity-soft", "Ícone da marca WiCity Soft"),
    participacao: "Criação da marca e de seus arquivos de uso.",
    galeria: imagens("wicity-soft", "Peça da marca WiCity Soft"),
  },
  {
    slug: "sf-closet",
    titulo: "SF Closet",
    categorias: ["design"],
    resumo: "Logotipo e aplicações em papelaria, caneca e sacola.",
    capa: capaDe("sf-closet", "Logotipo SF Closet em relevo dourado"),
    participacao: "Criação da identidade visual e das aplicações.",
    galeria: imagens("sf-closet", "Aplicação da marca SF Closet"),
  },
  {
    slug: "transportes-pe-no-chao",
    titulo: "Transportes Pé no Chão",
    categorias: ["design"],
    resumo: "Identidade e peças gráficas de divulgação de peças automotivas.",
    capa: capaDe("transportes-pe-no-chao", "Peça gráfica de divulgação de diferencial"),
    participacao: "Criação da identidade e das peças gráficas.",
    galeria: imagens("transportes-pe-no-chao", "Peça gráfica da Pé no Chão"),
  },
  {
    slug: "armazem-dos-tubos",
    titulo: "Armazém dos Tubos",
    categorias: ["design"],
    resumo: "Identidade visual para uma loja de tubos e conexões.",
    capa: capaDe("armazem-dos-tubos", "Logotipo Armazém dos Tubos"),
    participacao: "Criação da identidade visual.",
    galeria: imagens("armazem-dos-tubos", "Logotipo Armazém dos Tubos"),
  },
  {
    slug: "acai-kidelicia",
    titulo: "Açaí Kidelícia",
    categorias: ["design"],
    resumo: "Identidade visual e peça para redes sociais de uma açaiteria.",
    capa: capaDe("acai-kidelicia", "Logotipo Açaí Kidelícia em 3D"),
    participacao: "Criação da identidade visual e da arte para redes sociais.",
    galeria: imagens("acai-kidelicia", "Peça da marca Açaí Kidelícia"),
  },
  {
    slug: "fazenda-renascer",
    titulo: "Fazenda Renascer",
    categorias: ["design"],
    resumo: "Identidade visual para uma propriedade rural.",
    capa: capaDe("fazenda-renascer", "Logotipo Fazenda Renascer em 3D"),
    participacao: "Criação da identidade visual.",
    galeria: imagens("fazenda-renascer", "Peça da marca Fazenda Renascer"),
  },
  {
    slug: "jhenifer-kayte",
    titulo: "Jhenifer Kayte",
    categorias: ["design"],
    resumo: "Identidade visual pessoal com aplicações.",
    capa: capaDe("jhenifer-kayte", "Aplicações da identidade Jhenifer Kayte"),
    participacao: "Criação da identidade visual.",
    galeria: imagens("jhenifer-kayte", "Aplicações da identidade Jhenifer Kayte"),
  },
  {
    slug: "folder-jadson",
    titulo: "Folder Jadson",
    categorias: ["design"],
    resumo: "Folder impresso desenvolvido sob encomenda.",
    capa: capaDe("folder-jadson", "Folder desenvolvido para Jadson"),
    participacao: "Criação da peça.",
    galeria: imagens("folder-jadson", "Folder desenvolvido para Jadson"),
  },

  // ----------------------------- Programação -------------------------------
  {
    slug: "jsouzanet",
    titulo: "JSouzaNet",
    categorias: ["programacao"],
    resumo:
      "Site institucional de um provedor de internet, com planos, termos de uso e segunda via de boleto.",
    capa: capaDe("jsouzanet", "Página inicial do site da JSouzaNet"),
    participacao: "Desenvolvimento do site.",
    tecnologias: ["HTML", "CSS", "JavaScript"],
    links: [{ rotulo: "Visitar o site", url: "https://jsouzanet.com.br" }],
    galeria: imagens("jsouzanet", "Página inicial do site da JSouzaNet"),
  },
  {
    slug: "gerador-de-orcamento",
    titulo: "Gerador de orçamento",
    categorias: ["programacao"],
    resumo:
      "Monta o orçamento com itens e forma de pagamento, mostra a prévia e exporta em PDF.",
    capa: capaDe("gerador-de-orcamento", "Tela do gerador de orçamento"),
    participacao: "Concepção e desenvolvimento.",
    tecnologias: ["HTML", "CSS", "JavaScript"],
    funcionalidades: [
      "Dados do prestador e do cliente",
      "Catálogo de serviços e itens",
      "Prévia do documento em tempo real",
      "Exportação em PDF",
    ],
    links: [
      { rotulo: "Ver demonstração", url: "https://ramonfwx.github.io/sistema-de-orcamento/" },
      { rotulo: "Ver código", url: "https://github.com/ramonfwx/sistema-de-orcamento" },
    ],
    galeria: imagens("gerador-de-orcamento", "Tela do gerador de orçamento"),
  },
  {
    slug: "prontyclin",
    titulo: "ProntyClin",
    categorias: ["programacao"],
    resumo:
      "Agenda, prontuário e financeiro para profissionais de saúde autônomos.",
    contexto:
      "Cada sessão já desconta deslocamento e material, para o profissional ver o lucro real e não só o faturamento.",
    participacao: "Concepção e desenvolvimento.",
    tecnologias: ["Next.js", "Tailwind CSS", "Supabase"],
    galeria: [],
  },
  {
    slug: "plugins-para-premiere-pro",
    titulo: "Plugins para Premiere Pro",
    categorias: ["video", "programacao"],
    resumo:
      "Painéis e ferramentas para acelerar a edição: alinhamento, animação e legendas.",
    contexto:
      "Painéis UXP de uso pessoal com alinhamento, distribuição, cascata, fechamento de lacunas e um motor de animação, e o Senkufx, que gera legendas dinâmicas e efeitos sonoros processando tudo no próprio computador.",
    participacao: "Concepção e desenvolvimento.",
    tecnologias: ["UXP", "JavaScript", "Node.js", "whisper.cpp", "ffmpeg"],
    galeria: [],
  },
  {
    slug: "site-kaine",
    titulo: "Site Kaine",
    categorias: ["programacao"],
    resumo:
      "Site de portfólio com pacotes e serviços avulsos para um profissional de design gráfico.",
    participacao: "Desenvolvimento do site.",
    tecnologias: ["HTML", "CSS", "JavaScript"],
    links: [
      { rotulo: "Visitar o site", url: "https://ramonfwx.github.io/kaineferreiradsr/" },
    ],
    galeria: [],
  },
  {
    slug: "leftovers",
    titulo: "Leftovers",
    categorias: ["programacao"],
    resumo:
      "Jogo cooperativo indie para até 6 jogadores, com chat de voz por proximidade.",
    participacao: "Desenvolvimento do jogo.",
    tecnologias: ["Unity 6", "C#"],
    links: [{ rotulo: "Ver código", url: "https://github.com/ramonfwx/leftovers" }],
    galeria: [],
  },
];

export const projetosEmDestaque = projetos.filter((p) => p.destaque);
export const buscarProjeto = (slug: string) => projetos.find((p) => p.slug === slug);
export const proximoProjeto = (slug: string) => {
  const i = projetos.findIndex((p) => p.slug === slug);
  return projetos[(i + 1) % projetos.length];
};
