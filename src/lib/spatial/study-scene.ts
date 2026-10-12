import * as T from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  SITE_OUTLINE,
  bounds,
  moveCorner,
  moveWall,
  planPoint,
  selectedLevel,
  type LevelMode,
  type Point,
  type Selection,
  type StudyLevel,
  type StudyModel,
} from "./editor-model";

import { PRITHVIKA_BLOCKS } from "./prithvika-content";
import { addStudyAssets } from "./study-assets";
import { createStudyMaterials } from "./study-materials";
import { damping, smoothRange, storyPose } from "./story-motion";

export type StudySceneState = {
  progress: number;
  labels: boolean;
  model: StudyModel;
  selection: Selection;
  editing: boolean;
  mode: LevelMode;
  view: "perspective" | "plan";
  reduced: boolean;
  orbit: boolean;
  highResolution: boolean;
  focus: number;
  resetCamera: number;
  zoom: number;
};
type Callbacks = {
  ready: () => void;
  error: () => void;
  select: (s: Selection) => void;
  inspect: (s: Selection) => void;
  preview: (m: StudyModel) => void;
  commit: (m: StudyModel) => void;
  orbitStopped: () => void;
};
export function createStudyScene(
  host: HTMLDivElement,
  state: StudySceneState,
  cb: Callbacks,
) {
  const renderer = new T.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute("aria-hidden", "true");
  let needsRender = true;
  const scene = new T.Scene();
  scene.background = new T.Color("#e5e9e6");
  const camera = new T.PerspectiveCamera(35, 1, 0.1, 220);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.minDistance = 7;
  controls.maxDistance = 100;
  controls.maxPolarAngle = Math.PI * 0.46;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.rotateSpeed = 0.55;
  controls.touches.ONE = T.TOUCH.ROTATE;
  controls.touches.TWO = T.TOUCH.DOLLY_PAN;
  const pmrem = new T.PMREMGenerator(renderer),
    room = new RoomEnvironment(),
    env = pmrem.fromScene(room, 0.04);
  scene.environment = env.texture;
  scene.environmentIntensity = 0.48;
  room.dispose();
  pmrem.dispose();
  scene.add(new T.HemisphereLight(0xe5edf1, 0x685d43, 1.55));
  const sun = new T.DirectionalLight(0xffedd0, 3.6);
  sun.position.set(-22, 28, 18);
  sun.shadow.radius = 3;
  sun.castShadow = true;
  const shadowSize = matchMedia("(max-width: 700px)").matches ? 1024 : 2048;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  sun.shadow.camera.left = -32;
  sun.shadow.camera.right = 32;
  sun.shadow.camera.top = 30;
  sun.shadow.camera.bottom = -25;
  sun.shadow.normalBias = 0.05;
  sun.shadow.bias = -0.0001;
  scene.add(sun);
  const surfaces = createStudyMaterials(renderer);
  const materials = surfaces.finishes;
  materials.brick.color.set("#d0b79b");
  materials.stone.color.set("#cdcbbf");
  const glass = new T.MeshPhysicalMaterial({
    color: "#415754",
    roughness: 0.19,
    metalness: 0.48,
    clearcoat: 0.65,
    clearcoatRoughness: 0.16,
  });
  const trim = new T.MeshStandardMaterial({ color: "#bba27e", roughness: 0.7 });
  const bronze = new T.MeshStandardMaterial({
    color: "#5c5142",
    roughness: 0.58,
    metalness: 0.35,
  });
  const groundMat = new T.MeshStandardMaterial({
    color: "#e5e9e6",
    roughness: 1,
  });
  const soil = surfaces.earth;
  const roadMat = surfaces.road;
  const waterMat = new T.MeshStandardMaterial({
    color: "#88a6a0",
    roughness: 0.3,
    metalness: 0.3,
  });
  const selectMat = new T.MeshBasicMaterial({
    color: "#b97646",
    transparent: true,
    opacity: 0.21,
    depthWrite: false,
    side: T.DoubleSide,
  });
  const lineMat = new T.LineBasicMaterial({
    color: "#ad6d3e",
    depthTest: false,
  });
  const handleMat = new T.MeshBasicMaterial({
    color: "#bc7549",
    depthTest: false,
  });
  const group = new T.Group();
  scene.add(group);
  const floor = new T.Mesh(new T.PlaneGeometry(220, 220), groundMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.48;
  floor.receiveShadow = true;
  scene.add(floor);
  const grid = new T.GridHelper(120, 120, 0xaeb9b2, 0xdde2d9);
  grid.position.y = -0.469;
  scene.add(grid);
  const shape = (points: Point[], holes: Point[][] = []) => {
    const s = new T.Shape(points.map((p) => new T.Vector2(p[0], -p[1])));
    for (const h of holes)
      s.holes.push(new T.Path(h.map((p) => new T.Vector2(p[0], -p[1]))));
    return s;
  };
  const extrude = (points: Point[], holes: Point[][], depth: number) => {
    const g = new T.ExtrudeGeometry(shape(points, holes), {
      depth,
      bevelEnabled: false,
    });
    g.rotateX(-Math.PI / 2);
    return g;
  };
  const site = new T.Mesh(extrude(SITE_OUTLINE, [], 0.42), soil);
  const siteUV = site.geometry.getAttribute("uv");
  for (let i = 0; i < siteUV.count; i++)
    siteUV.setXY(i, siteUV.getX(i) * 1.6, siteUV.getY(i) * 1.6);
  site.position.y = -0.43;
  site.receiveShadow = true;
  site.castShadow = true;
  group.add(site);
  const siteEdge = new T.LineSegments(
    new T.EdgesGeometry(site.geometry, 30),
    new T.LineBasicMaterial({
      color: "#86917d",
      transparent: true,
      opacity: 0.3,
    }),
  );
  siteEdge.position.copy(site.position);
  group.add(siteEdge);
  function strip(
    points: Point[],
    width: number,
    mat: T.Material,
    y = 0.005,
    closed = false,
  ) {
    const path = new T.CatmullRomCurve3(
      points.map(([x, z]) => new T.Vector3(x, y, z)),
      closed,
      "catmullrom",
      0.12,
    );
    const g = new T.TubeGeometry(
      path,
      Math.max(20, points.length * 8),
      width,
      8,
      closed,
    );
    g.scale(1, 0.07, 1);
    const mesh = new T.Mesh(g, mat);
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  strip(
    [
      [650, 176],
      [1413, 176],
      [1465, 381],
      [1506, 535],
      [1446, 668],
      [1400, 679],
      [1340, 631],
      [1304, 691],
      [1213, 612],
      [1150, 562],
      [985, 528],
      [757, 530],
      [687, 496],
      [681, 288],
      [695, 198],
    ].map((p) => planPoint(p[0], p[1])),
    0.38,
    roadMat,
    0.01,
    true,
  );
  strip(
    [
      [706, 266],
      [829, 266],
      [838, 226],
      [1280, 226],
      [1366, 491],
      [1283, 619],
      [1203, 567],
      [1203, 245],
    ].map((p) => planPoint(p[0], p[1])),
    0.25,
    roadMat,
  );
  const center = planPoint(1003, 332);
  for (let i = 0; i < 4; i++) {
    const ring = new T.Mesh(
      new T.RingGeometry(2.3 + i * 0.45, 2.38 + i * 0.45, 80),
      i % 2 === 0 ? trim : materials.green,
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(center[0], 0.014, center[1]);
    ring.receiveShadow = true;
    group.add(ring);
  }
  for (const [x, y, w, d] of [
    [872, 476, 100, 85],
    [999, 476, 100, 85],
    [1155, 504, 79, 61],
    [1270, 572, 61, 45],
  ]) {
    const p = planPoint(x, y),
      patch = new T.Mesh(new T.PlaneGeometry(w / 25, d / 25), materials.green);
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(p[0], 0.018, p[1]);
    patch.receiveShadow = true;
    group.add(patch);
  }
  for (const path of [
    [
      [720, 462],
      [872, 476],
      [985, 528],
    ],
    [
      [820, 495],
      [949, 409],
      [1003, 394],
      [1048, 406],
      [1125, 487],
      [1190, 544],
    ],
    [
      [873, 531],
      [910, 446],
      [1003, 397],
    ],
    [
      [1070, 533],
      [1125, 487],
      [1245, 551],
    ],
  ])
    strip(
      path.map((p) => planPoint(p[0], p[1])),
      0.09,
      materials.plaster,
      0.025,
    );
  const wetland = planPoint(666, 542),
    pond = new T.Mesh(new T.CircleGeometry(0.77, 48), waterMat);
  pond.rotation.x = -Math.PI / 2;
  pond.position.set(wetland[0], 0.026, wetland[1]);
  pond.scale.set(1, 1.55, 1);
  group.add(pond);
  // Deterministic perimeter planting keeps the actual campus footprint readable.
  let seed = 42;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const trees: { x: number; z: number; s: number }[] = [];
  for (let i = 0; i < SITE_OUTLINE.length; i++) {
    const a = SITE_OUTLINE[i],
      b = SITE_OUTLINE[(i + 1) % SITE_OUTLINE.length],
      count = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 1.7);
    for (let j = 0; j < count; j++) {
      const t = j / count;
      trees.push({
        x: a[0] + (b[0] - a[0]) * t + (random() - 0.5) * 0.8,
        z: a[1] + (b[1] - a[1]) * t + (random() - 0.5) * 0.7,
        s: 0.28 + random() * 0.18,
      });
    }
  }
  for (const [px, py] of [
    [965, 272],
    [1036, 272],
    [949, 409],
    [1048, 406],
    [785, 472],
    [1125, 487],
    [1310, 332],
    [1430, 628],
  ]) {
    const p = planPoint(px, py);
    for (let i = 0; i < 4; i++)
      trees.push({
        x: p[0] + (random() - 0.5) * 0.8,
        z: p[1] + (random() - 0.5) * 0.8,
        s: 0.3 + random() * 0.15,
      });
  }
  // Loose groves, varied canopies and open lawns follow the portfolio's planted setting.
  function inside(p: Point, polygon: Point[]) {
    let hit = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i],
        b = polygon[j];
      if (
        a[1] > p[1] !== b[1] > p[1] &&
        p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]
      )
        hit = !hit;
    }
    return hit;
  }
  const plantedFootprints = state.model.buildings.map(
    (b) => b.levels[0].outline,
  );
  for (let i = 0; i < 430; i++) {
    const x = -19 + random() * 39,
      z = -10 + random() * 26;
    if (
      !inside([x, z], SITE_OUTLINE) ||
      plantedFootprints.some((p) => inside([x, z], p))
    )
      continue;
    // Keep the circular court and main arrival lawn open.
    if (Math.hypot(x - center[0], z - center[1]) < 4.25) continue;
    if (z > 0 && z < 4.7 && x > -8 && x < 5 && random() < 0.65) continue;
    trees.push({ x, z, s: 0.23 + random() * 0.24 });
  }
  const leafGeo = new T.IcosahedronGeometry(1, 2);
  const leafPositions = leafGeo.getAttribute("position");
  for (let i = 0; i < leafPositions.count; i++) {
    const x = leafPositions.getX(i),
      y = leafPositions.getY(i),
      z = leafPositions.getZ(i);
    const ripple = 1 + 0.12 * Math.sin(x * 17 + y * 13) * Math.cos(z * 15);
    leafPositions.setXYZ(i, x * ripple, y * ripple, z * ripple);
  }
  leafGeo.computeVertexNormals();
  const leaves = new T.InstancedMesh(
    leafGeo,
    new T.MeshStandardMaterial({ color: "#ffffff", roughness: 1 }),
    trees.length * 4,
  );
  const trunks = new T.InstancedMesh(
    new T.CylinderGeometry(0.025, 0.046, 0.65, 6),
    materials.timber,
    trees.length,
  );
  const dummy = new T.Object3D();
  const leafColors = ["#596b39", "#74824a", "#899257", "#657646", "#8b8c58"];
  trees.forEach((p, i) => {
    for (let k = 0; k < 4; k++) {
      const angle = k * 2.4 + random();
      dummy.position.set(
        p.x + Math.cos(angle) * p.s * 0.46,
        0.37 + p.s * (k === 0 ? 1.05 : 0.6),
        p.z + Math.sin(angle) * p.s * 0.46,
      );
      dummy.scale.set(p.s * 0.8, p.s * (0.8 + random() * 0.55), p.s * 0.75);
      dummy.rotation.set(random(), random() * 6, random());
      dummy.updateMatrix();
      leaves.setMatrixAt(i * 4 + k, dummy.matrix);
      leaves.setColorAt(
        i * 4 + k,
        new T.Color(leafColors[Math.floor(random() * leafColors.length)]),
      );
    }
    dummy.position.set(p.x, 0.28, p.z);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
  });
  leaves.castShadow = true;
  leaves.receiveShadow = true;
  group.add(leaves, trunks);
  const levelRegistry = new Map<
    string,
    { signature: string; group: T.Group; selection: Selection }
  >();
  const pickables: T.Object3D[] = [];
  const highlight = new T.Group();
  scene.add(highlight);
  const cornerHandles: T.Mesh[] = [];
  const sharedBox = new T.BoxGeometry(1, 1, 1),
    handleGeometry = new T.SphereGeometry(0.1, 14, 10);
  function disposeObject(object: T.Object3D) {
    object.traverse((o) => {
      if (o instanceof T.Mesh || o instanceof T.LineSegments) {
        if (o.geometry !== sharedBox && o.geometry !== handleGeometry)
          o.geometry.dispose();
      }
    });
  }
  function buildLevel(level: StudyLevel, selection: Selection) {
    const parent = new T.Group(),
      slab = new T.Mesh(
        extrude(level.outline, level.holes, 0.075),
        materials[level.slabFinish],
      );
    slab.position.y = -0.06;
    slab.castShadow = true;
    slab.receiveShadow = true;
    slab.userData.selection = { ...selection, kind: "slab" };
    parent.add(slab);
    const glazing: T.BufferGeometry[] = [],
      mullions: T.BufferGeometry[] = [],
      reveals: T.BufferGeometry[] = [];
    const addDetail = (
      x: number,
      z: number,
      y: number,
      w: number,
      h: number,
      d: number,
      angle: number,
      target: T.BufferGeometry[],
    ) => {
      const geo = sharedBox.clone();
      geo.scale(w, h, d);
      geo.rotateY(-angle);
      geo.translate(x, y, z);
      target.push(geo);
    };
    for (const [ringIndex, ring] of [level.outline, ...level.holes].entries())
      ring.forEach((a, i) => {
        const b = ring[(i + 1) % ring.length],
          len = Math.hypot(a[0] - b[0], a[1] - b[1]),
          x = (a[0] + b[0]) / 2,
          z = (a[1] + b[1]) / 2,
          angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
        const wallGeometry = new T.BoxGeometry(len, level.height, 0.075);
        const wallUV = wallGeometry.getAttribute("uv");
        for (let j = 0; j < wallUV.count; j++)
          wallUV.setXY(
            j,
            wallUV.getX(j) * len * 1.8,
            wallUV.getY(j) * level.height * 1.8,
          );
        const wall = new T.Mesh(
          wallGeometry,
          materials[
            level.wallFinishes[i] && ringIndex === 0
              ? level.wallFinishes[i]
              : level.finish
          ],
        );

        wall.position.set(x, level.height / 2, z);
        wall.rotation.y = -angle;
        wall.castShadow = true;
        wall.receiveShadow = true;
        wall.userData.selection = {
          ...selection,
          kind: ringIndex === 0 ? "wall" : "slab",
          wall: i,
        };
        parent.add(wall);
        if (len > 0.12) {
          const n = Math.max(1, Math.floor(len / 0.26));
          const bay = len / n;
          for (let k = 0; k < n; k++) {
            const t = (k + 0.5) / n;
            const wx = a[0] + (b[0] - a[0]) * t;
            const wz = a[1] + (b[1] - a[1]) * t;
            const exhibition = selection.building === "exhibition";
            const opening = bay * (exhibition ? 0.81 : 0.59);
            // Dark reveals surround tall glazing; masonry stays between the openings.
            addDetail(
              wx,
              wz,
              level.height * 0.53,
              opening + 0.023,
              level.height * 0.78,
              0.083,
              angle,
              reveals,
            );
            addDetail(
              wx,
              wz,
              level.height * 0.54,
              opening,
              level.height * 0.71,
              0.085,
              angle,
              glazing,
            );
            addDetail(
              wx,
              wz,
              level.height * 0.86,
              opening + 0.05,
              0.025,
              0.15,
              angle,
              mullions,
            );
            addDetail(
              wx,
              wz,
              level.height * 0.17,
              opening + 0.025,
              0.018,
              0.1,
              angle,
              mullions,
            );
            addDetail(
              wx,
              wz,
              level.height * 0.52,
              0.012,
              level.height * 0.72,
              0.09,
              angle,
              mullions,
            );
          }
          // Thin pale eaves tie the façades back to the wide roof plates in the renders.
          addDetail(
            x,
            z,
            level.height - 0.012,
            len + 0.05,
            0.035,
            0.13,
            angle,
            mullions,
          );
        }
      });
    for (const [pieces, mat] of [
      [reveals, bronze],
      [glazing, glass],
      [mullions, trim],
    ] as [T.BufferGeometry[], T.Material][]) {
      if (pieces.length) {
        const merged = mergeGeometries(pieces),
          mesh = new T.Mesh(merged, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);
        pieces.forEach((g) => g.dispose());
      }
    }
    const owner = state.model.buildings.find(
      (b) => b.id === selection.building,
    )!;
    if (
      owner.levels.at(-1)?.id === level.id ||
      selection.building === "exhibition"
    ) {
      const roof = new T.Mesh(
        extrude(level.outline, level.holes, 0.055),
        materials.plaster,
      );
      roof.position.y = level.height + 0.014;
      roof.castShadow = true;
      roof.receiveShadow = true;
      roof.userData.roof = true;
      roof.userData.baseY = roof.position.y;
      parent.add(roof);
    }
    return parent;
  }
  let previousModel: StudyModel | null = null,
    previousPresentation = "",
    previousSelection = "",
    disposed = false,
    visible = true;
  let assetCleanup = () => {};
  addStudyAssets(
    group,
    trees,
    () => disposed,
    () => {
      needsRender = true;
    },
  ).then((cleanup) => {
    if (disposed) cleanup();
    else assetCleanup = cleanup;
  });
  function syncModel() {
    if (previousModel === state.model) return;
    for (const b of state.model.buildings)
      for (const l of b.levels) {
        const signature = JSON.stringify(l),
          existing = levelRegistry.get(l.id);
        if (existing?.signature === signature) continue;
        if (existing) {
          group.remove(existing.group);
          disposeObject(existing.group);
        }
        const selection: Selection = {
            building: b.id,
            level: l.id,
            kind: "slab",
            wall: 0,
          },
          g = buildLevel(l, selection);
        group.add(g);
        levelRegistry.set(l.id, { signature, group: g, selection });
      }
    pickables.length = 0;
    for (const r of levelRegistry.values())
      r.group.traverse((o) => {
        if (o.userData.selection) pickables.push(o);
      });
    needsRender = true;
    previousModel = state.model;
    previousPresentation = "";
    previousSelection = "";
  }
  function syncPresentation() {
    const key = `${state.mode}:${state.selection.level}:${state.editing}`;
    if (previousPresentation === key) return;
    for (const b of state.model.buildings) {
      let y = 0.07;
      for (const [i, l] of b.levels.entries()) {
        const r = levelRegistry.get(l.id)!;
        r.group.visible =
          state.mode !== "solo" || l.id === state.selection.level;
        r.group.userData.baseY = y;
        r.group.userData.levelIndex = i;
        r.group.userData.targetY =
          y + (state.mode === "exploded" ? i * 1.9 : 0);
        for (const child of r.group.children)
          if (child.userData.roof) child.visible = !state.editing;
        if (state.reduced || previousPresentation === "")
          r.group.position.y = r.group.userData.targetY;
        y += l.height;
      }
    }
    needsRender = true;
    previousPresentation = key;
    previousSelection = "";
  }
  function syncSelection() {
    const signature =
      JSON.stringify(state.selection) + state.editing + state.mode;
    if (signature === previousSelection) return;
    disposeObject(highlight);
    highlight.clear();
    cornerHandles.length = 0;
    if (state.editing) {
      const level = selectedLevel(state.model, state.selection),
        r = levelRegistry.get(state.selection.level);
      if (level && r) {
        if (state.selection.kind === "slab") {
          const geo = extrude(level.outline, level.holes, 0.08),
            mesh = new T.Mesh(geo, selectMat);
          mesh.position.y = 0.028;
          highlight.add(mesh);
          const edge = new T.LineSegments(new T.EdgesGeometry(geo), lineMat);
          edge.position.y = 0.028;
          edge.renderOrder = 3;
          highlight.add(edge);
          // Dense circular outlines remain editable using the inspector rather than a ring of tiny handles.
          if (level.outline.length <= 20)
            level.outline.forEach((p, i) => {
              const handle = new T.Mesh(handleGeometry, handleMat);
              handle.position.set(p[0], 0.15, p[1]);
              handle.renderOrder = 5;
              handle.userData.corner = i;
              highlight.add(handle);
              cornerHandles.push(handle);
            });
        } else {
          const a = level.outline[state.selection.wall],
            b =
              level.outline[(state.selection.wall + 1) % level.outline.length];
          const len = Math.hypot(b[0] - a[0], b[1] - a[1]),
            mesh = new T.Mesh(
              new T.BoxGeometry(len + 0.04, level.height + 0.04, 0.09),
              selectMat,
            );
          mesh.position.set(
            (a[0] + b[0]) / 2,
            level.height / 2,
            (a[1] + b[1]) / 2,
          );
          mesh.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
          highlight.add(mesh);
          const edge = new T.LineSegments(
            new T.EdgesGeometry(mesh.geometry),
            lineMat,
          );
          edge.position.copy(mesh.position);
          edge.rotation.copy(mesh.rotation);
          edge.renderOrder = 3;
          highlight.add(edge);
        }
      }
    }
    needsRender = true;
    previousSelection = signature;
  }
  const raycaster = new T.Raycaster(),
    pointer = new T.Vector2(),
    dragPlane = new T.Plane(),
    hitPoint = new T.Vector3();
  const pointAt = (e: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      (-(e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
  };
  let drag: null | {
    id: number;
    corner: number | null;
    selection: Selection;
    model: StudyModel;
    start: T.Vector3;
    changed: StudyModel;
    nx: number;
    nz: number;
    screenX: number;
    screenY: number;
  } = null;
  let press: { x: number; y: number } | null = null;
  const stopOrbit = () => {
    if (state.orbit) {
      state.orbit = false;
      cb.orbitStopped();
    }
  };
  const down = (e: PointerEvent) => {
    if (e.button !== 0) return;
    stopOrbit();
    press = { x: e.clientX, y: e.clientY };
    if (!state.editing) return;
    pointAt(e);
    const corner = raycaster.intersectObjects(cornerHandles, false)[0];
    const object = raycaster.intersectObjects(
      pickables.filter((o) => o.parent?.visible),
      false,
    )[0];
    const selection = corner
      ? state.selection
      : (object?.object.userData.selection as Selection | undefined);
    if (!selection) return;
    if (!corner && selection.kind !== "wall") return;
    const level = selectedLevel(state.model, selection)!,
      r = levelRegistry.get(selection.level)!;
    dragPlane.set(
      new T.Vector3(0, 1, 0),
      -(r.group.position.y + (corner ? 0.15 : level.height / 2)),
    );
    if (!raycaster.ray.intersectPlane(dragPlane, hitPoint)) return;
    const a = level.outline[selection.wall],
      b = level.outline[(selection.wall + 1) % level.outline.length],
      len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    drag = {
      id: e.pointerId,
      corner: corner ? corner.object.userData.corner : null,
      selection,
      model: state.model,
      start: hitPoint.clone(),
      changed: state.model,
      nx: (b[1] - a[1]) / len,
      nz: -(b[0] - a[0]) / len,
      screenX: e.clientX,
      screenY: e.clientY,
    };
    controls.enabled = false;
    renderer.domElement.setPointerCapture(e.pointerId);
    state.selection = selection;
    cb.select(selection);
  };
  const move = (e: PointerEvent) => {
    if (!drag) {
      if (state.editing) {
        pointAt(e);
        renderer.domElement.style.cursor = raycaster.intersectObjects(
          cornerHandles,
          false,
        ).length
          ? "move"
          : raycaster.intersectObjects(
                pickables.filter((o) => o.parent?.visible),
                false,
              ).length
            ? "pointer"
            : "grab";
      }
      return;
    }
    if (Math.hypot(e.clientX - drag.screenX, e.clientY - drag.screenY) < 4)
      return;
    pointAt(e);
    if (!raycaster.ray.intersectPlane(dragPlane, hitPoint)) return;
    const dx = hitPoint.x - drag.start.x,
      dz = hitPoint.z - drag.start.z;
    const original = selectedLevel(drag.model, drag.selection)!;
    const snap = (v: number) => Math.round(v * 20) / 20;
    const next =
      drag.corner !== null
        ? moveCorner(drag.model, drag.selection, drag.corner, [
            snap(original.outline[drag.corner][0] + dx),
            snap(original.outline[drag.corner][1] + dz),
          ])
        : moveWall(
            drag.model,
            drag.selection,
            snap(dx * drag.nx + dz * drag.nz),
          );
    if (next !== drag.model || Math.hypot(dx, dz) < 0.035) {
      drag.changed = next;
      state.model = next;
      cb.preview(next);
    }
  };
  const up = (e: PointerEvent) => {
    if (drag) {
      const next = drag.changed;
      drag = null;
      controls.enabled = true;
      if (renderer.domElement.hasPointerCapture(e.pointerId))
        renderer.domElement.releasePointerCapture(e.pointerId);
      cb.commit(next);
    } else if (
      state.editing &&
      press &&
      Math.hypot(e.clientX - press.x, e.clientY - press.y) < 5
    ) {
      pointAt(e);
      const object = raycaster.intersectObjects(
        pickables.filter((o) => o.parent?.visible),
        false,
      )[0];
      if (object) {
        state.selection = object.object.userData.selection;
        cb.select(state.selection);
      }
    }
    press = null;
  };
  const cancel = (e: PointerEvent) => {
    if (drag) {
      const original = drag.model;
      drag = null;
      controls.enabled = true;
      state.model = original;
      cb.commit(original);
    }
    press = null;
    if (renderer.domElement.hasPointerCapture(e.pointerId))
      renderer.domElement.releasePointerCapture(e.pointerId);
  };
  renderer.domElement.addEventListener("pointerdown", down, true);
  renderer.domElement.addEventListener("pointermove", move);
  renderer.domElement.addEventListener("pointerup", up);
  renderer.domElement.addEventListener("pointercancel", cancel);
  const lost = () => {
    cb.error();
    visible = false;
  };
  renderer.domElement.addEventListener("webglcontextlost", lost);
  let width = 1,
    height = 1,
    previousResolution = false;
  function resize() {
    needsRender = true;
    width = host.clientWidth;
    height = host.clientHeight;
    if (!width || !height) return;
    renderer.setPixelRatio(
      state.highResolution
        ? 3840 / Math.max(width, height)
        : Math.min(devicePixelRatio, width < 700 ? 1.25 : 1.7),
    );
    renderer.setSize(width, height);
    camera.aspect = width / height;
    if (!state.editing && width >= 801)
      camera.setViewOffset(width, height, -width * 0.13, 0, width, height);
    else if (!state.editing && width < 700)
      camera.setViewOffset(width, height, width * 0.065, 0, width, height);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    previousResolution = state.highResolution;
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  const intersection = new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting;
    },
    { rootMargin: "100px" },
  );
  intersection.observe(host);
  const labelLayer = document.createElement("div");
  labelLayer.className = "study-label-layer";
  labelLayer.setAttribute("aria-label", "Buildings in the campus");
  host.appendChild(labelLayer);
  const labels = state.model.buildings.map((b) => {
    const button = document.createElement("button");
    button.className = "study-building-label";
    button.textContent = PRITHVIKA_BLOCKS[b.id].title;
    button.setAttribute(
      "aria-label",
      `Explore ${PRITHVIKA_BLOCKS[b.id].title}`,
    );
    button.addEventListener("click", () =>
      cb.inspect({
        building: b.id,
        level: b.levels[0].id,
        kind: "slab",
        wall: 0,
      }),
    );
    labelLayer.appendChild(button);
    return { button, id: b.id };
  });
  const floorLabels = ["Ground Floor", "Level 1", "Level 2"].map(
    (name, index) => {
      const tag = document.createElement("button");
      tag.className = "study-floor-label";
      tag.textContent = name;
      tag.setAttribute("aria-label", `Explore Research Block D, ${name}`);
      tag.addEventListener("click", () =>
        cb.inspect({
          building: "research-d",
          level: `research-d-${index}`,
          kind: "slab",
          wall: 0,
        }),
      );
      labelLayer.appendChild(tag);
      return tag;
    },
  );
  const projected = new T.Vector3();
  function placeLabels() {
    labelLayer.hidden = state.editing || !state.labels || state.progress < 0.27;
    if (labelLayer.hidden) return;
    const occupied: { x: number; y: number; width: number }[] = [];
    for (const label of labels) {
      const b = state.model.buildings.find((b) => b.id === label.id)!;
      const selected = b.levels.at(-1)!,
        box = bounds(selected.outline),
        entry = levelRegistry.get(selected.id)!;
      const phone = width < 700;
      label.button.hidden =
        phone && !["research-b", "exhibition", "research-d"].includes(b.id);
      if (label.button.hidden) continue;
      projected
        .set(
          b.id === "residence" && state.progress > 0.8 ? box.maxX : box.cx,
          entry.group.position.y + selected.height + 0.45,
          b.id === "residence" && state.progress > 0.8 ? box.maxZ : box.cz,
        )
        .project(camera);
      let x = (projected.x * 0.5 + 0.5) * width,
        y = (-projected.y * 0.5 + 0.5) * height;
      const anchorY = y;
      const labelWidth = label.button.offsetWidth || 120;
      x = Math.max(labelWidth / 2 + 8, Math.min(width - labelWidth / 2 - 8, x));
      for (
        let tries = 0;
        tries < 7 &&
        occupied.some(
          (o) =>
            Math.abs(o.x - x) < (o.width + labelWidth) / 2 + 5 &&
            Math.abs(o.y - y) < 28,
        );
        tries++
      )
        y -= 30;
      y = Math.max(28, Math.min(height - 32, y));
      label.button.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-100%)`;
      label.button.style.setProperty(
        "--leader-height",
        `${Math.max(13, anchorY - y + 13)}px`,
      );
      occupied.push({ x, y, width: labelWidth });
    }
    const block = state.model.buildings.find((b) => b.id === "research-d")!;
    floorLabels.forEach((tag, index) => {
      tag.hidden = state.progress < 0.8 || width < 700;
      if (tag.hidden) return;
      const level = block.levels[index],
        box = bounds(level.outline),
        entry = levelRegistry.get(level.id)!;
      projected
        .set(box.maxX + 0.4, entry.group.position.y + 0.15, box.cz + 1)
        .project(camera);
      const x = Math.min(width - 100, (projected.x * 0.5 + 0.5) * width);
      const y = (-projected.y * 0.5 + 0.5) * height;
      tag.style.transform = `translate3d(${x}px,${y}px,0)`;
    });
  }
  const desiredPosition = new T.Vector3(),
    desiredTarget = new T.Vector3();
  let lastFocus = state.focus,
    lastReset = -1,
    lastView = "",
    lastZoom = 0,
    first = true,
    moving = true;
  function frameCampus() {
    desiredTarget.set(0, 0.1, 3.5);
    const scale = width < 700 ? 1.5 : 1.08;
    desiredPosition.set(31 * scale, 37 * scale, 42 * scale);

    moving = true;
  }
  controls.addEventListener("start", () => {
    moving = false;
    stopOrbit();
  });
  frameCampus();
  camera.position.copy(desiredPosition);
  controls.target.copy(desiredTarget);
  controls.update();
  let raf = 0,
    last = 0;
  function render(time: number) {
    if (disposed) return;
    raf = requestAnimationFrame(render);
    if (
      !visible ||
      document.hidden ||
      time - last < (width < 700 ? 1000 / 30 : 1000 / 60)
    )
      return;
    const dt = Math.min(0.1, (time - last) / 1000 || 1 / 60);
    last = time;
    const ease = state.reduced || first ? 1 : damping(dt);
    syncModel();
    syncPresentation();
    syncSelection();
    if (previousResolution !== state.highResolution) resize();
    if (lastReset !== state.resetCamera) {
      frameCampus();
      lastReset = state.resetCamera;
      lastView = "";
    }
    if (lastFocus !== state.focus) {
      const l = selectedLevel(state.model, state.selection);
      if (l) {
        const b = bounds(l.outline),
          r = levelRegistry.get(l.id)!,
          distance = Math.max(b.width, b.depth) * 2.0 + 5;
        desiredTarget.set(b.cx, r.group.position.y + 0.3, b.cz);
        desiredPosition
          .copy(desiredTarget)
          .add(
            state.view === "plan"
              ? new T.Vector3(0, distance, 0.001)
              : new T.Vector3(distance * 0.6, distance * 0.75, distance * 0.85),
          );
        moving = true;
      }
      lastFocus = state.focus;
    }
    if (lastView !== state.view) {
      if (state.view === "plan") {
        const distance = camera.position.distanceTo(controls.target);
        desiredTarget.copy(controls.target);
        desiredPosition
          .copy(desiredTarget)
          .add(new T.Vector3(0, distance, 0.001));
        moving = true;
      } else if (lastView) {
        const distance = camera.position.distanceTo(controls.target);
        desiredTarget.copy(controls.target);
        desiredPosition
          .copy(desiredTarget)
          .add(
            new T.Vector3(distance * 0.48, distance * 0.58, distance * 0.64),
          );
        moving = true;
      }
      lastView = state.view;
    }
    if (lastZoom !== state.zoom) {
      const delta = state.zoom - lastZoom,
        offset = camera.position
          .clone()
          .sub(controls.target)
          .multiplyScalar(Math.pow(0.82, delta));
      offset.clampLength(controls.minDistance, controls.maxDistance);
      desiredTarget.copy(controls.target);
      desiredPosition.copy(controls.target).add(offset);
      moving = true;
      lastZoom = state.zoom;
    }
    const pose = storyPose(state.progress);
    if (!state.editing) {
      const p = state.reduced ? 0.5 : pose.camera;
      const scale = width < 700 ? 1.18 : 0.98;
      const angle = 0.56 - p * 0.06;
      const distance = 56 * scale;
      desiredTarget.set(
        1,
        0.5 +
          (state.reduced ? Number(pose.chapter === 2) : pose.separation) * 0.8,
        3.4,
      );
      desiredPosition.set(
        Math.sin(angle) * distance,
        (36 + p * 0.6) * scale,
        Math.cos(angle) * distance,
      );
      moving = camera.position.distanceTo(desiredPosition) > 0.005;
    }
    if (
      labelLayer.hidden !==
      (state.editing || !state.labels || state.progress < 0.27)
    )
      needsRender = true;
    grid.visible = state.editing;
    if (moving) {
      camera.position.lerp(desiredPosition, ease);
      controls.target.lerp(desiredTarget, ease);
      if (camera.position.distanceTo(desiredPosition) < 0.02) moving = false;
    }
    controls.enableRotate = state.editing && state.view !== "plan";
    controls.enablePan = state.editing;
    controls.enableZoom = state.editing;
    controls.touches.ONE = state.view === "plan" ? T.TOUCH.PAN : T.TOUCH.ROTATE;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.18;
    const cameraMoved = controls.update(dt);
    let levelsMoving = false;
    for (const r of levelRegistry.values()) {
      const i = r.group.userData.levelIndex as number;
      const assembly = state.editing ? 1 : pose.assembly;
      const reveal = state.reduced
        ? pose.chapter === 0
          ? 0
          : 1
        : smoothRange(assembly, i * 0.08, 0.68 + i * 0.08);
      const scaleY = state.editing ? 1 : 0.06 + 0.94 * reveal;
      const separation = state.editing
        ? state.mode === "exploded"
          ? 1
          : 0
        : state.reduced
          ? pose.chapter === 2
            ? 1
            : 0
          : pose.separation;
      const targetY =
        r.group.userData.baseY * (state.editing ? 1 : reveal) +
        i * separation * (state.editing ? 1.65 : 0.95);
      if (
        Math.abs(r.group.position.y - targetY) > 0.001 ||
        Math.abs(r.group.scale.y - scaleY) > 0.001
      )
        levelsMoving = true;
      r.group.position.y = T.MathUtils.lerp(r.group.position.y, targetY, ease);
      r.group.scale.y = T.MathUtils.lerp(r.group.scale.y, scaleY, ease);
      if (!state.editing) r.group.visible = i === 0 || reveal > 0.03;
      for (const child of r.group.children)
        if (child.userData.roof) {
          child.position.y =
            child.userData.baseY + separation * (state.editing ? 0.8 : 0.35);
        }
    }
    highlight.position.y =
      levelRegistry.get(state.selection.level)?.group.position.y || 0;
    if (needsRender || moving || cameraMoved || levelsMoving || first) {
      renderer.render(scene, camera);
      placeLabels();
      needsRender = false;
    }
    if (first) {
      first = false;
      cb.ready();
    }
  }
  raf = requestAnimationFrame(render);
  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    observer.disconnect();
    intersection.disconnect();
    renderer.domElement.removeEventListener("pointerdown", down, true);
    renderer.domElement.removeEventListener("pointermove", move);
    renderer.domElement.removeEventListener("pointerup", up);
    renderer.domElement.removeEventListener("pointercancel", cancel);
    renderer.domElement.removeEventListener("webglcontextlost", lost);
    controls.dispose();
    const geometries = new Set<T.BufferGeometry>(),
      mats = new Set<T.Material>();
    scene.traverse((o) => {
      if (o instanceof T.Mesh || o instanceof T.LineSegments) {
        geometries.add(o.geometry);
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          mats.add(m);
      }
    });
    geometries.forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
    Object.values(materials).forEach((m) => m.dispose());
    selectMat.dispose();
    lineMat.dispose();
    handleMat.dispose();
    sharedBox.dispose();
    handleGeometry.dispose();
    assetCleanup();
    surfaces.dispose();
    env.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    labelLayer.remove();
  };
}
