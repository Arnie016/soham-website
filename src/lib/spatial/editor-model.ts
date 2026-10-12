/** A schematic reconstruction from Prithvika's supplied site plan (sheet 14).
 * Coordinates and heights are study geometry, not surveyed construction data.
 * One scene unit represents ten metres. The authored portfolio is never mutated.
 */
export type Point = [number, number];
export type Finish = "brick" | "stone" | "timber" | "plaster" | "green";
export type StudyLevel = {
  id: string;
  name: string;
  outline: Point[];
  holes: Point[][];
  height: number;
  finish: Finish;
  slabFinish: Finish;
  wallFinishes: Record<string, Finish>;
};
export type StudyBuilding = { id: string; name: string; levels: StudyLevel[] };
export type StudyModel = { version: 2; buildings: StudyBuilding[] };
export type Selection = {
  building: string;
  level: string;
  kind: "slab" | "wall";
  wall: number;
};
export type LevelMode = "stacked" | "exploded" | "solo";
export const STORAGE_KEY = "soham-prithvika-study-v2";
export const FINISHES: { id: Finish; name: string; color: string }[] = [
  { id: "brick", name: "Fly-ash brick", color: "#bb8768" },
  { id: "stone", name: "Local stone", color: "#aba795" },
  { id: "timber", name: "Timber", color: "#9e7046" },
  { id: "plaster", name: "Lime plaster", color: "#eee8d8" },
  { id: "green", name: "Planted surface", color: "#738568" },
];
export function planPoint(x: number, y: number): Point {
  return [(x - 1040) / 25, (y - 420) / 25];
}
const plan = (points: Point[]) => points.map(([x, y]) => planPoint(x, y));
const circle = (x: number, y: number, r: number, steps = 32) =>
  Array.from({ length: steps }, (_, i): Point =>
    planPoint(
      x + Math.cos((i / steps) * Math.PI * 2) * r,
      y + Math.sin((i / steps) * Math.PI * 2) * r,
    ),
  );
export const SITE_OUTLINE = plan([
  [615, 160],
  [1432, 160],
  [1513, 441],
  [1545, 560],
  [1450, 760],
  [1400, 829],
  [1334, 814],
  [1240, 650],
  [1140, 595],
  [969, 564],
  [799, 568],
  [661, 600],
  [603, 570],
  [629, 360],
  [607, 270],
  [580, 215],
]);

