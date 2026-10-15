import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';
import roteiro from './roteiro.json';
import duracoes from './duracoes.json';

export const FPS = 30;
const PAUSA_INICIAL = 0.3;
const PAUSA_FINAL = 0.9;
const TRANSICAO = 14;

const CREME = '#f4efe6';
const TINTA = '#1b1612';
const TERRACOTA = '#d9623b';
const SANS = '"Segoe UI Black", "Segoe UI", system-ui, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
const MONO = '"IBM Plex Mono", Consolas, monospace';

type CenaT = {
  id: string;
  visual: string;
  etiqueta: string;
  linhas: string[];
  fala: string;
  sub?: string;
  digitando?: string;
};

const cenas = roteiro.cenas as CenaT[];

const duracaoCena = (id: string) =>
  Math.ceil(((duracoes as Record<string, number>)[id] + PAUSA_INICIAL + PAUSA_FINAL) * FPS);

export const duracaoTotalTeste = () =>
  cenas.reduce((s, c) => s + duracaoCena(c.id), 0) - (cenas.length - 1) * TRANSICAO;

export const Teste: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: CREME}}>
    <TransitionSeries>
      {cenas.flatMap((cena, i) => {
        const itens = [
          <TransitionSeries.Sequence key={cena.id} durationInFrames={duracaoCena(cena.id)}>
            <Cena cena={cena} />
            <Sequence from={Math.round(PAUSA_INICIAL * FPS)}>
              <Audio src={staticFile(`audio/teste/${cena.id}.wav`)} />
            </Sequence>
          </TransitionSeries.Sequence>,
        ];
        if (i < cenas.length - 1) {
          itens.push(
            <TransitionSeries.Transition
              key={`t-${cena.id}`}
              presentation={slide({direction: 'from-bottom'})}
              timing={linearTiming({durationInFrames: TRANSICAO})}
            />,
          );
        }
        return itens;
      })}
    </TransitionSeries>
  </AbsoluteFill>
);

// "Você escreve a *ideia*" -> palavras entrando uma a uma; a marcada com * fica em terracota
const Linha: React.FC<{texto: string; inicio: number}> = ({texto, inicio}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div>
      {texto.split(' ').map((p, i) => {
        const destaque = p.startsWith('*');
        const limpa = p.replace(/\*/g, '');
        const t = spring({frame: frame - inicio - i * 5, fps, config: {damping: 14, stiffness: 140}});
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              marginRight: 26,
              color: destaque ? TERRACOTA : TINTA,
              fontStyle: destaque ? 'italic' : 'normal',
              fontFamily: destaque ? SERIF : SANS,
              fontWeight: destaque ? 400 : 800,
              opacity: interpolate(t, [0, 1], [0, 1], {extrapolateRight: 'clamp'}),
              transform: `translateY(${interpolate(t, [0, 1], [70, 0])}px) scale(${interpolate(t, [0, 1], [0.9, 1])})`,
            }}
          >
            {limpa}
          </span>
        );
      })}
    </div>
  );
};

const Estrela: React.FC<{tamanho: number; giro?: number}> = ({tamanho, giro = 0}) => (
  <svg width={tamanho} height={tamanho} viewBox="-50 -50 100 100" style={{transform: `rotate(${giro}deg)`}}>
    {Array.from({length: 16}, (_, i) => (
      <rect key={i} x="-2.5" y="-46" width="5" height={i % 2 ? 18 : 30} rx="2.5" fill={TERRACOTA} transform={`rotate(${i * 22.5})`} />
    ))}
  </svg>
);

const Pilula: React.FC<{texto: string}> = ({texto}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = spring({frame: frame - 4, fps, config: {damping: 200}});
  return (
    <div
      style={{
        display: 'inline-block',
        fontFamily: MONO,
        fontSize: 34,
        letterSpacing: 5,
        border: `3px solid ${TINTA}`,
        borderRadius: 60,
        padding: '14px 40px',
        opacity: t,
        transform: `scale(${interpolate(t, [0, 1], [0.8, 1])})`,
      }}
    >
      {texto}
    </div>
  );
};

