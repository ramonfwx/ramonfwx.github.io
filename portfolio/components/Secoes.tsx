"use client";

import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scroll } from "@/lib/scroll";

const secoes = [
  { id: "abertura", rotulo: "Abertura" },
  { id: "areas", rotulo: "Áreas" },
  { id: "trabalhos", rotulo: "Trabalhos" },
  { id: "sobre", rotulo: "Sobre" },
];

// Marcador fixo na lateral: quatro pontos que mostram em que parte da página você está
// e levam a cada uma. O nome aparece ao passar o mouse. Dá continuidade entre as seções.
export default function Secoes() {
  const [ativa, setAtiva] = useState(0);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const gatilhos = secoes.map((s, i) =>
      ScrollTrigger.create({
        trigger: `#${s.id}`,
        start: "top 55%",
        end: "bottom 55%",
        onToggle: (self) => self.isActive && setAtiva(i),
      }),
    );
    return () => gatilhos.forEach((g) => g.kill());
  }, []);

  const ir = (id: string) => {
    const alvo = document.getElementById(id);
    if (!alvo) return;
    const y = alvo.getBoundingClientRect().top + window.scrollY;
    if (scroll.lenis) scroll.lenis.scrollTo(y, { duration: 1.3 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <nav aria-label="Seções da página" className="fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 lg:block">
      <ul className="relative flex flex-col gap-6">
        <span aria-hidden="true" className="absolute bottom-2 left-1/2 top-2 w-px -translate-x-1/2 bg-borda" />
        {secoes.map((s, i) => (
          <li key={s.id} className="relative flex justify-center">
            <button
              type="button"
              onClick={() => ir(s.id)}
              aria-label={s.rotulo}
              aria-current={ativa === i ? "true" : undefined}
              className="group relative grid size-4 place-items-center"
            >
              <span
                aria-hidden="true"
                className={`rounded-full transition-all duration-500 ease-suave ${
                  ativa === i ? "size-[7px] bg-destaque" : "size-[5px] bg-texto-2/60 group-hover:bg-texto"
                }`}
              />
              <span
                aria-hidden="true"
                className="rotulo pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 translate-x-2 whitespace-nowrap rounded-full border border-borda bg-fundo/90 px-3 py-1 opacity-0 backdrop-blur transition-[opacity,transform] duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
              >
                {s.rotulo}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
