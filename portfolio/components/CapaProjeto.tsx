import Image from "next/image";
import type { Imagem } from "@/data/projetos";

// Moldura única para as capas, para que projetos de segmentos diferentes
// tenham a mesma apresentação. Imagens retrato (como quadros de reels) aparecem
// inteiras sobre um fundo desfocado, em vez de serem cortadas ou esticadas.
// A moldura toma o tamanho do pai: dê a ela uma proporção (ex.: aspect-[16/10]).
export default function CapaProjeto({
  imagem,
  sizes,
  priority = false,
  className = "",
}: {
  imagem: Imagem;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const retrato = imagem.altura > imagem.largura;
  return (
    <div className={`relative overflow-hidden bg-fundo-2 ${className}`}>
      {/* A camada interna é maior que a moldura: é ela que corre no efeito de profundidade. */}
      <div data-img className="absolute inset-x-0 -inset-y-[7%]">
        {retrato ? (
          <>
            <Image
              src={imagem.src}
              alt=""
              fill
              sizes="20vw"
              aria-hidden="true"
              className="scale-125 object-cover opacity-45 blur-2xl"
            />
            <Image
              src={imagem.src}
              alt={imagem.alt}
              fill
              sizes={sizes}
              priority={priority}
              className="object-contain p-[7%]"
            />
          </>
        ) : (
          <Image
            src={imagem.src}
            alt={imagem.alt}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover"
          />
        )}
      </div>
    </div>
  );
}
