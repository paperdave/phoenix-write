import { Immutable } from "../types/immutable";
import { ComponentData } from "../types/level";
import { ComponentLogic } from "./ComponentLogic";

type ExtractLogicData<T> = T extends ComponentLogic<infer U> ? U : never;

export abstract class ComponentDisplay<
  Logic extends ComponentLogic,
  Data = ExtractLogicData<Logic>
> {
  root: HTMLElement;
  logic!: Logic;

  constructor(readonly definition: Immutable<ComponentData>, container: HTMLElement) {
    this.root = document.createElement("level-component");
    this.root.setAttribute("type", this.definition.type);

    container.appendChild(this.root);
  }

  abstract init(data: Immutable<Data>): void;
  abstract update(time: number): void;
  abstract dispose(): void;
}
