"use client";

import { useState } from "react";
import { site } from "@/data/site";

type Estado = "parado" | "enviando" | "ok" | "erro";

const campo =
  "w-full border-0 border-b border-borda bg-transparent py-3 text-lg outline-none transition-colors duration-200 focus:border-destaque";

export default function FormularioContato() {
  const [estado, setEstado] = useState<Estado>("parado");

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setEstado("enviando");
    try {
      const r = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const dados = await r.json();
      if (dados.success) {
        form.reset();
        setEstado("ok");
      } else setEstado("erro");
    } catch {
      setEstado("erro");
    }
  }

  return (
    <form onSubmit={enviar} className="grid gap-8">
      <input type="hidden" name="access_key" value={site.formularioChave} />
      <input type="hidden" name="subject" value="Novo contato pelo portfólio" />
      <input type="checkbox" name="botcheck" className="hidden" tabIndex={-1} autoComplete="off" />

      <label className="grid gap-1 text-sm text-texto-2">
        Seu nome
        <input name="nome" type="text" required autoComplete="name" className={campo} />
      </label>
      <label className="grid gap-1 text-sm text-texto-2">
        Seu e-mail
        <input name="email" type="email" required autoComplete="email" className={campo} />
      </label>
      <label className="grid gap-1 text-sm text-texto-2">
        Sobre o que vamos conversar
        <textarea name="mensagem" required rows={5} className={`${campo} resize-y`} />
      </label>

      <div>
        <button
          type="submit"
          disabled={estado === "enviando"}
          className="rounded-full bg-destaque px-7 py-3 text-[15px] text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {estado === "enviando" ? "Enviando..." : "Enviar mensagem ↗"}
        </button>
        <p role="status" aria-live="polite" className="mt-4 min-h-6 text-[15px] text-texto-2">
          {estado === "ok" && "Mensagem enviada. Eu respondo por e-mail."}
          {estado === "erro" && "Não foi possível enviar. Tente de novo em instantes."}
        </p>
      </div>
    </form>
  );
}
