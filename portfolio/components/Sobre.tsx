"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { site } from "@/data/site";
import { sobre } from "@/data/sobre";
import { contatos } from "@/lib/contatos";
import { reduzMovimento } from "@/lib/scroll";
import Linhas from "./Linhas";
import Magnetico from "./Magnetico";
import PlaceholderImagem from "./PlaceholderImagem";
import Trilha from "./Trilha";

// Sobre mim e contato, numa só seção. Fecha a página com o mesmo fio da abertura.
export default function Sobre() {
  const moldura = useRef<HTMLDivElement>(null);
  const imagem = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const m = moldura.current;
    const i = imagem.current;
    if (!m || !i || reduzMovimento()) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        m,
        { clipPath: "inset(100% 0 0 0)" },
        {
          clipPath: "inset(0% 0 0 0)",
          ease: "none",
          scrollTrigger: { trigger: m, start: "top 92%", end: "top 45%", scrub: true },
        },
      );
      gsap.fromTo(
        i,
        { yPercent: -6 },
        { yPercent: 6, ease: "none", scrollTrigger: { trigger: m, start: "top bottom", end: "bottom top", scrub: true } },
      );
    }, m);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="sobre"
      aria-labelledby="titulo-sobre"
      className="relative border-t border-borda bg-fundo px-[var(--pad)] pt-20 md:pt-32"
    >
      <div className="mx-auto max-w-[1680px]">
        <h2 id="titulo-sobre" className="rotulo !text-texto">
          04 — Sobre mim
        </h2>

        <div className="mt-10 grid gap-10 md:grid-cols-12 md:gap-8">
          <div ref={moldura} className="relative aspect-[5/4] overflow-hidden bg-fundo-2 md:col-span-4 md:aspect-[4/5]">
            <div ref={imagem} className="absolute inset-x-0 -inset-y-[7%]">
              {site.fotoSobre ? (
                <Image
                  src={site.fotoSobre}
                  alt={`Retrato de ${site.nomeCompleto}`}
                  fill
                  sizes="(min-width: 768px) 32vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <PlaceholderImagem
                  className="!pb-[14%]"
                  legenda="Espaço reservado para a sua foto profissional. Salve em public/images/ramon.jpg e informe o caminho em data/site.ts."
                />
              )}
            </div>
          </div>

          <div className="md:col-span-7 md:col-start-6">
            <Linhas className="text-[clamp(1.5rem,2.7vw,2.6rem)] font-light leading-[1.18] tracking-[-0.03em]">
              {sobre.introducao[0]}
            </Linhas>
            <p className="mt-8 max-w-[52ch] text-[17px] leading-relaxed text-texto-2">{sobre.introducao[1]}</p>
          </div>
        </div>

        {/* Contato. */}
        <div className="mt-20 border-t border-borda pt-12 md:mt-40 md:pt-20">
          <div className="grid gap-12 md:grid-cols-12 md:items-end md:gap-8">
            <div className="md:col-span-6">
              <Linhas
                as="h3"
                className="text-[clamp(2.2rem,5vw,5rem)] font-light leading-[1] tracking-[-0.05em]"
              >
                Vamos conversar?
              </Linhas>
            </div>

            <ul className="md:col-span-3 md:col-start-8">
              {contatos.map((c) => (
                <li key={c.rotulo} className="border-t border-borda first:border-t-0">
                  <a
                    href={c.url}
                    {...(c.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="group flex items-baseline justify-between gap-4 py-2 text-[15px] text-texto-2 transition-colors duration-300 hover:text-texto"
                  >
                    {c.rotulo}
                    <span aria-hidden="true" className="inline-block text-xs transition-transform duration-500 ease-suave group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="md:col-span-2 md:text-right">
              <Magnetico forca={0.3} className="-m-6 p-6">
                <Link
                  href="/contato"
                  className="inline-flex items-center rounded-full bg-destaque px-7 py-3.5 text-[15px] font-medium text-white transition-transform duration-500 ease-suave hover:scale-[1.04]"
                >
                  Escrever ↗
                </Link>
              </Magnetico>
            </div>
          </div>
        </div>

        <div className="mt-24 pb-10 md:mt-32">
          <Trilha modo="cursor" />
        </div>
      </div>
    </section>
  );
}
