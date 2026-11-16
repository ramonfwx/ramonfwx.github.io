"use client";

import { useEffect, useState } from "react";

// Contador simples de acessos (serviço gratuito Abacus). Se falhar, não mostra nada.
export default function Contador() {
  const [total, setTotal] = useState<string | null>(null);

  useEffect(() => {
    fetch("https://abacus.jasoncameron.dev/hit/ramonlima-portfolio/visits")
      .then((r) => r.json())
      .then((d) => setTotal(typeof d.value === "number" ? String(d.value).padStart(4, "0") : null))
      .catch(() => setTotal(null));
  }, []);

  if (!total) return null;
  return <p className="rotulo">Acessos {total}</p>;
}
