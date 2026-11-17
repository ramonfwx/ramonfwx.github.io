"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { site } from "@/data/site";
import { scroll } from "@/lib/scroll";
import Relogio from "./Relogio";

const links = [
  { href: "/projetos", rotulo: "Projetos" },
  { href: "/#sobre", rotulo: "Sobre" },
  { href: "/contato", rotulo: "Contato" },
];

const semBarra = (p: string) => (p.length > 1 ? p.replace(/\/$/, "") : p);

export default function Header() {
  const caminho = semBarra(usePathname());
  // O menu fica ligado à página em que foi aberto: ao navegar, ele se fecha sozinho.
  const [abertoEm, setAbertoEm] = useState<string | null>(null);
  const aberto = abertoEm === caminho;
  // A barra some ao rolar para baixo e volta ao rolar para cima.
  const [visivel, setVisivel] = useState(true);

  useEffect(() => {
    let ultimo = window.scrollY;
    const aoRolar = () => {
      const y = window.scrollY;
      if (y < 80) {
        setVisivel(true);
      } else if (Math.abs(y - ultimo) >= 6) {
        setVisivel(y < ultimo);
      } else {
        return;
      }
      ultimo = y;
    };
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setAbertoEm(null);
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("keydown", aoTeclar);
    return () => {
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("keydown", aoTeclar);
    };
  }, []);

  // Com o menu aberto, a página atrás não rola.
  useEffect(() => {
    if (!aberto) return;
    scroll.lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    return () => {
      scroll.lenis?.start();
      document.documentElement.style.overflow = "";
    };
  }, [aberto]);

  const ativo = (href: string) => caminho === href || caminho.startsWith(href + "/");

  return (
    <>
      <header
        className={`pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3 transition-[transform,opacity] duration-500 ease-suave md:top-4 md:px-[var(--pad)] ${
          visivel || aberto ? "translate-y-0 opacity-100" : "-translate-y-[170%] opacity-0"
        }`}
      >
        <div className="pointer-events-auto flex h-16 w-full max-w-[1680px] items-center justify-between rounded-full border border-white/10 bg-[#17181b]/70 px-5 shadow-[0_10px_40px_rgb(0_0_0/0.4)] backdrop-blur-xl md:px-8">
          <Link
            href="/"
            className="group flex items-center gap-3 text-[24px] font-medium tracking-[-0.02em]"
            aria-label={`${site.nomeCompleto}, início`}
          >
            <span>{site.nome.toUpperCase()}.</span>
          </Link>

          <div className="flex items-center gap-12">
            <Relogio className="hidden lg:inline" />

            <nav aria-label="Principal" className="hidden items-center gap-10 md:flex">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={ativo(l.href) ? "page" : undefined}
                  className={`group relative py-1 text-[20px] tracking-[-0.01em] transition-colors duration-300 ${
                    ativo(l.href) ? "text-texto" : "text-texto-2 hover:text-texto"
                  }`}
                >
                  {l.rotulo}
                  <span
                    aria-hidden="true"
                    className={`absolute -bottom-0.5 left-0 h-px w-full origin-left bg-destaque transition-transform duration-500 ease-suave ${
                      ativo(l.href) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              ))}
            </nav>

            <button
              type="button"
              className="-mr-2 p-2 md:hidden"
              aria-expanded={aberto}
              aria-controls="menu-mobile"
              aria-label={aberto ? "Fechar menu" : "Abrir menu"}
              onClick={() => setAbertoEm(aberto ? null : caminho)}
            >
              {aberto ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      <nav
        id="menu-mobile"
        aria-label="Principal"
        aria-hidden={!aberto}
        data-lenis-prevent
        className={`fixed inset-0 z-40 flex flex-col justify-end bg-fundo px-[clamp(20px,3.2vw,48px)] pb-12 pt-24 transition-opacity duration-500 md:hidden ${
          aberto ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <ul>
          {[{ href: "/", rotulo: "Início" }, ...links].map((l, i) => (
            <li key={l.href} className="overflow-hidden border-t border-borda">
              <Link
                href={l.href}
                tabIndex={aberto ? 0 : -1}
                aria-current={ativo(l.href) || (l.href === "/" && caminho === "/") ? "page" : undefined}
                style={{ transitionDelay: aberto ? `${150 + i * 70}ms` : "0ms" }}
                className={`flex items-baseline justify-between py-5 text-[clamp(2.2rem,11vw,3.5rem)] font-medium tracking-[-0.04em] transition-transform duration-700 ease-suave ${
                  aberto ? "translate-y-0" : "translate-y-full"
                }`}
              >
                {l.rotulo}
                <span className="rotulo">0{i + 1}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Relogio className="mt-8" />
      </nav>
    </>
  );
}
