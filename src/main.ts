import { CapslawGame } from "./game/CapslawGame";
import { levelComponentRegistry } from "./game/level-components";
import "./style.css";
import { LevelData } from "./types/level";

console.log(levelComponentRegistry);

const levelData: LevelData = {
  components: [
    {
      type: "single-key",
      transform: {
        x: 0,
        y: 0,
        rz: 0,
        sx: 1,
        sy: 1,
      },
      time: { start: 0, end: 4 },
      data: {
        key: "A",
        time: 1,
      },
    },
    {
      type: "single-key",
      transform: {
        x: 0,
        y: 0,
        rz: 0,
        sx: 1,
        sy: 1,
      },
      time: { start: 0.5, end: 4 },
      data: {
        key: "B",
        time: 1.2,
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
