"use client";

import { useLayoutEffect, useRef, type ElementType } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { depoisDaIntro } from "@/lib/intro";
import { reduzMovimento } from "@/lib/scroll";

type Props = {
  children: string;
  as?: ElementType;
  id?: string;
  className?: string;
  /** Espera a abertura terminar em vez de esperar o scroll. */
  aoCarregar?: boolean;
  delay?: number;
  stagger?: number;
};

// Revela o texto linha por linha, cada linha subindo de dentro de uma máscara.
export default function Linhas({
  children,
  as: Tag = "div",
  id,
  className,
  aoCarregar = false,
  delay = 0,
  stagger = 0.09,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduzMovimento()) return;
    gsap.registerPlugin(ScrollTrigger, SplitText);
    gsap.set(el, { autoAlpha: 0 });

    let cancelar = () => {};
    const ctx = gsap.context(() => {
      const iniciar = () => {
        SplitText.create(el, {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit(self) {
            gsap.set(el, { autoAlpha: 1 });
            return gsap.from(self.lines, {
              yPercent: 112,
              duration: 1.15,
              ease: "expo.out",
              stagger,
              delay,
              scrollTrigger: aoCarregar
                ? undefined
                : { trigger: el, start: "top 90%", once: true },
            });
          },
        });
      };
      if (aoCarregar) cancelar = depoisDaIntro(iniciar);
      else iniciar();
    }, el);

    return () => {
      cancelar();
      ctx.revert();
      gsap.set(el, { clearProps: "visibility,opacity" });
    };
  }, [aoCarregar, delay, stagger]);

  return (
    <Tag ref={ref} id={id} className={className}>
      {children}
    </Tag>
  );
}
