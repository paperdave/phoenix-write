import { MaybeAnimated } from "./animation";
import { TimeRange, Transform } from "./basic";

export interface LevelData {
  components: ComponentData[];
  camera: MaybeAnimated<CameraData>;
}

export interface ComponentData {
  /** Type of component */
  type: string;
  /** Transform for this item. */
  transform: MaybeAnimated<Transform>;
  /** When this object is visible */
  time: TimeRange;
  /** Data for this component */
  data: any;
}

export interface CameraData extends Transform {}