export function createStudy(): StudyModel {
  const blocks: {
    id: string;
    name: string;
    floors: number;
    outline: Point[];
    holes?: Point[][];
  }[] = [
    {
      id: "academic",
      name: "Academic Block A",
      floors: 3,
      outline: plan([
        [718, 284],
        [820, 284],
        [820, 355],
        [792, 355],
        [792, 374],
        [748, 374],
        [748, 434],
        [716, 434],
      ]),
      holes: [
        plan([
          [753, 308],
          [777, 308],
          [777, 337],
          [753, 337],
        ]),
      ],
    },
    {
      id: "research-b",
      name: "Research Block B",
      floors: 2,
      outline: plan([
        [846, 243],
        [929, 243],
        [929, 269],
        [920, 289],
        [913, 308],
        [910, 332],
        [913, 352],
        [922, 375],
        [927, 383],
        [927, 429],
        [821, 429],
        [821, 381],
        [846, 381],
      ]),
    },
    {
      id: "exhibition",
      name: "Circular Exhibition",
      floors: 3,
      outline: circle(1003, 332, 51),
      holes: [],
    },
    {
      id: "research-c",
      name: "Research Block C",
      floors: 2,
      outline: plan([
        [1076, 243],
        [1159, 243],
        [1159, 379],
        [1184, 379],
        [1184, 468],
        [1076, 450],
        [1076, 382],
        [1085, 365],
        [1094, 347],
        [1098, 331],
        [1094, 309],
        [1086, 291],
        [1076, 276],
      ]),
      holes: [
        plan([
          [1121, 396],
          [1141, 396],
          [1141, 426],
          [1121, 426],
        ]),
      ],
    },
    {
      id: "research-d",
      name: "Research Block D",
      floors: 3,
      outline: plan([
        [1215, 326],
        [1266, 326],
        [1333, 475],
        [1262, 549],
        [1215, 506],
      ]),
      holes: [
        plan([
          [1251, 354],
          [1290, 457],
          [1263, 490],
          [1241, 470],
          [1241, 354],
        ]),
      ],
    },
    {
      id: "admin",
      name: "Administration Block",
      floors: 2,
      outline: plan([
        [1181, 243],
        [1259, 243],
        [1284, 307],
        [1181, 307],
      ]),
    },
    {
      id: "residence",
      name: "Student Hostel",
      floors: 3,
      outline: plan([
        [1405, 493],
        [1480, 519],
        [1498, 555],
        [1380, 530],
      ]),
    },
  ];
  return {
    version: 2,
    buildings: blocks.map((b) => ({
      id: b.id,
      name: b.name,
      levels: Array.from({ length: b.floors }, (_, i) => ({
        id: `${b.id}-${i}`,
        name: i === 0 ? "Ground Floor" : `Level ${i}`,
        outline:
          b.id === "exhibition"
            ? circle(1003, 332, 51 - i * 12)
            : structuredClone(b.outline),
        holes: structuredClone(b.holes || []),
        height: 0.48,
        finish: "brick",
        slabFinish: b.id === "exhibition" ? "stone" : "plaster",
        wallFinishes: {},
      })),
    })),
  };
}
export const INITIAL_SELECTION: Selection = {
  building: "research-b",
  level: "research-b-0",
  kind: "slab",
  wall: 0,
};
export function selectedLevel(model: StudyModel, selection: Selection) {
  return model.buildings
    .find((b) => b.id === selection.building)
    ?.levels.find((l) => l.id === selection.level);
}
export function bounds(points: Point[]) {
  const xs = points.map((p) => p[0]),
    zs = points.map((p) => p[1]);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minZ = Math.min(...zs),
    maxZ = Math.max(...zs);
  return {
    minX,
    maxX,
    minZ,
    maxZ,
    width: maxX - minX,
    depth: maxZ - minZ,
    cx: (maxX + minX) / 2,
    cz: (maxZ + minZ) / 2,
  };
}
export function polygonArea(points: Point[]) {
  return Math.abs(
    points.reduce((s, p, i) => {
      const q = points[(i + 1) % points.length];
      return s + p[0] * q[1] - q[0] * p[1];
    }, 0) / 2,
  );
}
function cross(a: Point, b: Point, c: Point) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}
function onSegment(a: Point, b: Point, p: Point) {
  return (
    Math.abs(cross(a, b, p)) < 1e-8 &&
    p[0] >= Math.min(a[0], b[0]) - 1e-8 &&
    p[0] <= Math.max(a[0], b[0]) + 1e-8 &&
    p[1] >= Math.min(a[1], b[1]) - 1e-8 &&
    p[1] <= Math.max(a[1], b[1]) + 1e-8
  );
}
function intersects(a: Point, b: Point, c: Point, d: Point) {
  return (
    (cross(a, b, c) * cross(a, b, d) < 0 &&
      cross(c, d, a) * cross(c, d, b) < 0) ||
    onSegment(a, b, c) ||
    onSegment(a, b, d) ||
    onSegment(c, d, a) ||
    onSegment(c, d, b)
  );
}
export function validPolygon(points: Point[]) {
  if (
    points.length < 3 ||
    points.length > 64 ||
    polygonArea(points) < 0.1 ||
    points.some(
      (p) =>
        p.length !== 2 ||
        p.some((n) => !Number.isFinite(n) || Math.abs(n) > 40),
    )
  )
    return false;
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length];
    if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.025) return false;
    for (let j = i + 2; j < points.length; j++) {
      if (i === 0 && j === points.length - 1) continue;
      if (intersects(a, b, points[j], points[(j + 1) % points.length]))
        return false;
    }
  }
  return true;
}
function inside(p: Point, outline: Point[]) {
  let yes = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const a = outline[i],
      b = outline[j];
    if (
      a[1] > p[1] !== b[1] > p[1] &&
      p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      yes = !yes;
  }
  return yes;
}
export function validFootprint(level: StudyLevel) {
  if (!validPolygon(level.outline)) return false;
  return level.holes.every(
    (h) =>
      validPolygon(h) &&
      h.every((p) => inside(p, level.outline)) &&
      !h.some((a, i) =>
        level.outline.some((c, j) =>
          intersects(
            a,
            h[(i + 1) % h.length],
            c,
            level.outline[(j + 1) % level.outline.length],
          ),
        ),
      ),
  );
}
export function editLevel(
  model: StudyModel,
  selection: Selection,
  edit: (level: StudyLevel) => void,
): StudyModel {
  const next = structuredClone(model),
    level = selectedLevel(next, selection);
  if (!level) return model;
  edit(level);
  if (
    !validFootprint(level) ||
    !Number.isFinite(level.height) ||
    level.height < 0.25 ||
    level.height > 0.75
  )
    return model;
  return JSON.stringify(next) === JSON.stringify(model) ? model : next;
}
export function resizeLevel(
  model: StudyModel,
  selection: Selection,
  axis: "width" | "depth",
  size: number,
) {
  if (!Number.isFinite(size) || size < 1 || size > 18) return model;
  return editLevel(model, selection, (l) => {
    const b = bounds(l.outline),
      factor = size / b[axis];
    const n = axis === "width" ? 0 : 1,
      c = n === 0 ? b.cx : b.cz;
    for (const ring of [l.outline, ...l.holes])
      for (const p of ring) p[n] = c + (p[n] - c) * factor;
  });
}
export function moveCorner(
  model: StudyModel,
  selection: Selection,
  index: number,
  point: Point,
) {
  return editLevel(model, selection, (l) => {
    if (l.outline[index]) l.outline[index] = point;
  });
}
export function moveWall(
  model: StudyModel,
  selection: Selection,
  distance: number,
) {
  return editLevel(model, selection, (l) => {
    const i = selection.wall % l.outline.length,
      j = (i + 1) % l.outline.length,
      a = l.outline[i],
      b = l.outline[j],
      len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const nx = (b[1] - a[1]) / len,
      nz = -(b[0] - a[0]) / len;
    l.outline[i] = [a[0] + nx * distance, a[1] + nz * distance];
    l.outline[j] = [b[0] + nx * distance, b[1] + nz * distance];
  });
}
export function parseSavedStudy(raw: string | null): StudyModel | null {
  if (!raw || raw.length > 120000) return null;
  try {
    const data = JSON.parse(raw) as StudyModel,
      base = createStudy();
    if (
      data.version !== 2 ||
      !Array.isArray(data.buildings) ||
      data.buildings.length !== base.buildings.length
    )
      return null;
    const finishes = FINISHES.map((f) => f.id);
    for (let i = 0; i < base.buildings.length; i++) {
      const b = data.buildings[i],
        original = base.buildings[i];
      if (
        b.id !== original.id ||
        b.name !== original.name ||
        b.levels.length !== original.levels.length
      )
        return null;
      for (let j = 0; j < b.levels.length; j++) {
        const l = b.levels[j],
          seed = original.levels[j];
        if (
          l.id !== seed.id ||
          l.name !== seed.name ||
          l.outline.length !== seed.outline.length ||
          l.holes.length !== seed.holes.length ||
          !validFootprint(l) ||
          l.height < 0.25 ||
          l.height > 0.75 ||
          !Number.isFinite(l.height) ||
          !finishes.includes(l.finish) ||
          !finishes.includes(l.slabFinish) ||
          !l.wallFinishes ||
          typeof l.wallFinishes !== "object" ||
          Object.keys(l.wallFinishes).length > 64 ||
          Object.entries(l.wallFinishes).some(
            ([key, value]) =>
              !/^\d+$/.test(key) ||
              Number(key) >= l.outline.length ||
              !finishes.includes(value),
          )
        )
          return null;
      }
    }
    return data;
  } catch {
    return null;
  }
}
export type StudyHistory = {
  past: StudyModel[];
  present: StudyModel;
  future: StudyModel[];
};
export function commitStudy(
  history: StudyHistory,
  next: StudyModel,
): StudyHistory {
  return JSON.stringify(next) === JSON.stringify(history.present)
    ? history
    : {
        past: [...history.past, history.present].slice(-50),
        present: next,
        future: [],
      };
}
export function undoStudy(h: StudyHistory): StudyHistory {
  return h.past.length
    ? {
        past: h.past.slice(0, -1),
        present: h.past[h.past.length - 1],
        future: [h.present, ...h.future].slice(0, 50),
      }
    : h;
}
export function redoStudy(h: StudyHistory): StudyHistory {
  return h.future.length
    ? {
        past: [...h.past, h.present].slice(-50),
        present: h.future[0],
        future: h.future.slice(1),
      }
    : h;
}
