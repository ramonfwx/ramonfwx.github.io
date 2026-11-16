// Coordena a animação de abertura com o restante da página:
// os elementos da primeira dobra só começam a animar depois que ela termina.

declare global {
  interface Window {
    __introFeita?: boolean;
  }
}

export function depoisDaIntro(fn: () => void) {
  if (window.__introFeita) {
    fn();
    return () => {};
  }
  window.addEventListener("intro:fim", fn, { once: true });
  return () => window.removeEventListener("intro:fim", fn);
}

export function introFeita() {
  window.__introFeita = true;
  document.documentElement.removeAttribute("data-intro");
  window.dispatchEvent(new Event("intro:fim"));
}
