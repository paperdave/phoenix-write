import { Immutable } from "../types/immutable";
import { ComponentData } from "../types/level";

export abstract class ComponentLogic<T = unknown> {
  constructor(readonly definition: Immutable<ComponentData>) {
    throw new Error("Not implemented");
  }

  abstract init(data: Immutable<T>): void;
  abstract dispose(): void;
}
