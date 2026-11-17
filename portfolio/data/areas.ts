// As quatro áreas de atuação. Só informações já confirmadas no projeto.
// Para acrescentar algo (instituição, ano, local de atuação), inclua uma linha em `fatos`.
export type ModoTrilha = "cursor" | "respira" | "passos" | "curva" | "reproduz";

export type Area = {
  id: string;
  numero: string;
  titulo: string;
  frase: string;
  fatos: { rotulo: string; valor: string }[];
  link: { rotulo: string; href: string };
  // Cada área usa o mesmo fio visual, com um andamento ligeiramente diferente.
  trilha: ModoTrilha;
};

export const areas: Area[] = [
  {
    id: "fisioterapia",
    numero: "01",
    titulo: "Fisioterapia",
    frase: "Formação clínica e registro profissional na área da saúde.",
    fatos: [
      { rotulo: "Registro", valor: "CREFITO 467796-F" },
      { rotulo: "Pós-graduação", valor: "Musculoesquelética" },
      { rotulo: "Pós-graduação", valor: "Neurofuncional" },
      { rotulo: "Pós-graduação", valor: "Terapia Intensiva" },
    ],
    link: { rotulo: "Ferramenta para a rotina clínica: FisioFlow", href: "/projetos/fisioflow/" },
    trilha: "respira",
  },
  {
    id: "programacao",
    numero: "02",
    titulo: "Programação",
    frase: "Sites, sistemas web e aplicativos, do protótipo ao projeto no ar.",
    fatos: [
      { rotulo: "Web", valor: "Next.js, React, Node.js" },
      { rotulo: "Dados", valor: "Supabase" },
      { rotulo: "Interativo", valor: "Unity, three.js" },
    ],
    link: { rotulo: "Ver o Linksouw", href: "/projetos/linksouw/" },
    trilha: "passos",
  },
  {
    id: "design",
    numero: "03",
    titulo: "Design gráfico",
    frase: "Identidade visual, papelaria, mockups e manuais de marca.",
    fatos: [
      { rotulo: "Marca", valor: "Identidade visual" },
      { rotulo: "Aplicações", valor: "Papelaria, mockups" },
      { rotulo: "Sistema", valor: "Manual de marca" },
    ],
    link: { rotulo: "Ver a Amazon Vision", href: "/projetos/amazon-vision/" },
    trilha: "curva",
  },
  {
    id: "video",
    numero: "04",
    titulo: "Edição de vídeo",
    frase: "Edição de vídeo, filmagem com drone e plugins para acelerar a edição no Premiere Pro.",
    fatos: [
      { rotulo: "Edição", valor: "Adobe Premiere Pro" },
      { rotulo: "Captação", valor: "Drone DJI" },
      { rotulo: "Publicação", valor: "Vídeos no YouTube" },
    ],
    link: { rotulo: "Ver o vídeo", href: "/projetos/video-ellie-e-joel/" },
    trilha: "reproduz",
  },
];
