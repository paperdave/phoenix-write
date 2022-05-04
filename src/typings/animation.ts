export type MaybeAnimated<T> = T | Animated<T>;

export interface Animated<T> {
  keys: Keyframe<T>;
}

export interface Keyframe<T> {
  time: number;
  value: T;
}
