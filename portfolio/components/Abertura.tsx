"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { areas } from "@/data/areas";
import { depoisDaIntro } from "@/lib/intro";
import { ponteiroFino, reduzMovimento } from "@/lib/scroll";
import Aneis from "./Aneis";
import Linhas from "./Linhas";

import Trilha from "./Trilha";

const nome = "Ramon Lima";

// Primeira tela. Composição em diagonal: o nome em cima à esquerda, o fio no meio,
// a frase embaixo à esquerda e o índice das quatro áreas embaixo à direita.
// As letras do nome ganham peso perto do cursor; o marcador do fio segue o mouse.
export default function Abertura() {
  const raiz = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const secao = raiz.current;
    if (!secao || reduzMovimento()) return;

    const letras = gsap.utils.toArray<HTMLElement>("[data-letra]", secao);
    const linhas = gsap.utils.toArray<HTMLElement>("[data-linha]", secao);
    const extras = gsap.utils.toArray<HTMLElement>("[data-extra]", secao);
    gsap.set(letras, { yPercent: 112 });
    gsap.set(linhas, { opacity: 0, y: 18 });
    gsap.set(extras, { opacity: 0 });

    let cancelar = () => {};
    const ctx = gsap.context(() => {
      cancelar = depoisDaIntro(() => {
        gsap.to(letras, { yPercent: 0, duration: 1.3, ease: "expo.out", stagger: 0.045, delay: 0.2 });
        gsap.to(linhas, { opacity: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.08, delay: 0.55 });
        gsap.to(extras, { opacity: 1, duration: 1, ease: "power2.out", delay: 0.9 });
      });

      // Tipografia que responde ao cursor: o peso das letras sobe com a proximidade.
      if (ponteiroFino()) {
        const peso = letras.map((el) => gsap.quickTo(el, "fontWeight", { duration: 0.6, ease: "power3.out" }));
        const mover = (e: PointerEvent) => {
          letras.forEach((el, i) => {
            const r = el.getBoundingClientRect();
            const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
            peso[i](300 + 330 * Math.pow(Math.max(0, 1 - d / 340), 1.6));
          });
        };
        const sair = () => peso.forEach((p) => p(300));
        secao.addEventListener("pointermove", mover);
        secao.addEventListener("pointerleave", sair);
        return () => {
          secao.removeEventListener("pointermove", mover);
          secao.removeEventListener("pointerleave", sair);
        };
      }
    }, secao);

    return () => {
      cancelar();
      ctx.revert();
      gsap.set([...letras, ...linhas, ...extras], { clearProps: "all" });
    };
  }, []);

  const irParaArea = (i: number) => window.dispatchEvent(new CustomEvent("area:ir", { detail: i }));

  return (
    <section
      ref={raiz}
      id="abertura"
      aria-labelledby="titulo-abertura"
      className="relative h-svh min-h-[640px] overflow-hidden px-[var(--pad)]"
    >
      {/* No espaço livre ao lado do nome: anéis orbitais, que inclinam com o cursor. */}
      <div data-extra className="absolute left-[var(--pad)] right-[var(--pad)] top-20 h-[19%] md:left-[56%] md:top-24 md:h-[calc(62%-7rem)]">
        <Aneis className="h-full w-full" />
      </div>

      {/* Acima do fio: o nome. */}
      <div className="absolute inset-x-[var(--pad)] top-[48%] md:top-[62%] -translate-y-full pb-8 md:pb-10">
        <p data-extra className="rotulo mb-5">
          Fisioterapeuta · Programador · Designer · Editor de vídeo
        </p>
        <h1
          id="titulo-abertura"
          aria-label="Ramon Lima"
          className="text-[clamp(3rem,9.2vw,11rem)] font-light leading-[0.95] tracking-[-0.05em]"
        >
          <span aria-hidden="true" className="block overflow-hidden whitespace-nowrap pb-[0.1em]">
            {nome.split("").map((c, i) => (
              <span key={i} data-letra className="inline-block" style={{ fontWeight: 300 }}>
                {c === " " ? "\u00A0" : c}
              </span>
            ))}
          </span>
        </h1>
      </div>

      {/* O fio. */}
      <div className="absolute inset-x-[var(--pad)] top-[48%] md:top-[62%] -translate-y-1/2">
        <Trilha modo="cursor" />
      </div>

      {/* Abaixo do fio: a frase e o índice das áreas. */}
      <div className="absolute inset-x-[var(--pad)] top-[48%] md:top-[62%] grid gap-10 pt-9 md:grid-cols-12 md:pt-12">
        <Linhas
          aoCarregar
          delay={0.5}
          className="max-w-[16ch] text-[clamp(1.5rem,2.6vw,2.6rem)] font-light leading-[1.12] tracking-[-0.03em] md:col-span-5"
        >
          Entre tecnologia, imagem e movimento.
        </Linhas>

        <nav aria-label="Áreas de atuação" className="md:col-span-4 md:col-start-9">
          <ul>
            {areas.map((a, i) => (
              <li key={a.id} data-linha>
                <a
                  href="#areas"
                  onClick={() => irParaArea(i)}
                  className="group flex items-baseline gap-5 border-t border-borda py-2.5 transition-colors duration-300 hover:border-texto-2"
                >
                  <span className="rotulo w-6 transition-colors duration-300 group-hover:!text-destaque">{a.numero}</span>
                  <span className="text-[clamp(1.05rem,1.35vw,1.3rem)] font-light tracking-[-0.01em] text-texto-2 transition-[color,transform] duration-500 ease-suave group-hover:translate-x-2 group-hover:text-texto">
                    {a.titulo}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div data-extra className="absolute inset-x-[var(--pad)] bottom-7 hidden items-end md:flex justify-between">
        <span className="rotulo">Portfólio</span>
        <span className="rotulo hidden sm:block">Role para explorar</span>
        <span className="rotulo">01 / 04</span>
      </div>
    </section>
  );
}
