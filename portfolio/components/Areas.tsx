"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { areas, type Area } from "@/data/areas";
import { reduzMovimento, scroll } from "@/lib/scroll";
import Linhas from "./Linhas";
import Trilha from "./Trilha";

const ROLAGEM = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";

// Conteúdo de uma área. A anatomia é a mesma para as quatro: rótulo, frase,
// fatos e um link. Cada linha fica numa máscara, para entrar e sair subindo.
function Painel({ a }: { a: Area }) {
  return (
    <div className="flex h-full flex-col">
      <div className="overflow-hidden">
        <p data-it className="rotulo">
          Área {a.numero}
        </p>
      </div>
      <div className="mt-5 overflow-hidden">
        <p data-it className="max-w-[24ch] text-[clamp(1.5rem,2.4vw,2.3rem)] font-light leading-[1.15] tracking-[-0.03em]">
          {a.frase}
        </p>
      </div>
      <ul className="mt-8">
        {a.fatos.map((f) => (
          <li key={f.rotulo + f.valor} className="overflow-hidden border-t border-borda">
            <div data-it className="flex items-baseline justify-between gap-6 py-2.5">
              <span className="rotulo">{f.rotulo}</span>
              <span className="text-right text-[15px]">{f.valor}</span>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6 overflow-hidden">
        <div data-it>
          <Link
            href={a.link.href}
            className="group inline-flex items-center gap-2 border-b border-texto pb-0.5 text-[14px]"
          >
            {a.link.rotulo}
            <span aria-hidden="true" className="inline-block transition-transform duration-500 ease-suave group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
              ↗
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Seção interativa das quatro áreas. No desktop, as áreas se alternam conforme o scroll
// (sem travar a rolagem) e também por clique ou mouse. No celular, viram uma lista que abre uma a uma.
export default function Areas() {
  const [ativo, setAtivo] = useState(0);
  const raiz = useRef<HTMLElement>(null);
  const palco = useRef<HTMLDivElement>(null);
  const gatilho = useRef<ScrollTrigger | null>(null);
  const ultimo = useRef(0);

  const rolarPara = (y: number) => {
    if (scroll.lenis) scroll.lenis.scrollTo(y, { duration: 1.3 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  const ir = (i: number) => {
    ultimo.current = i;
    setAtivo(i);
    const st = gatilho.current;
    if (st) rolarPara(st.start + ((i + 0.5) / areas.length) * (st.end - st.start));
    else if (raiz.current) rolarPara(raiz.current.getBoundingClientRect().top + window.scrollY - 64);
  };

  // O scroll escolhe a área ativa.
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add(ROLAGEM, () => {
      const st = ScrollTrigger.create({
        trigger: raiz.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const i = Math.min(areas.length - 1, Math.floor(self.progress * areas.length));
          if (i !== ultimo.current) {
            ultimo.current = i;
            setAtivo(i);
          }
        },
      });
      gatilho.current = st;
      return () => {
        st.kill();
        gatilho.current = null;
      };
    });
    return () => mm.revert();
  }, []);

  // A primeira tela tem um índice que leva direto a uma área.
  useEffect(() => {
    const aoIr = (e: Event) => ir((e as CustomEvent<number>).detail);
    window.addEventListener("area:ir", aoIr);
    return () => window.removeEventListener("area:ir", aoIr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // O conteúdo troca com um movimento de máscara.
  useEffect(() => {
    const el = palco.current;
    if (!el || reduzMovimento()) return;
    el.querySelectorAll<HTMLElement>("[data-painel]").forEach((p, i) => {
      const itens = p.querySelectorAll("[data-it]");
      if (i === ativo) {
        gsap.set(p, { autoAlpha: 1 });
        gsap.fromTo(itens, { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.05, overwrite: true });
      } else {
        gsap.to(itens, { yPercent: -110, duration: 0.4, ease: "expo.in", overwrite: true });
        gsap.set(p, { autoAlpha: 0, delay: 0.4 });
      }
    });
  }, [ativo]);

  const a = areas[ativo];

  return (
    <section
      ref={raiz}
      id="areas"
      aria-labelledby="titulo-areas"
      className="relative border-t border-borda motion-safe:lg:h-[calc(100svh+165svh)]"
    >
      <div className="px-[var(--pad)] py-16 md:py-32 motion-safe:lg:sticky motion-safe:lg:top-0 motion-safe:lg:flex motion-safe:lg:h-svh motion-safe:lg:flex-col motion-safe:lg:justify-center motion-safe:lg:py-0 motion-safe:lg:pt-20">
        <div className="mx-auto w-full max-w-[1680px]">
          <div className="mb-12 flex items-baseline justify-between gap-6 md:mb-16">
            <h2 id="titulo-areas" className="rotulo !text-texto">
              02 — Quatro áreas
            </h2>
            <Linhas className="hidden max-w-[34ch] text-right text-[15px] leading-snug text-texto-2 md:block">
              Uma só pessoa, com formas diferentes de trabalhar.
            </Linhas>
          </div>

          <div className="grid gap-10 motion-safe:lg:grid-cols-12 motion-safe:lg:gap-8">
            {/* Lista de áreas. */}
            <ul className="motion-safe:lg:col-span-7">
              {areas.map((area, i) => {
                const aberta = ativo === i;
                return (
                  <li key={area.id} className="border-t border-borda last:border-b motion-safe:lg:border-b-0 motion-safe:lg:last:border-b-0">
                    <button
                      type="button"
                      aria-pressed={aberta}
                      onClick={() => ir(i)}
                      onPointerEnter={(e) => {
                        if (e.pointerType === "mouse" && ultimo.current !== i) {
                          ultimo.current = i;
                          setAtivo(i);
                        }
                      }}
                      className="group flex w-full items-baseline gap-5 py-4 text-left md:gap-8 motion-safe:lg:py-2"
                    >
                      <span className={`rotulo w-7 shrink-0 transition-colors duration-500 ${aberta ? "!text-destaque" : ""}`}>
                        {area.numero}
                      </span>
                      <span
                        className={`text-[clamp(2.3rem,6.2vw,6.8rem)] font-light leading-[1] tracking-[-0.05em] transition-[color,transform] duration-500 ease-suave ${
                          aberta ? "translate-x-2 text-texto" : "text-texto-2/45 group-hover:text-texto-2"
                        }`}
                      >
                        {area.titulo}
                      </span>
                    </button>

                    {/* Celular e tablet: o conteúdo abre embaixo do título. */}
                    <div
                      inert={!aberta}
                      className={`grid transition-[grid-template-rows] duration-700 ease-suave motion-safe:lg:hidden ${
                        aberta ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="pb-8 pl-12">
                          <Painel a={area} />
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Desktop: o conteúdo da área ativa fica ao lado. */}
            <div ref={palco} className="relative hidden min-h-[420px] motion-safe:lg:col-span-4 motion-safe:lg:col-start-9 motion-safe:lg:block">
              {areas.map((area, i) => (
                <div
                  key={area.id}
                  data-painel
                  aria-hidden={ativo !== i}
                  inert={ativo !== i}
                  className={`absolute inset-0 ${ativo === i ? "" : "invisible"}`}
                >
                  <Painel a={area} />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 md:mt-16">
            <Trilha key={a.trilha} modo={a.trilha} />
            <div className="mt-3 flex justify-between">
              <span className="rotulo">
                {a.numero} / 0{areas.length}
              </span>
              <span className="rotulo">{a.titulo}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
