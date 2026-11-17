import Link from "next/link";
import { site } from "@/data/site";
import { contatos } from "@/lib/contatos";
import Contador from "./Contador";
import IconeRede from "./IconeRede";

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
        {contatos.length > 0 && (
          <ul className="flex items-center gap-5" aria-label="Redes e contatos">
            {contatos.map((r) => (
              <li key={r.rotulo}>
                <a
                  href={r.url}
                  {...(r.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  aria-label={r.rotulo}
                  title={r.rotulo}
                  className="block text-texto-2 transition-[color,transform] duration-300 ease-suave hover:-translate-y-0.5 hover:text-texto"
                >
                  <IconeRede rotulo={r.rotulo} tamanho={20} />
                </a>
              </li>
            ))}
          </ul>
        )}
        <Contador />
      </div>
    </footer>
  );
}