const Cena: React.FC<{cena: CenaT}> = ({cena}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  return (
    <AbsoluteFill style={{background: CREME, color: TINTA}}>
      {/* pontinhos de fundo, bem sutis, deslizando */}
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${TINTA}22 2px, transparent 2px)`,
          backgroundSize: '54px 54px',
          backgroundPosition: `0px ${frame * 0.5}px`,
        }}
      />
      <div style={{position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center'}}>
        <Pilula texto={cena.etiqueta} />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 330,
          left: 80,
          right: 80,
          textAlign: 'center',
          fontSize: 150,
          lineHeight: 1.08,
          letterSpacing: -3,
        }}
      >
        {cena.linhas.map((l, i) => (
          <Linha key={i} texto={l} inicio={8 + i * 9} />
        ))}
        {cena.sub && (
          <div
            style={{
              fontFamily: SERIF,
              fontStyle: 'italic',
              fontSize: 76,
              letterSpacing: 0,
              marginTop: 34,
              color: TERRACOTA,
              opacity: interpolate(frame, [34, 52], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
            }}
          >
            {cena.sub}
          </div>
        )}
      </div>

      <div style={{position: 'absolute', left: 80, right: 80, top: 1000, height: 640}}>
        <Visual cena={cena} fps={fps} duracao={durationInFrames} />
      </div>

      <div style={{position: 'absolute', bottom: 90, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <Estrela tamanho={70} giro={frame * 1.2} />
      </div>
    </AbsoluteFill>
  );
};

const Visual: React.FC<{cena: CenaT; fps: number; duracao: number}> = ({cena, fps, duracao}) => {
  const frame = useCurrentFrame();
  const entra = spring({frame: frame - 20, fps, config: {damping: 200}});
  const sobe = interpolate(entra, [0, 1], [80, 0]);

  if (cena.visual === 'capa' || cena.visual === 'final') {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          opacity: entra,
          transform: `translateY(${sobe}px)`,
        }}
      >
        <Estrela tamanho={cena.visual === 'capa' ? 440 : 360} giro={frame * 0.8} />
      </div>
    );
  }

  const cartao: React.CSSProperties = {
    position: 'relative',
    height: '100%',
    background: 'white',
    border: `3px solid ${TINTA}`,
    borderRadius: 36,
    boxShadow: `14px 14px 0 ${TINTA}`,
    padding: 48,
    opacity: entra,
    transform: `translateY(${sobe}px)`,
    boxSizing: 'border-box',
    overflow: 'hidden',
  };

  if (cena.visual === 'caixa') {
    const texto = cena.digitando ?? '';
    const n = Math.floor(
      interpolate(frame, [30, 30 + texto.length * 1.6], [0, texto.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    );
    const cursor = Math.floor(frame / 15) % 2 === 0;
    return (
      <div style={cartao}>
        <div style={{fontFamily: MONO, fontSize: 30, color: '#8a8178', marginBottom: 30}}>Peça uma animação…</div>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 56, lineHeight: 1.3}}>
          {texto.slice(0, n)}
          <span
            style={{
              display: 'inline-block',
              width: 6,
              height: 60,
              background: TERRACOTA,
              marginLeft: 4,
              verticalAlign: 'middle',
              opacity: cursor ? 1 : 0,
            }}
          />
        </div>
      </div>
    );
  }

  if (cena.visual === 'codigo') {
    const linhas = [
      '<Sequence from={0}>',
      '  <Titulo texto="Do 0 ao motion" />',
      '</Sequence>',
      'const t = spring({frame, fps});',
      'opacity: t,',
      'translateY: interpolate(t, [0,1], [70,0])',
    ];
    return (
      <div style={{...cartao, background: TINTA, color: CREME, fontFamily: MONO, fontSize: 34, lineHeight: 1.7}}>
        {linhas.map((l, i) => {
          const ini = 26 + i * 16;
          const n = Math.floor(interpolate(frame, [ini, ini + 14], [0, l.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
          return (
            <div key={i} style={{whiteSpace: 'pre', color: i >= 4 ? '#ffb18f' : CREME}}>
              {l.slice(0, n) || ' '}
            </div>
          );
        })}
      </div>
    );
  }

  // linha do tempo com playhead
  const progresso = interpolate(frame, [24, duracao - 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const largura = 920 - 96;
  const clipes = [
    {x: 0, w: 0.34, cor: TERRACOTA},
    {x: 0.36, w: 0.26, cor: TINTA},
    {x: 0.64, w: 0.36, cor: '#e9a37f'},
  ];
  return (
    <div style={cartao}>
      <div style={{fontFamily: MONO, fontSize: 30, color: '#8a8178', marginBottom: 36}}>
        quadro {String(Math.round(progresso * 150)).padStart(3, '0')} / 150
      </div>
      {[0, 1, 2].map((faixa) => (
        <div key={faixa} style={{position: 'relative', height: 110, marginBottom: 24, background: CREME, borderRadius: 18}}>
          {clipes.map((c, k) => {
            const t = spring({frame: frame - 30 - faixa * 8 - k * 6, fps, config: {damping: 200}});
            return (
              <div
                key={k}
                style={{
                  position: 'absolute',
                  top: 10,
                  bottom: 10,
                  left: c.x * (largura - 40) + (faixa % 2) * 30,
                  width: c.w * (largura - 40) * t * 0.85,
                  background: c.cor,
                  borderRadius: 12,
                }}
              />
            );
          })}
        </div>
      ))}
      <div style={{position: 'absolute', top: 100, bottom: 30, left: 48 + progresso * largura, width: 6, background: TERRACOTA, borderRadius: 3}} />
    </div>
  );
};
