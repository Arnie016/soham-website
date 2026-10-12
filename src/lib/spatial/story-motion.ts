/** Three finite chapters, driven by native page scroll rather than wheel interception. */
export const STORY_STOPS = [0, 0.5, 1] as const;
export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
export function smoothRange(value: number, from: number, to: number) {
  const t = clamp01((value - from) / (to - from));
  return t * t * (3 - 2 * t);
}
export function storyPose(progress: number) {
  const p = clamp01(progress);
  return {
    chapter: p < 0.27 ? 0 : p < 0.73 ? 1 : 2,
    assembly: smoothRange(p, 0.07, 0.43),
    separation: smoothRange(p, 0.6, 0.94),
    camera: smoothRange(p, 0, 1),
  };
}
/** Exponential damping has the same duration at 30, 60 or 120 Hz. */
export function damping(deltaSeconds: number, speed = 7) {
  return 1 - Math.exp(-speed * Math.min(0.1, Math.max(0, deltaSeconds)));
}
