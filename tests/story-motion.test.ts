import test from "node:test";
import assert from "node:assert/strict";
import {
  damping,
  STORY_STOPS,
  storyPose,
} from "../src/lib/spatial/story-motion";

test("the three chapter stops show landscape, assembled campus, then separated floors", () => {
  assert.deepEqual(
    STORY_STOPS.map((p) => storyPose(p).chapter),
    [0, 1, 2],
  );
  assert.equal(storyPose(0).assembly, 0);
  assert.equal(storyPose(0.5).assembly, 1);
  assert.equal(storyPose(0.5).separation, 0);
  assert.equal(storyPose(1).separation, 1);
  assert.deepEqual(storyPose(-1), storyPose(0));
  assert.deepEqual(storyPose(2), storyPose(1));
});

test("reveal is monotonic and reversible with no extra chapter or loop", () => {
  let previous = storyPose(0);
  const chapters = new Set<number>();
  for (let i = 0; i <= 1000; i++) {
    const next = storyPose(i / 1000);
    chapters.add(next.chapter);
    assert.ok(next.assembly >= previous.assembly);
    assert.ok(next.separation >= previous.separation);
    assert.ok(Math.abs(next.assembly - previous.assembly) < 0.005);
    assert.ok(Math.abs(next.separation - previous.separation) < 0.005);
    if (next.separation > 0) assert.equal(next.assembly, 1);
    previous = next;
  }
  assert.deepEqual([...chapters], [0, 1, 2]);
  assert.equal(storyPose(0).separation, 0);
});

test("damping takes the same time at different display refresh rates", () => {
  function simulate(fps: number) {
    let value = 0;
    for (let frame = 0; frame < fps; frame++)
      value += (1 - value) * damping(1 / fps);
    return value;
  }
  assert.ok(Math.abs(simulate(30) - simulate(120)) < 1e-12);
  assert.ok(Math.abs(simulate(60) - simulate(120)) < 1e-12);
  assert.equal(damping(-1), 0);
  assert.ok(damping(10) < 1);
});
