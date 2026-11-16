"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { reduzMovimento, scroll } from "@/lib/scroll";

gsap.registerPlugin(ScrollTrigger, SplitText);

// Rolagem suave (Lenis) sincronizada com o ScrollTrigger.
// Com "reduzir movimento" ativo, mantém a rolagem nativa.
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    if (reduzMovimento()) return;

    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9 });
    scroll.lenis = lenis;
    if (document.documentElement.dataset.intro) lenis.stop();

    lenis.on("scroll", ScrollTrigger.update);
    const passo = (tempo: number) => lenis.raf(tempo * 1000);
    gsap.ticker.add(passo);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(passo);
      lenis.destroy();
      scroll.lenis = null;
    };
  }, []);

  return <>{children}</>;
}
