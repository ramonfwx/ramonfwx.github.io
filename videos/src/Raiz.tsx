import {Composition} from 'remotion';
import {Apresentacao, FPS, duracaoCena} from './portfolio/Apresentacao';
import roteiro from './portfolio/roteiro.json';
import {Teste, duracaoTotalTeste, FPS as FPS_TESTE} from './teste/Teste';

export const Raiz: React.FC = () => {
  const total = roteiro.cenas.reduce((soma, c) => soma + duracaoCena(c.id), 0);
  return (
    <>
      <Composition id="Apresentacao" component={Apresentacao} durationInFrames={total} fps={FPS} width={1920} height={1080} />
      <Composition id="Teste" component={Teste} durationInFrames={duracaoTotalTeste()} fps={FPS_TESTE} width={1080} height={1920} />
    </>
  );
};
