import { Immutable } from "../../typings/immutable";
import { LevelComponent } from "./base-component";

export interface SingleKeyData {
  key: string;
  time: number;
}

export class SingleKey extends LevelComponent<SingleKeyData> {
  init(data: Immutable<SingleKeyData>) {
    //
  }

  update(time: number): void {}

  dispose(): void {}
}
