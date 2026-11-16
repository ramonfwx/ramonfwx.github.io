"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Imagem } from "@/data/projetos";
import { site } from "@/data/site";

// Galeria de imagens com visualização ampliada (dialog nativo: Esc fecha, foco preso, teclado ok).
export default function Galeria({ imagens }: { imagens: Imagem[] }) {
  const [indice, setIndice] = useState<number | null>(null);
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (indice !== null && !d.open) d.showModal();
    if (indice === null && d.open) d.close();
  }, [indice]);

  const ir = (delta: number) =>
    setIndice((i) => (i === null ? null : (i + delta + imagens.length) % imagens.length));

  const atual = indice !== null ? imagens[indice] : null;

  return (
    <>
      <ul className="columns-1 gap-4 sm:columns-2">
        {imagens.map((img, i) => (
          <li key={img.src} className="mb-4 break-inside-avoid">
            <button
              type="button"
              onClick={() => setIndice(i)}
              aria-label={`Ampliar: ${img.alt}`}
              className="group block w-full cursor-zoom-in overflow-hidden bg-fundo-2"
            >
              <Image
                src={img.src}
                alt={img.alt}
                width={img.largura}
                height={img.altura}
                sizes="(min-width: 640px) 50vw, 100vw"
                loading="lazy"
                className="h-auto w-full transition-transform duration-500 ease-suave group-hover:scale-[1.02]"
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogo}
        aria-label="Imagem ampliada"
        onClose={() => setIndice(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") ir(-1);
          if (e.key === "ArrowRight") ir(1);
        }}
        className="m-0 h-dvh max-h-none w-dvw max-w-none bg-transparent p-0 text-white"
      >
        {atual && (
          <div
            className="flex h-full w-full items-center justify-center p-4 md:p-10"
            onClick={(e) => e.target === e.currentTarget && setIndice(null)}
          >
            <figure className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={atual.src}
                alt={atual.alt}
                className="max-h-[82vh] max-w-[88vw] object-contain"
              />
              <span aria-hidden="true" className="pointer-events-none absolute bottom-3 right-4 text-xs tracking-wide text-white/60">
                {site.nome.toUpperCase()}.
              </span>
              <figcaption className="mt-3 text-center text-sm text-white/70">
                {indice! + 1} de {imagens.length}
              </figcaption>
            </figure>

            <button type="button" onClick={() => setIndice(null)} aria-label="Fechar" className="absolute right-4 top-4 p-3 text-white/80 transition-colors hover:text-white">
              <X size={24} />
            </button>
            {imagens.length > 1 && (
              <>
                <button type="button" onClick={() => ir(-1)} aria-label="Imagem anterior" className="absolute left-2 top-1/2 -translate-y-1/2 p-3 text-white/80 transition-colors hover:text-white md:left-6">
                  <ChevronLeft size={32} />
                </button>
                <button type="button" onClick={() => ir(1)} aria-label="Próxima imagem" className="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-white/80 transition-colors hover:text-white md:right-6">
                  <ChevronRight size={32} />
                </button>
              </>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
