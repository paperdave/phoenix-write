import { KeyedAnimation } from "../typings/animation";

function interpolateNumber(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function interpolate<T>(a: T, b: T, at: number): T {
  if (typeof a === "number") {
    // this line is stupid, and is why i believe the entire interpolation code needs
    // to be completely rewritten.
    return interpolateNumber(a as any, b as any, at) as any;
  } else {
    throw new Error("Not implemented");
  }
}

export function getAnimationValue<T>(anim: KeyedAnimation<T>, at: number) {
  if (anim.keys.length === 1) {
    return anim.keys[0].value;
  }

  if (anim.keys[0].time > at) {
    return anim.keys[0].value;
  }
  if (anim.keys[anim.keys.length - 1].time < at) {
    return anim.keys[anim.keys.length - 1].value;
  }

  const keys = anim.keys;

  let lower = 0;
  let upper = keys.length - 1;

  while (lower < upper) {
    const mid = Math.floor((lower + upper) / 2);

    if (keys[mid].time === at) {
      return keys[mid].value;
    } else if (keys[mid].time > at) {
      upper = mid;
    } else {
      lower = mid + 1;
    }
  }

  const lowerKey = keys[lower - 1];
  if (lowerKey.time === at) {
    return lowerKey.value;
  }

  const upperKey = keys[lower];

  return interpolate(
    lowerKey.value,
    upperKey.value,
    (at - lowerKey.time) / (upperKey.time - lowerKey.time)
  );
}
