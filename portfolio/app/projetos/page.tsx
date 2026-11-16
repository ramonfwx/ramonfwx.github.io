import type { Metadata } from "next";
import IndiceProjetos from "@/components/IndiceProjetos";
import Linhas from "@/components/Linhas";
import { projetos } from "@/data/projetos";

export const metadata: Metadata = {
  title: "Projetos",
  description: "Projetos de desenvolvimento, design gráfico e audiovisual.",
};

export default function Projetos() {
  return (
    <section aria-labelledby="titulo-projetos" className="coluna pb-28 pt-32 md:pt-44">
      <p className="rotulo mb-6">Índice — {String(projetos.length).padStart(2, "0")} projetos</p>
      <Linhas
        as="h1"
        aoCarregar
        className="max-w-[14ch] text-[clamp(3rem,9vw,9.5rem)] font-medium leading-[0.95] tracking-[-0.055em]"
      >
        Projetos
      </Linhas>
      <p className="mt-6 max-w-xl text-[17px] text-texto-2">
        Desenvolvimento, design gráfico e audiovisual.
      </p>
      <div className="mt-16">
        <IndiceProjetos projetos={projetos} />
      </div>
    </section>
  );
}
