import test from "node:test";
import { PRITHVIKA_BLOCKS } from "../src/lib/spatial/prithvika-content";
import assert from "node:assert/strict";
import {
  createStudy,
  parseSavedStudy,
  validFootprint,
  INITIAL_SELECTION,
  selectedLevel,
  resizeLevel,
  editLevel,
  moveCorner,
  moveWall,
  polygonArea,
  commitStudy,
  undoStudy,
  redoStudy,
  type StudyHistory,
} from "../src/lib/spatial/editor-model";

test("all reconstructed floors and courtyards are valid and survive a save", () => {
  const model = createStudy();
  assert.equal(model.buildings.length, 7);
  assert.equal(model.buildings.flatMap((b) => b.levels).length, 18);
  assert.ok(model.buildings.every((b) => b.levels.every(validFootprint)));
  assert.deepEqual(parseSavedStudy(JSON.stringify(model)), model);
});
test("resizing changes selected geometry and area without changing the authored model or another floor", () => {
  const model = createStudy(),
    before = JSON.stringify(model),
    original = selectedLevel(model, INITIAL_SELECTION)!;
  const next = resizeLevel(model, INITIAL_SELECTION, "width", 6);
  assert.ok(
    polygonArea(selectedLevel(next, INITIAL_SELECTION)!.outline) >
      polygonArea(original.outline),
  );
  assert.equal(JSON.stringify(model), before);
  assert.deepEqual(next.buildings[1].levels[1], model.buildings[1].levels[1]);
});
test("moving a wall updates both endpoints and the floor footprint", () => {
  const model = createStudy(),
    selection = { ...INITIAL_SELECTION, kind: "wall" as const, wall: 0 },
    old = selectedLevel(model, selection)!;
  const next = moveWall(model, selection, 0.1),
    changed = selectedLevel(next, selection)!;
  assert.notDeepEqual(changed.outline[0], old.outline[0]);
  assert.notDeepEqual(changed.outline[1], old.outline[1]);
  assert.deepEqual(changed.outline.slice(2), old.outline.slice(2));
  assert.ok(validFootprint(changed));
});
test("crossed edges, collapsed floors, invalid heights and escaped courtyards are rejected", () => {
  const m = createStudy();
  assert.equal(moveCorner(m, INITIAL_SELECTION, 0, [40, 40]), m);
  assert.equal(resizeLevel(m, INITIAL_SELECTION, "width", 0), m);
  assert.equal(
    editLevel(m, INITIAL_SELECTION, (l) => {
      l.height = Infinity;
    }),
    m,
  );
  assert.equal(
    editLevel(m, INITIAL_SELECTION, (l) => {
      l.height = 0.1;
    }),
    m,
  );
  const courtyard = {
    building: "academic",
    level: "academic-0",
    kind: "slab" as const,
    wall: 0,
  };
  assert.equal(
    editLevel(m, courtyard, (l) => {
      l.holes[0][0] = [35, 35];
    }),
    m,
  );
});
test("undo and redo restore complete edits and a new edit discards the redo branch", () => {
  const m = createStudy(),
    next = resizeLevel(m, INITIAL_SELECTION, "width", 5);
  const h: StudyHistory = { past: [], present: m, future: [] };
  const changed = commitStudy(h, next),
    undone = undoStudy(changed);
  assert.deepEqual(undone.present, m);
  assert.deepEqual(redoStudy(undone).present, next);
  assert.equal(
    commitStudy(undone, resizeLevel(m, INITIAL_SELECTION, "depth", 8)).future
      .length,
    0,
  );
});
test("reset is undoable and history is bounded", () => {
  let h: StudyHistory = { past: [], present: createStudy(), future: [] };
  for (let i = 0; i < 65; i++)
    h = commitStudy(
      h,
      editLevel(h.present, INITIAL_SELECTION, (l) => {
        l.height = i % 2 ? 0.4 : 0.5;
      }),
    );
  assert.equal(h.past.length, 50);
  const before = h.present;
  h = commitStudy(h, createStudy());
  assert.deepEqual(undoStudy(h).present, before);
});
test("untrusted or obsolete browser saves fail safely without replacing the campus", () => {
  for (const raw of [
    "{",
    "null",
    "{}",
    JSON.stringify({ ...createStudy(), version: 1 }),
  ])
    assert.equal(parseSavedStudy(raw), null);
  const m = createStudy();
  m.buildings[0].levels[0].outline[0] = [1e30, 0];
  assert.equal(parseSavedStudy(JSON.stringify(m)), null);
  const extra = createStudy();
  extra.buildings[0].levels[0].wallFinishes["999"] = "brick";
  assert.equal(parseSavedStudy(JSON.stringify(extra)), null);
});

test("portfolio block programmes match the reconstructed floor counts", () => {
  const model = createStudy();
  for (const b of model.buildings)
    assert.equal(b.levels.length, PRITHVIKA_BLOCKS[b.id].floors.length);
  assert.equal(
    model.buildings.find((b) => b.id === "research-b")!.levels.length,
    2,
  );
  assert.equal(
    model.buildings.find((b) => b.id === "research-c")!.levels.length,
    2,
  );
  assert.equal(
    model.buildings.find((b) => b.id === "research-d")!.levels.length,
    3,
  );
});
