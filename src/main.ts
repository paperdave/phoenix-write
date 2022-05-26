import './style.css';
import { CapslawGame } from './game/CapslawGame_NoGUI';
import { LevelData } from './types/level';

const levelData: LevelData = {
  components: [
    {
      type: 'single-key',
      transform: {
        x: 0,
        y: 0,
        rz: 0,
        sx: 1,
        sy: 1,
      },
      time: { start: 0, end: 4 },
      data: {
        key: 'A',
        times: [1],
      },
    },
    {
      type: 'single-key',
      transform: {
        x: 0,
        y: 2,
        rz: 0,
        sx: 1,
        sy: 1,
      },
      time: { start: 0, end: 4 },
      data: {
        key: 'B',
        times: [1.2],
      },
    },
  ],
  camera: {
    x: 0,
    y: 0,
    rz: 0,
    sx: 1,
    sy: 1,
  },
};

async function main() {
  const game = new CapslawGame(levelData, document.body);
  (globalThis as any).game = game;
}

main();
