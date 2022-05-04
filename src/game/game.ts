import { updateDebug } from "../debug";
import { Immutable } from "../typings/immutable";
import { ComponentData, LevelData, Transform } from "../typings/level";
import { LevelComponent } from "./level-components/base-component";
import { SingleKey } from "./level-components/single-key";

const BASE_GAME_WIDTH = 20;

export class Game {
  #root: HTMLElement;
  #background: HTMLCanvasElement;
  #backgroundCtx: CanvasRenderingContext2D;
  #time = -1;

  #visibleStartIndex = 0;
  #visibleEndIndex = 0;
  #visibleComponentInstances: LevelComponent[] = [];

  #sortedComponentDataStart: Immutable<ComponentData>[];
  #sortedComponentDataEnd: Immutable<ComponentData>[];

  #cameraTransform: Transform;
  #unit = 100;

  constructor(public level: Immutable<LevelData>, container: HTMLElement) {
    this.#root = document.createElement("capslaw");
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

    // Sorted component data used to make update calls way faster
    this.#sortedComponentDataStart = [...level.components].sort(
      (a, b) => a.time.start - b.time.start
    );
    this.#sortedComponentDataEnd = [...level.components].sort(
      (a, b) => a.time.end - b.time.end
    );

    this.#visibleEndIndex = this.#sortedComponentDataEnd.length;

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

  private createComponent(component: Immutable<ComponentData>) {
    const componentInstance = new SingleKey(component, this.#root);
    this.#visibleComponentInstances.push(componentInstance);
  }

  private updateUnitSize() {
    const { width } = this.#background;
    this.#unit = width / BASE_GAME_WIDTH;
  }

  /** Converts a point on the canvas to a point in the world, using the camera and current unit size. */
  private screenToWorld(x: number, y: number) {
    const { x: cx, y: cy, sx, sy, rz } = this.#cameraTransform;
    const { width, height } = this.#background;
    const unit = this.#unit;

    // Unit scale + center of canvas conversions.
    const wx = (x - width / 2) / unit;
    const wy = (y - height / 2) / unit;

    // Rotate and scale.
    const rx = wx * sx * Math.cos(rz) - wy * sy * Math.sin(rz);
    const ry = wx * sx * Math.sin(rz) + wy * sy * Math.cos(rz);

    // Translate.
    const tx = rx + cx;
    const ty = ry + cy;

    return { x: tx, y: ty };
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

    const extendedWidth =
      (Math.abs(Math.sin(camera.rz)) * (height + 5 * unit)) / 2 + width;

    const extendedHeight =
      (Math.abs(Math.sin(camera.rz)) * (width + 5 * unit)) / 2 + height;

    for (
      let x =
        ((extendedWidth / 2 - camera.x * unit) % unitX) -
        unitX / 2 -
        extendedWidth / 2;
      x < extendedWidth / 2;
      x += unitX
    ) {
      ctx.fillRect(x - 1, -extendedHeight / 2, 2, extendedHeight);
    }
    for (
      let y =
        ((extendedHeight / 2 - camera.y * unit) % unitY) -
        unitY / 2 -
        extendedHeight / 2;
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
    // For moving time around, we need to update the game state by
    //  1. Clear all components that are no longer visible by checking start time
    //  2. Create all components that are now visible by checking end time
    //  3. Properly update .visibleStartIndex
    //  4. Trigger .update() on all components that are visible
    // Note that input handling is not done here, and the direction that time moves
    // impacts how this process is done.

    if (time > this.#time) {
      // 1. (a reverse for loop is used to avoid needing to modify `i`)
      for (let i = this.#visibleComponentInstances.length - 1; i >= 0; i--) {
        const component = this.#visibleComponentInstances[i];

        if (component.definition.time.end < time) {
          component.dispose();
          component.root.remove();
          this.#visibleComponentInstances.splice(i, 1);
          this.#visibleEndIndex--;
        }
      }

      // 2. (done with a for loop to optimize performance)
      if (this.#visibleStartIndex >= 0) {
        for (
          let i = this.#visibleStartIndex;
          i < this.#sortedComponentDataStart.length;
          i++
        ) {
          if (this.#sortedComponentDataStart[i].time.start <= time) {
            const component = this.#sortedComponentDataStart[i];

            // Only add components that have not already ended
            if (component.time.end > time) {
              this.createComponent(component);
            } else {
              this.#visibleEndIndex--;
            }

            // 4. This is now the first component that will become visible
            this.#visibleStartIndex++;
          } else {
            // We can break here because the components are sorted by start time
            break;
          }
        }
      }
    } else {
      // 1. (a reverse for loop is used to avoid needing to modify `i`)
      for (let i = this.#visibleComponentInstances.length - 1; i >= 0; i--) {
        const component = this.#visibleComponentInstances[i];

        if (component.definition.time.start > time) {
          component.dispose();
          component.root.remove();
          this.#visibleComponentInstances.splice(i, 1);

          // 3. Moving this index back one will place it at the right component, even though we
          // don't have that information in this context.
          this.#visibleStartIndex--;
        }
      }

      // 2. (done with a for loop to optimize performance)
      if (this.#visibleEndIndex < this.#sortedComponentDataEnd.length) {
        for (
          let i = this.#visibleEndIndex;
          i < this.#sortedComponentDataEnd.length;
          i++
        ) {
          if (this.#sortedComponentDataEnd[i].time.end >= time) {
            const component = this.#sortedComponentDataEnd[i];

            // Only add components that have not already ended
            if (component.time.start <= time) {
              this.createComponent(component);
            } else {
              this.#visibleStartIndex++;
            }

            // 4.
            this.#visibleEndIndex++;
          } else {
            // We can break here because the components are sorted by end time
            break;
          }
        }
      }
    }

    for (const component of this.#visibleComponentInstances) {
      component.update(time);
    }

    this.#time = time;

    this.drawBackground();
  }
}
