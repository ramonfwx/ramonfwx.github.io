"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { nomeCategoria } from "@/data/categorias";
import type { Projeto } from "@/data/projetos";
import { ponteiroFino } from "@/lib/scroll";
import Linhas from "./Linhas";

type ComCapa = Projeto & { capa: NonNullable<Projeto["capa"]> };
type Formato = "site" | "identidade" | "video" | "foto";

// Cada formato tem a sua moldura, mas todas partilham a mesma altura de referência,
// o mesmo alinhamento e o mesmo ritmo: mídia de um lado, legenda do outro, alternando.
const razao: Record<Formato, number> = { site: 1.6, identidade: 1.33, video: 1.7, foto: 1.5 };

const formatoDe: Record<string, Formato> = {
  fisioflow: "site",
  linksouw: "site",
  "amazon-vision": "identidade",
  "camping-maloca-e-rodas": "identidade",
  "video-ellie-e-joel": "video",
  drone: "foto",
};

const dois = (n: number) => String(n).padStart(2, "0");
const host = (p: Projeto) => {
  try {
    return p.links?.[0] ? new URL(p.links[0].url).host : "";
  } catch {
    return "";
  }
};

function Moldura({ p, formato }: { p: ComCapa; formato: Formato }) {
  // Identidades usam a proporção real da imagem, para ela preencher o card sem bordas.
  const r =
    formato === "identidade"
      ? Math.min(1.8, Math.max(1.2, p.capa.largura / p.capa.altura))
      : razao[formato];
  const estilo = { aspectRatio: String(r), width: `min(100%, calc(var(--h) * ${r}))` };
  const imagem = (
    <Image
      src={p.capa.src}
      alt={p.capa.alt}
      fill
      sizes="(min-width: 1024px) 58vw, 92vw"
      className={formato === "site" ? "object-cover object-top" : "object-cover"}
    />
  );
  // Brilho que acompanha o cursor por cima do card.
  const brilho = (
    <span
      data-brilho
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500"
      style={{
        background:
          "radial-gradient(420px circle at var(--mx,50%) var(--my,30%), rgb(255 255 255 / 0.16), transparent 50%)",
      }}
    />
  );

  if (formato === "site") {
    return (
      <div data-moldura style={estilo} className="cartao flex flex-col bg-fundo-2">
        <div className="flex h-7 shrink-0 items-center gap-1.5 border-b border-white/10 px-3">
          <i className="size-1.5 rounded-full bg-white/20" />
          <i className="size-1.5 rounded-full bg-white/20" />
          <i className="size-1.5 rounded-full bg-white/20" />
          <span className="rotulo ml-3 truncate !text-[10px] !normal-case !tracking-normal">{host(p)}</span>
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div data-img className="absolute -inset-[3%]">
            {imagem}
          </div>
        </div>
        {brilho}
      </div>
    );
  }

  return (
    <div data-moldura style={estilo} className="cartao relative bg-fundo-2">
      <div data-img className="absolute -inset-[4%]">
        {imagem}
      </div>
      {formato === "video" && (
        <>
          <span className="absolute inset-0 grid place-items-center bg-black/20">
            <span className="grid size-14 place-items-center rounded-full bg-texto text-fundo">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true" className="ml-0.5">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
          <span className="rotulo absolute bottom-3 left-3">Vídeo · YouTube</span>
        </>
      )}
      {brilho}
    </div>
  );
}

