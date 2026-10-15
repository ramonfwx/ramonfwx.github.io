import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

type Props = {
  cena: {id: string; etiqueta: string; titulo: string; legenda: string; cor: string};
  indice: number;
};

const FONTE = '"Space Grotesk", "Segoe UI", system-ui, sans-serif';

// Estrelas determinísticas (sem Math.random, para o render ser sempre igual)
const estrelas = Array.from({length: 70}, (_, i) => ({
  x: (i * 977) % 1920,
  y: (i * 613) % 1080,
  r: 1 + (i % 3),
  v: 0.15 + (i % 5) * 0.08,
}));

export const Cena: React.FC<Props> = ({cena, indice}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const entrada = spring({frame, fps, config: {damping: 200}});
  const tituloY = interpolate(entrada, [0, 1], [60, 0]);
  const palavras = cena.legenda.split(' ');
  const saida = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
  });

  // O "orbe" da cena gira e pulsa
  const gira = frame * 0.6 + indice * 40;
  const pulso = 1 + Math.sin(frame / 12) * 0.04;

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONTE,
        color: 'white',
        background: `radial-gradient(1200px 800px at 75% 50%, ${cena.cor}33, #07060f 70%)`,
      }}
    >
      {estrelas.map((e, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: e.x,
            top: (e.y - frame * e.v * 3 + 1080 * 10) % 1080,
            width: e.r * 2,
            height: e.r * 2,
            borderRadius: '50%',
            background: 'white',
            opacity: 0.25 + 0.5 * Math.abs(Math.sin((frame + i * 9) / 25)),
          }}
        />
      ))}

      {/* Orbe animado à direita */}
      <svg
        viewBox="-250 -250 500 500"
        style={{position: 'absolute', right: 140, top: 190, width: 700, height: 700}}
      >
        <g transform={`scale(${pulso * interpolate(entrada, [0, 1], [0.6, 1])})`} opacity={entrada}>
          <circle r="90" fill={cena.cor} opacity="0.9" />
          {[120, 170, 220].map((raio, k) => (
            <g key={raio} transform={`rotate(${gira * (k % 2 ? -1 : 1) * (1 - k * 0.25)})`}>
              <circle r={raio} fill="none" stroke={cena.cor} strokeOpacity={0.5 - k * 0.1} strokeWidth="2" strokeDasharray="6 14" />
              <circle cx={raio} r={10 - k * 2} fill="white" />
            </g>
          ))}
        </g>
      </svg>

      <div style={{position: 'absolute', left: 150, top: 330, width: 1000, opacity: saida}}>
        <div
          style={{
            fontFamily: '"IBM Plex Mono", Consolas, monospace',
            letterSpacing: 6,
            fontSize: 28,
            color: cena.cor,
            opacity: entrada,
          }}
        >
          {cena.etiqueta}
        </div>
        <div
          style={{
            fontSize: 140,
            fontWeight: 700,
            lineHeight: 1.05,
            margin: '24px 0 40px',
            transform: `translateY(${tituloY}px)`,
            opacity: entrada,
          }}
        >
          {cena.titulo}
        </div>
        <div style={{fontSize: 44, lineHeight: 1.35, color: '#d7d3ee'}}>
          {palavras.map((p, i) => {
            const t = spring({frame: frame - 14 - i * 4, fps, config: {damping: 200}});
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  marginRight: 14,
                  opacity: t,
                  transform: `translateY(${interpolate(t, [0, 1], [20, 0])}px)`,
                }}
              >
                {p}
              </span>
            );
          })}
        </div>
      </div>

      {/* Barra de progresso do vídeo na base */}
      <div
        style={{
          position: 'absolute',
          left: 150,
          bottom: 80,
          height: 6,
          width: interpolate(frame, [0, durationInFrames], [0, 1620]),
          background: cena.cor,
          borderRadius: 3,
          opacity: 0.8,
        }}
      />
    </AbsoluteFill>
  );
};
