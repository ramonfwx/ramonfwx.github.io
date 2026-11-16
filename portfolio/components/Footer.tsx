import Link from "next/link";
import { site } from "@/data/site";
import Contador from "./Contador";

const navegacao = [
  { href: "/", rotulo: "Início" },
  { href: "/projetos", rotulo: "Projetos" },
  { href: "/#sobre", rotulo: "Sobre" },
  { href: "/contato", rotulo: "Contato" },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-borda px-[clamp(20px,3.2vw,48px)]">
      <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-x-8 gap-y-4 py-8">
        <p className="rotulo">
          © {new Date().getFullYear()} {site.nomeCompleto}
        </p>
        <nav aria-label="Rodapé">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
            {navegacao.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="text-texto-2 transition-colors duration-300 hover:text-texto">
                  {n.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Contador />
      </div>
    </footer>
  );
}
