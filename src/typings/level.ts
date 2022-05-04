export interface LevelData {
  components: ComponentData[];
}

export interface ComponentData {
  /** Type of component */
  type: string;
  /** Transform for this item. */
  transform: Transform;
  /** [start time, end time] */
  time: [number, number];
  /** Data for this component */
  data: any;
}

export interface Transform {
  /** Translate X */
  x: number;
  /** Translate Y */
  y: number;
  /** Rotation Z (normal rotation) */
  rz: number;
  /** Scale X */
  sx: number;
  /** Scale Y */
  sy: number;
}
