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
        src={`https://www.youtube-nocookie.com/embed/${idYoutube(video.url)}?rel=0`}
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
