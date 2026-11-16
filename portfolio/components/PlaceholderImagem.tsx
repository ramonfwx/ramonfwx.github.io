// Espaço reservado e fácil de substituir. Não finge ser uma foto real.
export default function PlaceholderImagem({
  legenda,
  className = "",
}: {
  legenda: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={legenda}
      className={`flex h-full w-full items-end bg-fundo-2 p-5 ${className}`}
    >
      <p className="max-w-[28ch] text-sm leading-snug text-texto-2">{legenda}</p>
    </div>
  );
}
