import { getAnimationValue } from "./game/animation";
import { CapslawGame } from "./game/CapslawGame";
import "./style.css";
import { KeyedAnimation } from "./typings/animation";
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
  camera: {
    x: 0,
    y: 0,
    rz: 0,
    sx: 1,
    sy: 1,
  },
};

async function main() {}

main();
