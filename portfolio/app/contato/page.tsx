import type { Metadata } from "next";
import FormularioContato from "@/components/FormularioContato";
import Reveal from "@/components/Reveal";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Contato",
  description: "Entre em contato com Ramon Lima para projetos, ideias e parcerias.",
};

export default function Contato() {
  return (
    <section aria-labelledby="titulo-contato" className="coluna grid gap-14 pb-32 pt-32 md:grid-cols-12 md:pt-44">
      <Reveal aoCarregar className="md:col-span-5">
        <h1 id="titulo-contato" className="text-[clamp(2.4rem,5vw,4.2rem)] font-medium leading-[1.04] tracking-[-0.035em]">
          Vamos conversar?
        </h1>
        <p className="mt-6 max-w-sm text-lg text-texto-2">
          Tem uma ideia, projeto ou parceria em mente? Vamos trocar uma conversa.
        </p>
        {site.redes.github && (
          <p className="mt-8 text-[15px]">
            <a
              href={site.redes.github}
              target="_blank"
              rel="noopener noreferrer"
              className="border-b border-texto pb-0.5 transition-colors duration-200 hover:border-destaque hover:text-destaque"
            >
              GitHub ↗
            </a>
          </p>
        )}
      </Reveal>

      <Reveal aoCarregar delay={0.12} className="md:col-span-6 md:col-start-7">
        <FormularioContato />
      </Reveal>
    </section>
  );
}
