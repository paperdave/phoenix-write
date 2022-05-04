import { Immutable } from "../../typings/immutable";
import { ComponentData } from "../../typings/level";

export abstract class LevelComponent<T = unknown> {
  root: HTMLElement;

  constructor(
    readonly definition: Immutable<ComponentData>,
    container: HTMLElement
  ) {
    this.root = document.createElement("level-component");
    this.root.setAttribute("type", this.definition.type);

    this.root.innerText = JSON.stringify(this.definition);

    container.appendChild(this.root);
  }

  abstract init(data: Immutable<T>): void;
  abstract update(time: number): void;
  abstract dispose(): void;
}
