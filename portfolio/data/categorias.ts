export type Categoria = "design" | "video" | "programacao";

// A ordem aqui é a ordem em que os grupos aparecem nas listas de projetos.
export const categorias: { id: Categoria; nome: string }[] = [
  { id: "design", nome: "Design gráfico" },
  { id: "programacao", nome: "Desenvolvimento" },
  { id: "video", nome: "Audiovisual" },
];

export const nomeCategoria = (id: Categoria) =>
  categorias.find((c) => c.id === id)?.nome ?? id;
