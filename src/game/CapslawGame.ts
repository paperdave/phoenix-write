import { updateDebug } from "../debug";
import { Transform } from "../typings/basic";
import { Immutable } from "../typings/immutable";
import { LevelData } from "../typings/level";
import { OnScreenComponentManager } from "./OnScreenComponentManager";

const BASE_GAME_WIDTH = 20;

export class CapslawGame {
  #root: HTMLElement;

  #onscreenComponents: OnScreenComponentManager;

  #background: HTMLCanvasElement;
  #backgroundCtx: CanvasRenderingContext2D;

  #time = -1;

  #cameraTransform: Transform;
  #unit = 100;

  constructor(readonly level: Immutable<LevelData>, container: HTMLElement) {
    this.#root = document.createElement("capslaw");

    this.#onscreenComponents = new OnScreenComponentManager(level.components, this.#root);

    this.#background = document.createElement("canvas");
    this.#background.classList.add("full-screen");
    this.#backgroundCtx = this.#background.getContext("2d")!;
    this.#root.appendChild(this.#background);

    this.#cameraTransform = {
      x: 0,
      y: 0,
      sx: 1,
      sy: 1,
      rz: 0,
    };

    container.appendChild(this.#root);

    this.#background.width = this.#background.clientWidth;
    this.#background.height = this.#background.clientHeight;

    this.updateUnitSize();

    this.time = 0;

    window.addEventListener("resize", () => {
      this.#background.width = this.#background.clientWidth;
      this.#background.height = this.#background.clientHeight;
      this.updateUnitSize();
      this.drawBackground();
    });
  }

  private updateUnitSize() {
    const { width } = this.#background;
    this.#unit = width / BASE_GAME_WIDTH;
  }

  private drawBackground() {
    const ctx = this.#backgroundCtx;
    const { width, height } = this.#background;
    const camera = this.#cameraTransform;

    if (camera.sx < 0 || camera.sy < 0) return;

    const unit = this.#unit;

    const unitX = unit / camera.sx;
    const unitY = unit / camera.sy;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#555";

    ctx.translate(width / 2, height / 2);
    ctx.rotate(-camera.rz);

    const extendedWidth = (Math.abs(Math.sin(camera.rz)) * (height + 5 * unit)) / 2 + width;

    const extendedHeight = (Math.abs(Math.sin(camera.rz)) * (width + 5 * unit)) / 2 + height;

    for (
      let x = ((extendedWidth / 2 - camera.x * unit) % unitX) - unitX / 2 - extendedWidth / 2;
      x < extendedWidth / 2;
      x += unitX
    ) {
      ctx.fillRect(x - 1, -extendedHeight / 2, 2, extendedHeight);
    }
    for (
      let y = ((extendedHeight / 2 - camera.y * unit) % unitY) - unitY / 2 - extendedHeight / 2;
      y < extendedHeight / 2;
      y += unitY
    ) {
      ctx.fillRect(-extendedWidth / 2, y - 1, extendedWidth, 2);
    }

    ctx.resetTransform();

    updateDebug(`
      camera:
      x: ${camera.x.toFixed(2)}, y: ${camera.y.toFixed(2)}
      scale: ${camera.sx.toFixed(2)}
      angle: ${camera.rz.toFixed(2)}
      unit size: ${this.#unit.toFixed(2)}
    `);
  }

  get time() {
    return this.#time;
  }

  set time(time: number) {
    this.#time = time;
    this.#onscreenComponents.time = time;
    this.drawBackground();
  }
}
