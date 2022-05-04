import { CapslawGame } from "./game/CapslawGame";
import "./style.css";
import { LevelData } from "./typings/level";

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
};

async function main() {
  const game = new CapslawGame(levelData, document.body);
  globalThis.game = game;
}

main();
