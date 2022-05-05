import { SingleKeyData } from ".";
import { Immutable } from "../../../types/immutable";
import { ComponentDisplay } from "../../ComponentDisplay";
import { ComponentLogic } from "../../ComponentLogic";

export class SingleKeyDisplay extends ComponentDisplay<ComponentLogic> {
  init(data: Immutable<SingleKeyData>) {}

  update(time: number) {}

  dispose() {}
}
