// Conteúdo da página "Sobre". Tudo aqui é editável.
// Só inclua informações verdadeiras: formação, registros, datas e instituições.
export const sobre = {
  introducao: [
    "Sou fisioterapeuta e programador. Minha cidade não tinha curso de tecnologia, então fiz fisioterapia. Gostei, me especializei e hoje trabalho mais com tecnologia.",
    "Design gráfico, edição de vídeo e filmagem com drone completam o que eu faço: são as formas que uso para dar forma e movimento às ideias.",
  ],

  // Acrescente instituição e ano quando quiser. Sem esses campos, a linha mostra só o título.
  formacao: [
    { titulo: "Fisioterapia", detalhe: "Registro profissional: CREFITO 467796-F" },
    { titulo: "Pós-graduação em Fisioterapia Musculoesquelética" },
    { titulo: "Pós-graduação em Fisioterapia Neurofuncional" },
    { titulo: "Pós-graduação em Terapia Intensiva" },
  ],

  // A fisioterapia aparece só aqui, em "Sobre": é a minha formação, não uma área de projetos.
  areas: [
    {
      titulo: "Desenvolvimento",
      texto: "Sites, sistemas web e aplicativos, do protótipo ao projeto no ar, incluindo ferramentas para a rotina clínica.",
    },
    {
      titulo: "Design gráfico",
      texto: "Identidade visual, papelaria, mockups e manuais de marca.",
    },
    {
      titulo: "Audiovisual",
      texto: "Vídeos para o meu canal no YouTube, filmagem com drone e plugins para acelerar a edição no Premiere Pro.",
    },
  ],

  ferramentas: [
    { grupo: "Programação", itens: ["Next.js", "React", "Node.js", "Supabase", "Unity", "three.js"] },
    { grupo: "Vídeo", itens: ["Adobe Premiere Pro", "Drone DJI"] },
    { grupo: "Design", itens: ["Identidade visual", "Papelaria", "Mockups", "Manual de marca"] },
  ],

  abordagem:
    "O que eu aprendo no leito vira software, e o que aprendo no software melhora o meu jeito de cuidar. Gosto de entender o problema antes de desenhar a solução.",
};