// Seleção de trabalhos. No desktop, cada trabalho é uma cena de uma tela: a próxima sobe
// e cobre a anterior, que recua e escurece, de modo que só um trabalho tem o foco por vez.
// O cursor inclina a moldura e desloca a imagem dentro dela.
export default function Trabalhos({ projetos, total }: { projetos: ComCapa[]; total: number }) {
  const raiz = useRef<HTMLElement>(null);
  const bolha = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();

    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      const cenas = gsap.utils.toArray<HTMLElement>("[data-cena]", el);

      cenas.forEach((cena, i) => {
        const corpo = cena.querySelector("[data-corpo]");
        const moldura = cena.querySelector("[data-moldura]");
        const legenda = cena.querySelector("[data-legenda]");
        if (!corpo || !moldura || !legenda) return;

        // A moldura se revela enquanto a cena sobe.
        gsap.fromTo(
          moldura,
          { clipPath: "inset(100% 0 0 0)" },
          {
            clipPath: "inset(0% 0 0 0)",
            ease: "none",
            scrollTrigger: { trigger: cena, start: "top 95%", end: "top 30%", scrub: true },
          },
        );
        gsap.from(legenda, {
          opacity: 0,
          y: 40,
          ease: "none",
          scrollTrigger: { trigger: cena, start: "top 80%", end: "top 25%", scrub: true },
        });

        // A cena anterior recua quando a próxima a cobre.
        const proxima = cenas[i + 1];
        if (proxima) {
          gsap.to(corpo, {
            scale: 0.93,
            opacity: 0.22,
            ease: "none",
            scrollTrigger: { trigger: proxima, start: "top bottom", end: "top top", scrub: true },
          });
        }
      });

      // Os cards flutuam devagar, cada um no seu ritmo.
      cenas.forEach((cena, i) => {
        const m = cena.querySelector("[data-moldura]");
        if (m) gsap.to(m, { y: -7, duration: 3.2 + i * 0.25, ease: "sine.inOut", yoyo: true, repeat: -1 });
      });

      // Reação ao cursor: o card inclina, a imagem e a legenda se deslocam em sentidos opostos.
      if (!ponteiroFino()) return;
      const limpar: (() => void)[] = [];
      cenas.forEach((cena) => {
        const moldura = cena.querySelector<HTMLElement>("[data-moldura]");
        const imagem = cena.querySelector<HTMLElement>("[data-img]");
        const legenda = cena.querySelector<HTMLElement>("[data-legenda]");
        if (!moldura || !imagem || !legenda) return;
        const brilhoEl = moldura.querySelector<HTMLElement>("[data-brilho]");
        gsap.set(moldura, { transformPerspective: 1100 });
        const rx = gsap.quickTo(moldura, "rotationX", { duration: 0.9, ease: "power3.out" });
        const ry = gsap.quickTo(moldura, "rotationY", { duration: 0.9, ease: "power3.out" });
        const ix = gsap.quickTo(imagem, "x", { duration: 1, ease: "power3.out" });
        const iy = gsap.quickTo(imagem, "y", { duration: 1, ease: "power3.out" });
        const lx = gsap.quickTo(legenda, "x", { duration: 1.1, ease: "power3.out" });
        const mover = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          ry(nx * 5);
          rx(-ny * 4);
          ix(-nx * 26);
          iy(-ny * 18);
          lx(nx * 10);
          const r = moldura.getBoundingClientRect();
          moldura.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
          moldura.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
          brilhoEl?.style.setProperty("opacity", "1");
        };
        const sair = () => {
          rx(0);
          ry(0);
          ix(0);
          iy(0);
          lx(0);
          brilhoEl?.style.setProperty("opacity", "0");
        };
        cena.addEventListener("pointermove", mover);
        cena.addEventListener("pointerleave", sair);
        limpar.push(() => {
          cena.removeEventListener("pointermove", mover);
          cena.removeEventListener("pointerleave", sair);
        });
      });
      return () => limpar.forEach((f) => f());
    });

    return () => mm.revert();
  }, []);

  // Círculo "Ver" sobre as molduras.
  useEffect(() => {
    const el = raiz.current;
    const b = bolha.current;
    if (!el || !b || !ponteiroFino()) return;
    const x = gsap.quickTo(b, "x", { duration: 0.5, ease: "power3.out" });
    const y = gsap.quickTo(b, "y", { duration: 0.5, ease: "power3.out" });
    const escala = gsap.quickTo(b, "scale", { duration: 0.4, ease: "power3.out" });
    gsap.set(b, { scale: 0, xPercent: -50, yPercent: -50 });
    const mover = (e: PointerEvent) => {
      x(e.clientX);
      y(e.clientY);
      escala((e.target as Element).closest("[data-alvo]") ? 1 : 0);
    };
    const sair = () => escala(0);
    el.addEventListener("pointermove", mover);
    el.addEventListener("pointerleave", sair);
    return () => {
      el.removeEventListener("pointermove", mover);
      el.removeEventListener("pointerleave", sair);
    };
  }, []);

  return (
    <section ref={raiz} id="trabalhos" aria-labelledby="titulo-trabalhos" className="relative">
      <h2 id="titulo-trabalhos" className="sr-only">
        Trabalhos selecionados
      </h2>

      <p className="rotulo flex justify-between px-[var(--pad)] pb-3 pt-10 lg:hidden">
        <span className="!text-texto">03 — Trabalhos</span>
        <span>Deslize →</span>
      </p>

      {/* Celular: carrossel horizontal com encaixe. Desktop: cenas empilhadas em tela cheia. */}
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-pl-[var(--pad)] px-[var(--pad)] pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:block lg:snap-none lg:overflow-visible lg:p-0">
        {projetos.map((p, i) => {
          const formato = formatoDe[p.slug] ?? "foto";
          const direita = i % 2 === 1;
          return (
            <article
              key={p.slug}
              data-cena
              className="relative w-[80vw] max-w-[340px] shrink-0 snap-start rounded-2xl border border-borda bg-fundo-2/50 lg:w-auto lg:max-w-none lg:rounded-none lg:border-x-0 lg:border-b-0 lg:bg-fundo motion-safe:lg:sticky motion-safe:lg:top-0 motion-safe:lg:h-svh"
            >
              <div
                data-corpo
                className="[--h:60vw] lg:[--h:min(58svh,34vw)] flex h-full flex-col justify-start p-3 will-change-transform lg:justify-center lg:px-[var(--pad)] lg:py-12 motion-safe:lg:pt-24"
              >
                <div className="absolute inset-x-[var(--pad)] top-24 hidden items-center justify-between motion-safe:lg:flex">
                  <span className="rotulo !text-texto">03 — Trabalhos</span>
                  <span className="rotulo">
                    {dois(i + 1)} / {dois(projetos.length)}
                  </span>
                </div>

                <div className="mx-auto grid w-full max-w-[1680px] items-end gap-4 lg:grid-cols-12 lg:gap-6">
                  <Link
                    href={`/projetos/${p.slug}/`}
                    data-alvo
                    aria-label={`${p.titulo}, ver projeto`}
                    className={`block max-lg:flex max-lg:h-[58vw] max-lg:items-center max-lg:justify-center lg:col-span-7 ${direita ? "lg:col-start-6 lg:justify-self-end" : "lg:col-start-1 lg:justify-self-start"}`}
                    style={{ width: "100%" }}
                  >
                    <Moldura p={p} formato={formato} />
                  </Link>

                  <div
                    data-legenda
                    className={`lg:col-span-4 ${direita ? "lg:col-start-1 lg:row-start-1" : "lg:col-start-9"}`}
                  >
                    <p className="rotulo">
                      {dois(i + 1)} — {p.categorias.map(nomeCategoria).join(" / ")}
                    </p>
                    <Linhas
                      as="h3"
                      className="mt-2 text-[clamp(1.6rem,3.8vw,3.9rem)] font-light leading-[1.02] tracking-[-0.045em]"
                    >
                      {p.titulo}
                    </Linhas>
                    <p className="mt-3 max-w-[36ch] text-[14px] leading-relaxed text-texto-2 lg:mt-5 lg:text-[15px]">{p.resumo}</p>
                    {p.tecnologias && p.tecnologias.length > 0 && (
                      <p className="rotulo mt-3 lg:mt-5">{p.tecnologias.slice(0, 4).join(" · ")}</p>
                    )}
                    <Link
                      href={`/projetos/${p.slug}/`}
                      className="group mt-4 inline-flex items-center gap-2 border-b border-texto pb-0.5 text-[14px] lg:mt-7"
                    >
                      Ver projeto
                      <span aria-hidden="true" className="inline-block transition-transform duration-500 ease-suave group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                        ↗
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="relative border-t border-borda bg-fundo px-[var(--pad)] py-8 lg:py-14">
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-6">
          <p className="rotulo">
            {dois(projetos.length)} de {total} projetos
          </p>
          <Link href="/projetos" className="group inline-flex items-center gap-3 text-[clamp(1.4rem,2.4vw,2.2rem)] font-light tracking-[-0.03em]">
            Ver todos os projetos
            <span aria-hidden="true" className="inline-block transition-transform duration-500 ease-suave group-hover:-translate-y-1 group-hover:translate-x-1">
              ↗
            </span>
          </Link>
        </div>
      </div>

      <div
        ref={bolha}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-30 hidden size-24 place-items-center rounded-full bg-texto font-mono text-[11px] uppercase tracking-[0.12em] text-fundo [@media(hover:hover)]:grid"
      >
        Ver
      </div>
    </section>
  );
}
