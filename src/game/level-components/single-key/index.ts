import { ComponentDefinition } from "../../registry-utils";
import { SingleKeyDisplay } from "./SingleKeyDisplay";
import { SingleKeyLogic } from "./SingleKeyLogic";

export interface SingleKeyData {
  key: string;
  times: number[];
}

export default ComponentDefinition({
  type: "single-key",
  display: SingleKeyDisplay,
  logic: SingleKeyLogic,
});
