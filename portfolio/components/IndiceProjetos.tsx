"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { categorias, nomeCategoria, type Categoria } from "@/data/categorias";
import type { Projeto } from "@/data/projetos";
import { ponteiroFino, reduzMovimento } from "@/lib/scroll";
import CapaProjeto from "./CapaProjeto";

type Filtro = Categoria | "todos";
const dois = (n: number) => String(n).padStart(2, "0");

// Índice de todos os projetos. Com mouse, passar sobre uma linha mostra a
// imagem do projeto seguindo o cursor. No celular, cada linha traz uma miniatura.
export default function IndiceProjetos({ projetos }: { projetos: Projeto[] }) {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [ativo, setAtivo] = useState<Projeto | null>(null);
  const lista = useRef<HTMLUListElement>(null);
  const previa = useRef<HTMLDivElement>(null);

  const opcoes: { id: Filtro; nome: string }[] = [{ id: "todos", nome: "Todos" }, ...categorias];
  const contar = (id: Filtro) =>
    id === "todos" ? projetos.length : projetos.filter((p) => p.categorias.includes(id)).length;
  const disponiveis = opcoes.filter((o) => contar(o.id) > 0);
  const visiveis = filtro === "todos" ? projetos : projetos.filter((p) => p.categorias.includes(filtro));

  // As linhas entram em sequência ao aparecer na tela.
  useEffect(() => {
    const ul = lista.current;
    if (!ul || reduzMovimento()) return;
    gsap.registerPlugin(ScrollTrigger);
    const linhas = gsap.utils.toArray<HTMLElement>("[data-linha]", ul);
    const ctx = gsap.context(() => {
      gsap.set(linhas, { opacity: 0, y: 40 });
      ScrollTrigger.batch(linhas, {
        start: "top 94%",
        once: true,
        onEnter: (lote) =>
          gsap.to(lote, { opacity: 1, y: 0, duration: 1.1, ease: "expo.out", stagger: 0.07 }),
      });
    }, ul);
    return () => ctx.revert();
  }, [visiveis]);

  // A prévia acompanha o cursor.
  useEffect(() => {
    const el = previa.current;
    if (!el || !ponteiroFino()) return;
    const x = gsap.quickTo(el, "x", { duration: 0.7, ease: "power3.out" });
    const y = gsap.quickTo(el, "y", { duration: 0.7, ease: "power3.out" });
    gsap.set(el, { xPercent: 8, yPercent: -50 });
    const mover = (e: PointerEvent) => {
      x(e.clientX);
      y(e.clientY);
    };
    window.addEventListener("pointermove", mover);
    return () => window.removeEventListener("pointermove", mover);
  }, []);

  return (
    <div>
      <div role="group" aria-label="Filtrar projetos por área" className="flex flex-wrap gap-2">
        {disponiveis.map((o) => {
          const marcado = filtro === o.id;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={marcado}
              onClick={() => setFiltro(o.id)}
              className={`rounded-full border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors duration-300 ${
                marcado
                  ? "border-texto bg-texto text-fundo"
                  : "border-borda text-texto-2 hover:border-texto-2 hover:text-texto"
              }`}
            >
              {o.nome}
              <sup className="ml-1 text-[9px]">{contar(o.id)}</sup>
            </button>
          );
        })}
      </div>

      <ul
        ref={lista}
        className="indice mt-12 border-b border-borda"
        onPointerLeave={() => setAtivo(null)}
      >
        {visiveis.map((p, i) => (
          <li key={p.slug} data-linha>
            <Link
              href={`/projetos/${p.slug}/`}
              onPointerEnter={() => setAtivo(p)}
              onFocus={() => setAtivo(p)}
              onBlur={() => setAtivo(null)}
              className="group grid grid-cols-[2rem_1fr_5rem] items-center gap-x-4 border-t border-borda py-5 md:grid-cols-[4rem_1fr_17rem_5rem] md:py-6"
            >
              <span className="rotulo">{dois(i + 1)}</span>
              <span className="text-[clamp(1.5rem,3.8vw,3.6rem)] font-medium leading-[1.05] tracking-[-0.04em] transition-transform duration-500 ease-suave group-hover:translate-x-3">
                {p.titulo}
              </span>
              <span className="rotulo hidden md:block">
                {p.categorias.map(nomeCategoria).join(" / ")}
              </span>
              <span className="rotulo hidden text-right md:block">{p.ano ?? ""}</span>
              {p.capa && (
                <span className="w-20 justify-self-end md:hidden">
                  <CapaProjeto imagem={p.capa} sizes="80px" className="aspect-[4/3]" />
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      <p aria-live="polite" className="sr-only">
        {visiveis.length} {visiveis.length === 1 ? "projeto exibido" : "projetos exibidos"}.
      </p>

      <div
        ref={previa}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-30 hidden w-[clamp(240px,24vw,380px)] [@media(hover:hover)]:block"
        style={{ opacity: ativo?.capa ? 1 : 0, transition: "opacity .3s" }}
      >
        {ativo?.capa && (
          <div key={ativo.slug} className="[animation:aparecer_.45s_var(--ease-suave)]">
            <CapaProjeto imagem={ativo.capa} sizes="380px" className="aspect-[16/10]" />
          </div>
        )}
      </div>
    </div>
  );
}
