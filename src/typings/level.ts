import { TimeRange, Transform } from "./basic";

export interface LevelData {
  components: ComponentData[];
}

export interface ComponentData {
  /** Type of component */
  type: string;
  /** Transform for this item. */
  transform: Transform;
  /** When this object is visible */
  time: TimeRange;
  /** Data for this component */
  data: any;
}

export interface Camera extends Transform {}
