import type { Metadata } from "next";
import FormularioContato from "@/components/FormularioContato";
import Reveal from "@/components/Reveal";
import IconeRede from "@/components/IconeRede";
import { contatos } from "@/lib/contatos";

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
        {contatos.length > 0 && (
          <ul className="mt-8 space-y-3 text-[15px]">
            {contatos.map((c) => (
              <li key={c.rotulo}>
                <a
                  href={c.url}
                  {...(c.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group inline-flex items-center gap-3 text-texto-2 transition-colors duration-300 hover:text-texto"
                >
                  <IconeRede rotulo={c.rotulo} />
                  {c.rotulo}
                  <span aria-hidden="true" className="text-xs">↗</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </Reveal>

      <Reveal aoCarregar delay={0.12} className="md:col-span-6 md:col-start-7">
        <FormularioContato />
      </Reveal>
    </section>
  );
}
