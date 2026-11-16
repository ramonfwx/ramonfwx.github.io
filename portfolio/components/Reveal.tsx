"use client";

import { motion } from "motion/react";

const ease = [0.22, 1, 0.36, 1] as const;

type Props = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  /** Anima ao carregar, em vez de esperar o scroll. Use no topo da página. */
  aoCarregar?: boolean;
};

export default function Reveal({ children, delay = 0, className, aoCarregar }: Props) {
  const entrada = { opacity: 0, y: 16 };
  const saida = { opacity: 1, y: 0 };
  const transicao = { duration: 0.7, ease, delay };

  if (aoCarregar) {
    return (
      <motion.div className={className} initial={entrada} animate={saida} transition={transicao}>
        {children}
      </motion.div>
    );
  }
  return (
    <motion.div
      className={className}
      initial={entrada}
      whileInView={saida}
      viewport={{ once: true, margin: "-80px" }}
      transition={transicao}
    >
      {children}
    </motion.div>
  );
}
