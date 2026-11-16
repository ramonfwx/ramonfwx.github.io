"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { introFeita } from "@/lib/intro";
import { reduzMovimento, scroll } from "@/lib/scroll";

const CHAVE = "intro-vista";

// Abertura curta. A logo sobe de uma máscara, um fio se desenha com o contador e a
// cortina se levanta por cima dele. O fio é o mesmo da primeira tela, na mesma altura:
// quando a cortina passa, ele continua lá. Aparece uma vez por sessão.
export default function Intro() {
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = raiz.current;
    if (!el) return;

    let vista = false;
    try {
      vista = sessionStorage.getItem(CHAVE) === "1";
    } catch {}

    if (vista || reduzMovimento()) {
      el.style.display = "none";
      introFeita();
      return;
    }

    document.documentElement.dataset.intro = "1";
    scroll.lenis?.stop();

    const ctx = gsap.context(() => {
      const contador = el.querySelector("[data-contador]");
      const numero = { v: 0 };
      const tl = gsap.timeline({
        onComplete: () => {
          try {
            sessionStorage.setItem(CHAVE, "1");
          } catch {}
          el.style.display = "none";
        },
      });

      tl.from("[data-apoio]", { opacity: 0, y: 8, duration: 0.8, ease: "power3.out" }, 0.3)
        .fromTo("[data-fio]", { scaleX: 0 }, { scaleX: 1, duration: 1.5, ease: "power2.inOut" }, 0.1)
        .to(
          numero,
          {
            v: 100,
            duration: 1.5,
            ease: "power2.inOut",
            onUpdate: () => {
              if (contador) contador.textContent = String(Math.round(numero.v)).padStart(3, "0");
            },
          },
          0.1,
        )
        .call(
          () => {
            introFeita();
            scroll.lenis?.start();
          },
          undefined,
          1.8,
        )
        .to(el, { clipPath: "inset(0 0 100% 0)", duration: 1, ease: "expo.inOut" }, 1.65);
    }, el);

    return () => {
      ctx.revert();
      document.documentElement.removeAttribute("data-intro");
    };
  }, []);

  return (
    <div
      ref={raiz}
      aria-hidden="true"
      className="intro fixed inset-0 z-[100] bg-fundo px-[var(--pad)]"
    >
      <div className="absolute inset-x-[var(--pad)] top-[48svh] md:top-[62svh] -translate-y-full pb-6">
        <div className="flex items-end justify-end">
          <span data-contador className="rotulo !text-texto">
            000
          </span>
        </div>
      </div>

      <div className="absolute inset-x-[var(--pad)] top-[48svh] md:top-[62svh] h-px bg-borda">
        <div data-fio className="h-full origin-left bg-texto" />
      </div>

      <p data-apoio className="rotulo absolute inset-x-[var(--pad)] top-[48svh] md:top-[62svh] pt-5">
        Ramon Lima — Portfólio
      </p>
    </div>
  );
}
