import { Class } from "../types/util";
import { ComponentDisplay } from "./ComponentDisplay";
import { ComponentLogic } from "./ComponentLogic";

export interface ComponentDefinition<Data = unknown> {
  type: string;
  display: Class<ComponentDisplay<ComponentLogic<Data>>>;
  logic: Class<ComponentLogic<Data>>;
}

export function ComponentDefinition<Data>(componentType: ComponentDefinition<Data>) {
  return componentType;
}
