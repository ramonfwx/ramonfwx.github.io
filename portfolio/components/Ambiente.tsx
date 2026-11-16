"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ponteiroFino, reduzMovimento } from "@/lib/scroll";

// Uma luz muito suave acompanha o cursor por toda a página, dando profundidade
// ao fundo escuro. Só existe com mouse.
export default function Ambiente() {
  const luz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = luz.current;
    if (!el || !ponteiroFino() || reduzMovimento()) return;
    gsap.set(el, { xPercent: -50, yPercent: -50, x: window.innerWidth / 2, y: window.innerHeight / 3, opacity: 1 });
    const x = gsap.quickTo(el, "x", { duration: 1.2, ease: "power3.out" });
    const y = gsap.quickTo(el, "y", { duration: 1.2, ease: "power3.out" });
    const mover = (e: PointerEvent) => {
      x(e.clientX);
      y(e.clientY);
    };
    window.addEventListener("pointermove", mover);
    return () => window.removeEventListener("pointermove", mover);
  }, []);

  return (
    <div
      ref={luz}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[1] size-[640px] opacity-0"
      style={{ background: "radial-gradient(circle, rgb(242 242 240 / 0.055), transparent 62%)" }}
    />
  );
}
