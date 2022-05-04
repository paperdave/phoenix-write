export interface Point {
  x: number;
  y: number;
}

export interface TimeRange {
  start: number;
  end: number;
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
