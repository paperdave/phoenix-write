export type MaybeAnimated<T> = T | Animated<T>;

export type Animated<T> = T extends number | string | boolean
  ? KeyedAnimation<T>
  : T extends Array<infer U>
  ? Animated<U>[]
  : T extends object
  ? { [K in keyof T]: Animated<T[K]> }
  : never;

export interface KeyedAnimation<T> {
  keys: Keyframe<T>[];
}

export interface Keyframe<T> {
  time: number;
  value: T;
}
