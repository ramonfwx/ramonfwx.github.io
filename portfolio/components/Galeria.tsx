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

  // Paralaxe do card: a imagem se desloca dentro dele, em sentido oposto ao cursor.
  const inclinar = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--mx", `${(nx + 0.5) * 100}%`);
    el.style.setProperty("--my", `${(ny + 0.5) * 100}%`);
    const img = el.querySelector<HTMLElement>("[data-i]");
    if (img) img.style.transform = `translate(${-nx * 18}px, ${-ny * 14}px)`;
  };
  const desinclinar = (e: React.PointerEvent<HTMLButtonElement>) => {
    const img = e.currentTarget.querySelector<HTMLElement>("[data-i]");
    if (img) img.style.transform = "";
  };

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-3">
        {imagens.map((img, i) => (
          <li key={img.src}>
            <button
              type="button"
              onClick={() => setIndice(i)}
              onPointerMove={inclinar}
              onPointerLeave={desinclinar}
              aria-label={`Ampliar: ${img.alt}`}
              className="cartao group relative block aspect-[4/3] w-full cursor-zoom-in bg-fundo-2 hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgb(255_255_255/0.14),0_44px_80px_-28px_rgb(0_0_0/0.9)] md:aspect-[16/10]"
            >
              <span data-i className="absolute -inset-[5%] transition-transform duration-300 ease-out will-change-transform">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  loading="lazy"
                  className="object-cover"
                />
              </span>
              <span
                data-b
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: "radial-gradient(300px circle at var(--mx,50%) var(--my,30%), rgb(255 255 255 / 0.15), transparent 55%)" }}
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
