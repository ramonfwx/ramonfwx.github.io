import Link from "next/link";

export default function NaoEncontrada() {
  return (
    <section className="coluna py-32">
      <h1 className="text-[clamp(2.2rem,4.6vw,3.6rem)] font-medium tracking-[-0.035em]">Página não encontrada.</h1>
      <p className="mt-4 text-lg text-texto-2">O endereço pode ter mudado ou não existe.</p>
      <Link href="/" className="mt-8 inline-block border-b border-texto pb-0.5 transition-colors hover:border-destaque hover:text-destaque">
        Voltar ao início ↗
      </Link>
    </section>
  );
}
