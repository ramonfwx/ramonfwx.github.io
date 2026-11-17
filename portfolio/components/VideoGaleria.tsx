"use client";

import { useEffect, useRef, useState } from "react";
import { Play, X } from "lucide-react";
import type { Video } from "@/data/projetos";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

function idYoutube(url: string) {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m?.[1] ?? "";
}
function inicioYoutube(url: string) {
  const m = url.match(/[?&]t=(\d+)/);
  return m ? Number(m[1]) : 0;
}
function idVimeo(url: string) {
  return url.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1] ?? "";
}

function Reproducao({ video }: { video: Video }) {
  // Instagram: o script oficial transforma o blockquote em player.
  useEffect(() => {
    if (video.provedor !== "instagram") return;
    if (window.instgrm) {
      window.instgrm.Embeds.process();
      return;
    }
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.instagram.com/embed.js";
    document.body.appendChild(s);
  }, [video]);

  if (video.provedor === "youtube")
    return (
      <iframe
        title={video.titulo}
        src={`https://www.youtube-nocookie.com/embed/${idYoutube(video.url)}?rel=0${inicioYoutube(video.url) ? `&start=${inicioYoutube(video.url)}` : ""}`}
        allow="encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        loading="lazy"
        className="aspect-video w-[min(90vw,960px)] bg-black"
      />
    );
  if (video.provedor === "vimeo")
    return (
      <iframe
        title={video.titulo}
        src={`https://player.vimeo.com/video/${idVimeo(video.url)}`}
        allow="picture-in-picture; fullscreen"
        allowFullScreen
        loading="lazy"
        className="aspect-video w-[min(90vw,960px)] bg-black"
      />
    );
  if (video.provedor === "arquivo")
    return (
      <video controls preload="metadata" playsInline poster={video.capa} className="max-h-[82vh] w-[min(90vw,960px)] bg-black">
        <source src={video.url} />
      </video>
    );
  return (
    <blockquote
      className="instagram-media"
      data-instgrm-permalink={video.url}
      data-instgrm-version="14"
      style={{ margin: 0, width: "min(90vw, 480px)", background: "#fff" }}
    />
  );
}

// Lista de vídeos: cada um abre em um modal, sem tocar nada automaticamente.
export default function VideoGaleria({ videos }: { videos: Video[] }) {
  const [aberto, setAberto] = useState<number | null>(null);
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (aberto !== null && !d.open) d.showModal();
    if (aberto === null && d.open) d.close();
  }, [aberto]);

  const atual = aberto !== null ? videos[aberto] : null;

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v, i) => (
          <li key={v.url}>
            {v.capa ? (
              <button
                type="button"
                onClick={() => setAberto(i)}
                aria-label={`Assistir: ${v.titulo}`}
                className="group block w-full text-left"
              >
                <span className="cartao relative block aspect-video bg-fundo-2 group-hover:-translate-y-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={v.capa}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-suave group-hover:scale-[1.04]"
                  />
                  <span className="absolute inset-0 grid place-items-center bg-black/25 transition-colors duration-500 group-hover:bg-black/10">
                    <span className="grid size-14 place-items-center rounded-full bg-texto text-fundo transition-transform duration-500 ease-suave group-hover:scale-110">
                      <Play size={20} aria-hidden="true" className="ml-0.5" />
                    </span>
                  </span>
                </span>
                <span className="mt-3 block text-[15px]">{v.titulo}</span>
              </button>
            ) : (
            <button
              type="button"
              onClick={() => setAberto(i)}
              className="group flex aspect-[4/3] w-full flex-col items-start justify-between border border-borda bg-fundo-2 p-5 text-left transition-colors duration-300 hover:border-destaque"
            >
              <span className="flex size-10 items-center justify-center rounded-full border border-borda bg-fundo transition-colors duration-300 group-hover:border-destaque group-hover:bg-destaque group-hover:text-white">
                <Play size={16} aria-hidden="true" />
              </span>
              <span className="text-[15px]">
                {v.titulo}
                <span className="block text-sm text-texto-2">Assistir</span>
              </span>
            </button>
            )}
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogo}
        aria-label="Reprodução de vídeo"
        onClose={() => setAberto(null)}
        className="m-0 h-dvh max-h-none w-dvw max-w-none bg-transparent p-0"
      >
        {atual && (
          <div
            className="flex h-full w-full items-center justify-center overflow-y-auto p-4"
            onClick={(e) => e.target === e.currentTarget && setAberto(null)}
          >
            <Reproducao video={atual} />
            <button type="button" onClick={() => setAberto(null)} aria-label="Fechar" className="fixed right-4 top-4 p-3 text-white/80 transition-colors hover:text-white">
              <X size={24} />
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}
