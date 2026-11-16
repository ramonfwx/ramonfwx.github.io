"use client";

import { useSyncExternalStore } from "react";

const formato = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Belem",
});

const assinar = (aviso: () => void) => {
  const id = setInterval(aviso, 15_000);
  return () => clearInterval(id);
};
const agora = () => formato.format(new Date());

// Hora local do Pará. Fica vazia no servidor para não gerar diferença na hidratação.
export default function Relogio({ className = "" }: { className?: string }) {
  const hora = useSyncExternalStore(assinar, agora, () => "");
  return (
    <span className={`rotulo ${className}`} aria-label={hora ? `Hora no Pará: ${hora}` : undefined}>
      Pará, BR {hora && <span className="text-texto">{hora}</span>}
    </span>
  );
}
