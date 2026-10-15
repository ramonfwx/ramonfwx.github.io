import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import roteiro from './roteiro.json';
import duracoes from './duracoes.json';
import {Cena} from './Cena';

export const FPS = 30;
export const PAUSA_INICIAL = 0.4; // segundos de respiro antes da fala
export const PAUSA_FINAL = 0.8; // segundos de respiro depois da fala
export const TRANSICAO = 12; // frames de fade entre cenas

export const duracaoCena = (id: string) =>
  Math.ceil(((duracoes as Record<string, number>)[id] + PAUSA_INICIAL + PAUSA_FINAL) * FPS);

export const Apresentacao: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#07060f'}}>
    <TransitionSeries>
      {roteiro.cenas.flatMap((cena, i) => {
        const itens = [
          <TransitionSeries.Sequence key={cena.id} durationInFrames={duracaoCena(cena.id)}>
            <Cena cena={cena} indice={i} />
            <Sequence from={Math.round(PAUSA_INICIAL * FPS)}>
              <Audio src={staticFile(`audio/portfolio/${cena.id}.wav`)} />
            </Sequence>
          </TransitionSeries.Sequence>,
        ];
        if (i < roteiro.cenas.length - 1) {
          itens.push(
            <TransitionSeries.Transition
              key={`t-${cena.id}`}
              presentation={fade()}
              timing={linearTiming({durationInFrames: TRANSICAO})}
            />,
          );
        }
        return itens;
      })}
    </TransitionSeries>
  </AbsoluteFill>
);
