"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { ModoTrilha } from "@/data/areas";
import { ponteiroFino, reduzMovimento } from "@/lib/scroll";

// O fio visual do site: uma linha fina com régua e um marcador azul.
// Aparece na abertura, nas áreas e no contato. O marcador muda de andamento
// conforme o contexto (segue o cursor, respira, anda em passos, faz curva, reproduz).
export default function Trilha({ modo, className = "" }: { modo: ModoTrilha; className?: string }) {
  const raiz = useRef<HTMLDivElement>(null);
  const marca = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = raiz.current;
    const m = marca.current;
    if (modo !== "cursor" || !el || !m || !ponteiroFino() || reduzMovimento()) return;
    const x = gsap.quickTo(m, "left", { duration: 0.9, ease: "power3.out" });
    const mover = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      x(gsap.utils.clamp(0, r.width, e.clientX - r.left));
    };
    window.addEventListener("pointermove", mover);
    return () => window.removeEventListener("pointermove", mover);
  }, [modo]);

  return (
    <div ref={raiz} aria-hidden="true" className={`relative h-6 w-full ${className}`}>
      <div className="trilha-regua absolute inset-x-0 top-1/2" />
      <div className="absolute inset-x-0 top-1/2 h-px bg-borda" />
      <div ref={marca} className={`trilha-marca trilha-${modo} absolute top-1/2`} />
    </div>
  );
}
