import { MaybeAnimated } from './animation';
import { TimeRange, Transform } from './basic';

export interface LevelData {
  components: ComponentData[];
  camera: MaybeAnimated<CameraData>;
}

export interface ComponentData<T = unknown> {
  /** Type of component. */
  type: string;
  /** Debug name for this component (optional) */
  name?: string;
  /** Transform for this item. */
  transform: MaybeAnimated<Transform>;
  /** When this object is visible. */
  time: TimeRange;
  /** Data for this component. */
  data: T;
}

export interface CameraData extends Transform {}
