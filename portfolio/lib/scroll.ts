import type Lenis from "lenis";

// Instância única da rolagem suave, compartilhada entre os componentes.
export const scroll: { lenis: Lenis | null } = { lenis: null };

export const reduzMovimento = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const ponteiroFino = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;
