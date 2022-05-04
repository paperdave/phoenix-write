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
  tx: number;
  /** Translate Y */
  ty: number;
  /** Translate Z */
  tz?: number;
  /** Rotation X */
  rx?: number;
  /** Rotation Y */
  ry?: number;
  /** Rotation Z (normal rotation) */
  rz: number;
  /** Scale X */
  sx: number;
  /** Scale Y */
  sy: number;
  // Note: there is no scale Z as it doesn't make sense with 2d layers
  /** Skew X */
  skx?: number;
  /** Skew Y */
  sky?: number;
}
