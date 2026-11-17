import Abertura from "@/components/Abertura";
import Areas from "@/components/Areas";
import Secoes from "@/components/Secoes";
import Sobre from "@/components/Sobre";
import Trabalhos from "@/components/Trabalhos";
import { projetos, type Projeto } from "@/data/projetos";

type ComCapa = Projeto & { capa: NonNullable<Projeto["capa"]> };

// Seleção inicial de trabalhos, na ordem em que aparecem. Para trocar, mude esta lista.
// A ordem alterna formatos e áreas de propósito: site, identidade, vídeo, site, identidade, foto.
const selecao = [
  "fisioflow",
  "amazon-vision",
  "video-ellie-e-joel",
  "linksouw",
  "camping-maloca-e-rodas",
  "drone",
];

export default function Inicio() {
  const escolhidos = selecao
    .map((slug) => projetos.find((p) => p.slug === slug))
    .filter((p): p is ComCapa => !!p?.capa);

  return (
    <>
      <Secoes />
      <Abertura />
      <Areas />
      <Trabalhos projetos={escolhidos} total={projetos.length} />
      <Sobre />
    </>
  );
}
