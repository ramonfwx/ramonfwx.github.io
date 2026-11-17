// Configurações gerais do site. Edite aqui nome, contatos e imagens principais.
export const site = {
  nome: "Ramon",
  nomeCompleto: "Ramon Lima",
  url: "https://ramonfwx.github.io",
  descricao:
    "Portfólio de Ramon Lima: design gráfico, edição de vídeo e desenvolvimento.",

  // Deixe vazio enquanto não houver. Links vazios não aparecem no rodapé.
  email: "",
  whatsapp: "", // só números com DDI e DDD, ex.: "5591999999999"
  redes: {
    github: "https://github.com/ramonfwx",
    linksouw: "https://linksouw.com.br",
    behance: "",
    instagram: "",
    linkedin: "",
  },

  // Chave pública do Web3Forms (formulário de contato).
  formularioChave: "0bfd5e88-7075-4889-98d6-22e79a596892",

  // Imagens principais. Coloque os arquivos em `public/images/` e informe o caminho.
  // Enquanto estiver null, o site mostra um espaço reservado.
  imagemHero: null as string | null, // exemplo: "/images/hero.jpg"
  fotoSobre: null as string | null, // exemplo: "/images/ramon.jpg"
};
