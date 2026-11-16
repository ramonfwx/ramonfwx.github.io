import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Galeria from "@/components/Galeria";
import PlaceholderImagem from "@/components/PlaceholderImagem";
import Reveal from "@/components/Reveal";
import VideoGaleria from "@/components/VideoGaleria";
import { nomeCategoria } from "@/data/categorias";
import {
  buscarProjeto,
  projetos,
  proximoProjeto,
  type Imagem,
  type Video,
} from "@/data/projetos";

export const dynamicParams = false;

export function generateStaticParams() {
  return projetos.map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = buscarProjeto(slug);
  if (!p) return {};
  return {
    title: p.titulo,
    description: p.resumo,
    openGraph: p.capa ? { images: [p.capa.src] } : undefined,
  };
}

function Secao({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 border-t border-borda py-8 md:grid-cols-12 md:gap-8">
      <h2 className="text-sm text-texto-2 md:col-span-3">{rotulo}</h2>
      <div className="md:col-span-7 md:col-start-5">{children}</div>
    </div>
  );
}

export default async function PaginaProjeto({ params }: Props) {
  const { slug } = await params;
  const projeto = buscarProjeto(slug);
  if (!projeto) notFound();

  const imagens = projeto.galeria.filter((m): m is Imagem => m.tipo === "imagem");
  const videos = projeto.galeria.filter((m): m is Video => m.tipo === "video");
  const principal = projeto.capa ?? imagens[0];
  const restantes = imagens.filter((i) => i.src !== principal?.src);
  const proximo = proximoProjeto(slug);

  return (
    <article className="coluna pb-28 pt-32 md:pt-40">
      <Link href="/projetos" className="text-sm text-texto-2 transition-colors hover:text-texto">
        ← Projetos
      </Link>

      <Reveal aoCarregar>
        <header className="mt-8 grid gap-6 md:grid-cols-12 md:gap-8">
          <h1 className="text-[clamp(2.2rem,4.6vw,3.6rem)] font-medium leading-[1.05] tracking-[-0.035em] md:col-span-7">
            {projeto.titulo}
          </h1>
          <p className="text-[15px] text-texto-2 md:col-span-4 md:col-start-9 md:pt-3">
            {projeto.categorias.map(nomeCategoria).join(" / ")}
            {projeto.ano && <span> · {projeto.ano}</span>}
          </p>
        </header>
        <p className="mt-6 max-w-2xl text-lg text-texto-2">{projeto.resumo}</p>
      </Reveal>

      <Reveal delay={0.1} className="mt-12">
        {principal ? (
          <Image
            src={principal.src}
            alt={principal.alt}
            width={principal.largura}
            height={principal.altura}
            priority
            sizes="(min-width: 1320px) 1224px, 100vw"
            className="h-auto w-full border border-borda"
          />
        ) : (
          <div className="aspect-[16/9] border border-borda">
            <PlaceholderImagem legenda="Imagem principal em breve. Adicione capturas de tela ou fotos em public/images/projetos/ e referencie em data/projetos.ts." />
          </div>
        )}
      </Reveal>

      <div className="mt-16">
        {projeto.contexto && <Secao rotulo="Contexto e objetivo"><p className="text-lg">{projeto.contexto}</p></Secao>}
        {projeto.participacao && <Secao rotulo="Minha participação"><p className="text-lg">{projeto.participacao}</p></Secao>}
        {projeto.processo && <Secao rotulo="Processo e solução"><p className="text-lg">{projeto.processo}</p></Secao>}
        {projeto.funcionalidades && (
          <Secao rotulo="Principais funcionalidades">
            <ul className="space-y-2 text-lg">
              {projeto.funcionalidades.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </Secao>
        )}
        {projeto.tecnologias && (
          <Secao rotulo="Tecnologias">
            <p className="text-lg">{projeto.tecnologias.join(", ")}</p>
          </Secao>
        )}
        {projeto.links && (
          <Secao rotulo="Links">
            <ul className="flex flex-wrap gap-x-8 gap-y-3 text-lg">
              {projeto.links.map((l) => (
                <li key={l.url}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-b border-texto pb-0.5 transition-colors duration-200 hover:border-destaque hover:text-destaque"
                  >
                    {l.rotulo} ↗
                  </a>
                </li>
              ))}
            </ul>
          </Secao>
        )}
        <div className="border-t border-borda" />
      </div>

      {videos.length > 0 && (
        <section aria-label="Vídeos" className="mt-16">
          <VideoGaleria videos={videos} />
        </section>
      )}

      {restantes.length > 0 && (
        <section aria-label="Galeria de imagens" className="mt-16">
          <Galeria imagens={restantes} />
        </section>
      )}

      <nav aria-label="Próximo projeto" className="mt-28 border-t border-borda pt-8">
        <p className="text-sm text-texto-2">Próximo projeto</p>
        <Link
          href={`/projetos/${proximo.slug}`}
          className="group mt-2 inline-flex items-baseline gap-3 text-[clamp(1.6rem,3vw,2.4rem)] font-medium tracking-[-0.03em]"
        >
          {proximo.titulo}
          <span aria-hidden="true" className="transition-transform duration-300 ease-suave group-hover:translate-x-1">
            ↗
          </span>
        </Link>
      </nav>
    </article>
  );
}
