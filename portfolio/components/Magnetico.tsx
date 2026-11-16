"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ponteiroFino, reduzMovimento } from "@/lib/scroll";

// Efeito magnético discreto: o elemento acompanha o cursor por perto.
// Só atua com mouse; em telas de toque não faz nada.
export default function Magnetico({
  children,
  forca = 0.3,
  className = "",
}: {
  children: React.ReactNode;
  forca?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !ponteiroFino() || reduzMovimento()) return;

    const x = gsap.quickTo(el, "x", { duration: 0.7, ease: "power3.out" });
    const y = gsap.quickTo(el, "y", { duration: 0.7, ease: "power3.out" });
    let cx = 0;
    let cy = 0;

    const entrar = () => {
      const r = el.getBoundingClientRect();
      cx = r.left + r.width / 2 - Number(gsap.getProperty(el, "x"));
      cy = r.top + r.height / 2 - Number(gsap.getProperty(el, "y"));
    };
    const mover = (e: PointerEvent) => {
      x((e.clientX - cx) * forca);
      y((e.clientY - cy) * forca);
    };
    const sair = () => {
      x(0);
      y(0);
    };

    el.addEventListener("pointerenter", entrar);
    el.addEventListener("pointermove", mover);
    el.addEventListener("pointerleave", sair);
    return () => {
      el.removeEventListener("pointerenter", entrar);
      el.removeEventListener("pointermove", mover);
      el.removeEventListener("pointerleave", sair);
      gsap.set(el, { clearProps: "transform" });
    };
  }, [forca]);

  return (
    <span ref={ref} className={`inline-block ${className}`}>
      {children}
    </span>
  );
}
