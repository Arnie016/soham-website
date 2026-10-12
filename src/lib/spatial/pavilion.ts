import * as T from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { SSAOPass } from "three/examples/jsm/postprocessing/SSAOPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type SceneMode = "auto" | "day" | "layers" | "dusk";
export type PavilionState = {
  progress: number;
  mode: SceneMode;
  paused: boolean;
  reduced: boolean;
  turn: number;
  highResolution: boolean;
};

/** An original, explicitly labelled spatial study, not a portfolio building. */
export function createPavilion(
  host: HTMLDivElement,
  state: PavilionState,
  onReady: () => void,
  onError: () => void,
) {
  const renderer = new T.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(
    Math.min(devicePixelRatio, innerWidth < 700 ? 1.35 : 1.65),
  );
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.96;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute("aria-hidden", "true");

  const scene = new T.Scene();
  const dayColor = new T.Color("#bccbd0"),
    nightColor = new T.Color("#263a49");
  scene.background = dayColor.clone();
  scene.fog = new T.Fog(dayColor, 50, 125);
  const camera = new T.PerspectiveCamera(33, 1, 0.1, 150);
  const pmrem = new T.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.03);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.42;
  room.dispose();
  pmrem.dispose();

  let seed = 13;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const surface = document.createElement("canvas");
  surface.width = surface.height = 256;
  const ctx = surface.getContext("2d")!;
  ctx.fillStyle = "#e7dfcf";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 22000; i++) {
    const value = 75 + random() * 130;
    ctx.fillStyle = `rgba(${value},${value * 0.94},${value * 0.84},${random() * 0.13})`;
    ctx.fillRect(random() * 256, random() * 256, 1 + random() * 3, 1);
  }
  for (let i = 0; i < 75; i++) {
    ctx.fillStyle = `rgba(147,128,105,${random() * 0.06})`;
    ctx.fillRect(0, random() * 256, 256, 0.5 + random());
  }
  const stoneTexture = new T.CanvasTexture(surface);
  stoneTexture.wrapS = stoneTexture.wrapT = T.RepeatWrapping;
  stoneTexture.repeat.set(2, 2);
  stoneTexture.colorSpace = T.SRGBColorSpace;
  const stone = new T.MeshStandardMaterial({
    color: "#e4dac5",
    map: stoneTexture,
    bumpMap: stoneTexture,
    bumpScale: 0.055,
    roughness: 0.87,
  });
  const plaster = new T.MeshStandardMaterial({
    color: "#f3ecde",
    roughness: 0.82,
  });
  const limestone = new T.MeshStandardMaterial({
    color: "#b8b5a6",
    roughness: 0.96,
    map: stoneTexture,
  });
  const bronze = new T.MeshStandardMaterial({
    color: "#665141",
    metalness: 0.6,
    roughness: 0.4,
  });
  const timber = new T.MeshStandardMaterial({
    color: "#926c4b",
    roughness: 0.7,
  });
  const glass = new T.MeshStandardMaterial({
    color: "#758e91",
    metalness: 0.65,
    roughness: 0.18,
    transparent: true,
    opacity: 0.63,
  });
  const soil = new T.MeshStandardMaterial({ color: "#737260", roughness: 1 });
  const foliage = new T.MeshStandardMaterial({
    color: "#71806a",
    roughness: 0.95,
  });
  const paleLeaves = new T.MeshStandardMaterial({
    color: "#9ba58a",
    roughness: 0.95,
  });
  const glow = new T.MeshStandardMaterial({
    color: "#fff1cd",
    emissive: "#ffa74c",
    emissiveIntensity: 0.04,
  });
  const model = new T.Group();
  scene.add(model);
  const body = new T.Group(),
    upper = new T.Group(),
    roof = new T.Group(),
    cap = new T.Group();
  model.add(body, upper, roof, cap);

  function box(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat: T.Material = plaster,
    parent: T.Group = body,
  ) {
    const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function cylinder(
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
    mat: T.Material,
    parent = body,
    topRadius = r,
  ) {
    const mesh = new T.Mesh(new T.CylinderGeometry(topRadius, r, h, 32), mat);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function roundedPath(
    path: T.Shape | T.Path,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ) {
    path.moveTo(x + r, y);
    path.lineTo(x + w - r, y);
    path.quadraticCurveTo(x + w, y, x + w, y + r);
    path.lineTo(x + w, y + h - r);
    path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    path.lineTo(x + r, y + h);
    path.quadraticCurveTo(x, y + h, x, y + h - r);
    path.lineTo(x, y + r);
    path.quadraticCurveTo(x, y, x + r, y);
  }
  function terrace(y: number, parent: T.Group) {
    const shape = new T.Shape();
    roundedPath(shape, -6.6, -4.3, 13.2, 8.6, 0.9);
    const hole = new T.Path();
    roundedPath(hole, -2.45, -1.75, 5.2, 4.45, 1.8);
    shape.holes.push(hole);
    const geometry = new T.ExtrudeGeometry(shape, {
      depth: 0.32,
      bevelEnabled: false,
      curveSegments: 30,
    });
    geometry.rotateX(-Math.PI / 2);
    const mesh = new T.Mesh(geometry, stone);
    mesh.position.y = y;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  box(0, -0.8, 0, 19.8, 0.65, 15.8, limestone);
  box(0, -0.16, 0, 19.9, 0.13, 15.9, stone);
  box(-0.3, 0, -0.9, 14.6, 0.24, 11.5, stone);
  for (let z = -6; z < 6; z += 1.1)
    box(0, 0.005, z, 19.3, 0.012, 0.017, limestone);
  for (let x = -9; x < 10; x += 1.15)
    box(x, 0.005, 0, 0.015, 0.012, 15.3, limestone);

  // A generous glazed room, open colonnade and deep-shaded arched loggia.
  box(-4.7, 0.24, -1.1, 3.35, 0.05, 5.6, timber);
  box(-6.28, 0.24, -1.1, 0.22, 3.7, 5.6, plaster);
  box(-5.8, 0.3, -0.7, 0.7, 0.52, 2.8, plaster);
  box(-6.02, 0.81, -0.7, 0.24, 0.36, 2.8, plaster);
  box(-4.5, 0.3, -0.7, 0.6, 0.39, 1.5, timber);
  box(-4.5, 0.7, -0.7, 0.7, 0.04, 1.6, stone);
  box(-4.55, 0.24, 1.76, 3.5, 3.5, 0.05, glass);
  box(-2.94, 0.24, -0.75, 0.05, 3.5, 4.75, glass);
  box(-4.7, 0.24, -3.94, 3.65, 3.7, 0.3, stone);
  for (let x = -6.24; x <= -3; x += 0.54)
    box(x, 0.26, 1.8, 0.045, 3.52, 0.06, bronze);
  for (let z = -3.8; z < 1.8; z += 0.56)
    box(-2.92, 0.26, z, 0.06, 3.52, 0.045, bronze);
  box(-4.5, 3.72, 1.72, 3.5, 0.035, 0.065, glow);
  box(0.5, 0.24, -3.72, 8.35, 3.7, 0.35, stone);
  for (const x of [-6.1, -2.8, 0.6, 3.5, 6.0])
    for (const z of [-3.4, 3.35]) {
      if (x > -3 && z > 0) continue;
      cylinder(x, 0.24, z, 0.12, 3.78, plaster);
    }
  const archShape = new T.Shape();
  archShape.moveTo(-4.6, 0);
  archShape.lineTo(-4.6, 3.8);
  archShape.lineTo(4.6, 3.8);
  archShape.lineTo(4.6, 0);
  for (const center of [3, 0, -3]) {
    archShape.lineTo(center + 1.11, 0);
    archShape.lineTo(center + 1.11, 2.15);
    archShape.absarc(center, 2.15, 1.11, 0, Math.PI, false);
    archShape.lineTo(center - 1.11, 0);
  }
  archShape.closePath();
  const arches = new T.Mesh(
    new T.ExtrudeGeometry(archShape, {
      depth: 0.52,
      bevelEnabled: true,
      bevelSize: 0.015,
      bevelThickness: 0.015,
      bevelSegments: 1,
      steps: 1,
      curveSegments: 28,
    }),
    stone,
  );
  arches.position.set(1.4, 0.24, 3.05);
  arches.castShadow = true;
  arches.receiveShadow = true;
  body.add(arches);
  box(5.95, 0.24, -0.1, 0.38, 3.8, 6.6, stone);
  // Slim pergola battens animate with the upper terrace, keeping their structure legible.
  for (let x = -1.6; x < 5.8; x += 0.42)
    box(x, 3.98, -2.7, 0.1, 0.16, 2.1, timber, roof);
  terrace(4.05, roof);
  box(-4.5, 4.4, -1.1, 3.8, 0.18, 5.8, stone, upper);
  box(-6.1, 4.58, -1.1, 0.36, 2.7, 5.8, plaster, upper);
  box(-4.45, 4.58, -3.9, 3.6, 2.7, 0.35, plaster, upper);
  box(-2.8, 4.58, -1.1, 0.05, 2.65, 5.45, glass, upper);
  box(-4.5, 4.58, 1.75, 3.8, 2.65, 0.05, glass, upper);
  for (let z = -3.8; z < 1.8; z += 0.58)
    box(-2.75, 4.58, z, 0.055, 2.7, 0.055, bronze, upper);
  for (let x = -6.2; x < -2.7; x += 0.58)
    box(x, 4.58, 1.8, 0.055, 2.7, 0.055, bronze, upper);
  box(-4.48, 7.28, -1.1, 4.4, 0.24, 6.35, plaster, cap);
  box(-2.73, 7.05, -1.1, 0.045, 0.028, 5.2, glow, upper);
  // Stair connects the ground and terrace. Fine railings catch the evening light.
  for (let i = 0; i < 19; i++) {
    box(-7.04, 0.2, 3.25 - i * 0.3, 1.35, (i + 1) * 0.212, 0.31, stone);
    if (i % 3 === 0)
      box(
        -7.65,
        0.2 + (i + 1) * 0.212,
        3.25 - i * 0.3,
        0.035,
        0.85,
        0.035,
        bronze,
      );
  }
  const rail = box(-7.65, 3.1, 0.55, 0.042, 0.045, 6.55, bronze);
  rail.rotation.x = -0.614;
  for (let i = 0; i < 6; i++)
    box(0.6, 0.24, -2.15 + i * 0.14, 2.2, 0.42, 0.06, timber);
  // Reflecting pool and stepping stones.
  box(2.6, 0.0, 5.25, 9.0, 0.13, 3.4, bronze);
  const reflector = new Reflector(new T.PlaneGeometry(8.78, 3.18), {
    color: 0x91b2b2,
    textureWidth: 512,
    textureHeight: 512,
    clipBias: 0.003,
  });
  reflector.rotation.x = -Math.PI / 2;
  reflector.position.set(2.6, 0.15, 5.25);
  model.add(reflector);
  const reflectScene = reflector.onBeforeRender.bind(reflector);
  reflector.onBeforeRender = (...args) => {
    if (!scene.overrideMaterial) reflectScene(...args);
  };
  const water = reflector.material as T.ShaderMaterial;
  water.uniforms.uTime = { value: 0 };
  water.fragmentShader = water.fragmentShader
    .replace("uniform vec3 color;", "uniform vec3 color; uniform float uTime;")
    .replace(
      "vec4 base = texture2DProj( tDiffuse, vUv );",
      "vec4 waveUv = vUv; waveUv.x += sin(vUv.y * 38.0 + uTime * 0.6) * 0.0025; waveUv.y += sin(vUv.x * 51.0 - uTime * 0.5) * 0.002; vec4 base = texture2DProj(tDiffuse, waveUv);",
    );
  for (let i = 0; i < 5; i++)
    box(-2.2 + i * 0.8, 0.16, 5.1, 0.59, 0.08, 0.8, stone);
  box(-5.6, 0.02, 5.65, 4.8, 0.09, 3.0, soil);
  cylinder(0.3, 0.24, 0.25, 1.35, 0.24, limestone);
  cylinder(0.3, 0.48, 0.25, 1.18, 0.025, soil);

  const leafGeo = new T.IcosahedronGeometry(0.11, 0);
  const leafMeshes: T.InstancedMesh[] = [];
  function tree(
    x: number,
    z: number,
    height: number,
    radius: number,
    base = 0.15,
  ) {
    cylinder(x, base, z, 0.08, height * 0.77, timber, body, 0.037);
    for (let i = 0; i < 4; i++) {
      const branch = cylinder(
        x,
        base + height * 0.42,
        z,
        0.035,
        height * 0.44,
        timber,
        body,
        0.013,
      );
      branch.rotation.z = 0.4 * Math.cos(i * 1.7);
      branch.rotation.x = 0.5 * Math.sin(i * 1.7);
    }
    const leaves = new T.InstancedMesh(
      leafGeo,
      random() > 0.5 ? foliage : paleLeaves,
      520,
    );
    const dummy = new T.Object3D();
    for (let i = 0; i < 520; i++) {
      const angle = random() * Math.PI * 2,
        r = Math.sqrt(random()) * radius;
      dummy.position.set(
        x + Math.cos(angle) * r,
        base + height * 0.79 + (random() - 0.45) * radius * 1.15,
        z + Math.sin(angle) * r,
      );
      dummy.scale.set(
        0.7 + random() * 1.8,
        0.3 + random() * 0.5,
        0.7 + random() * 1.5,
      );
      dummy.rotation.set(random() * Math.PI, random() * Math.PI, 0);
      dummy.updateMatrix();
      leaves.setMatrixAt(i, dummy.matrix);
    }
    leaves.castShadow = true;
    leaves.receiveShadow = true;
    body.add(leaves);
    leafMeshes.push(leaves);
  }
  tree(0.3, 0.25, 4.0, 1.15, 0.5);
  tree(-8.35, -4.6, 3.6, 1.15);
  tree(8.05, -4.25, 4.2, 1.35);
  tree(8.2, 1.5, 2.8, 1.0);
  for (let i = 0; i < 3; i++) tree(-6.9 + i * 1.5, 5.65, 1.05, 0.5);
  // Seating and human-scale details, kept subordinate to the architecture.
  for (const x of [3.3, 4.8]) {
    box(x, 0.25, 0.3, 0.85, 0.24, 1.7, timber);
    box(x, 0.5, 0.3, 0.78, 0.13, 1.6, plaster);
    const back = box(x, 0.62, -0.28, 0.78, 0.55, 0.12, plaster);
    back.rotation.x = -0.2;
  }
  for (const [x, z] of [
    [7.2, -6],
    [-8.6, 2],
    [7.3, 6.7],
    [-2, -6],
  ]) {
    box(x, 0.02, z, 0.1, 0.65, 0.1, bronze);
    box(x, 0.65, z, 0.13, 0.04, 0.13, glow);
  }

  // Batch opaque static surfaces by material; animated layers retain separate ownership.
  function mergeGroup(group: T.Group) {
    group.updateMatrixWorld(true);
    const batches = new Map<
      T.Material,
      { source: T.Mesh; geometry: T.BufferGeometry }[]
    >();
    for (const obj of [...group.children]) {
      if (
        !(obj instanceof T.Mesh) ||
        obj instanceof T.InstancedMesh ||
        Array.isArray(obj.material) ||
        obj.material.transparent
      )
        continue;
      const geometry = (
        obj.geometry.index ? obj.geometry.toNonIndexed() : obj.geometry.clone()
      ).applyMatrix4(obj.matrix);
      const items = batches.get(obj.material) || [];
      items.push({ source: obj, geometry });
      batches.set(obj.material, items);
    }
    for (const [material, items] of batches) {
      const geometry = mergeGeometries(
        items.map((i) => i.geometry),
        false,
      );
      if (geometry) {
        const mesh = new T.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
        for (const item of items) {
          group.remove(item.source);
          item.source.geometry.dispose();
        }
      }
      items.forEach((i) => i.geometry.dispose());
    }
  }
  [body, upper, roof, cap].forEach(mergeGroup);
  const groundMaterial = new T.MeshStandardMaterial({
    color: "#bccbd0",
    roughness: 1,
  });
  const ground = new T.Mesh(new T.PlaneGeometry(250, 250), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.84;
  ground.receiveShadow = true;
  scene.add(ground);

  const hemi = new T.HemisphereLight(0xe6f0ff, 0x777064, 1.5);
  scene.add(hemi);
  const sun = new T.DirectionalLight(0xffe3b4, 4.1);
  sun.position.set(-12, 19, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -16;
  sun.shadow.camera.right = 16;
  sun.shadow.camera.top = 16;
  sun.shadow.camera.bottom = -16;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 60;
  sun.shadow.normalBias = 0.035;
  sun.shadow.bias = -0.00015;
  scene.add(sun);
  const fill = new T.DirectionalLight(0xbcd9ff, 0.75);
  fill.position.set(12, 5, -6);
  scene.add(fill);
  const warmLights: T.PointLight[] = [];
  for (const [x, y, z] of [
    [-4.4, 2.1, 0.4],
    [-4.4, 6.1, 0.2],
    [0, 2.4, -2.7],
    [4.5, 2.1, 1.8],
  ]) {
    const light = new T.PointLight(0xffbe75, 0, 7, 1.6);
    light.position.set(x, y, z);
    scene.add(light);
    warmLights.push(light);
  }

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
  const beautyPass = new RenderPass(scene, camera);
  const occlusion = new SSAOPass(scene, camera, 1, 1, 16);
  occlusion.kernelRadius = 0.55;
  occlusion.minDistance = 0.002;
  occlusion.maxDistance = 0.075;
  const output = new OutputPass();
  composer.addPass(beautyPass);
  composer.addPass(occlusion);
  composer.addPass(output);
  let w = 0,
    h = 0,
    inView = true,
    frame = 0,
    last = 0,
    elapsed = 0,
    disposed = false,
    highResolution = false;
  let progress = 0,
    angle = 0.67,
    night = 0,
    split = 0,
    mouseX = 0,
    mouseY = 0,
    moveX = 0,
    moveY = 0;
  const target = new T.Vector3(),
    position = new T.Vector3();
  const resize = () => {
    w = host.clientWidth;
    h = host.clientHeight;
    const pixelRatio = highResolution
      ? 3840 / Math.max(w, h, 1)
      : Math.min(devicePixelRatio, w < 700 ? 1.35 : 1.65);
    renderer.setPixelRatio(pixelRatio);
    composer.setPixelRatio(
      highResolution ? pixelRatio : Math.min(devicePixelRatio, 1.25),
    );
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    composer.setSize(w, h);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  const intersection = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
  });
  intersection.observe(host);
  const pointer = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const bounds = host.getBoundingClientRect();
    mouseX = (event.clientX - bounds.left) / bounds.width - 0.5;
    mouseY = (event.clientY - bounds.top) / bounds.height - 0.5;
  };
  const leave = () => {
    mouseX = 0;
    mouseY = 0;
  };
  host.parentElement?.addEventListener("pointermove", pointer);
  host.parentElement?.addEventListener("pointerleave", leave);
  const lost = (e: Event) => {
    e.preventDefault();
    onError();
  };
  renderer.domElement.addEventListener("webglcontextlost", lost);
  const lerp = T.MathUtils.lerp;
  function render(now: number) {
    if (disposed) return;
    frame = requestAnimationFrame(render);
    if (
      !inView ||
      document.hidden ||
      now - last < 1000 / (state.highResolution ? 24 : w < 700 ? 30 : 45)
    )
      return;
    if (state.highResolution !== highResolution) {
      highResolution = state.highResolution;
      resize();
    }
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const moving = !state.paused && !state.reduced;
    if (moving) elapsed += dt;
    const blend = state.reduced ? 1 : 1 - Math.exp(-dt * 3.1);
    if (!state.paused)
      progress = lerp(progress, state.reduced ? 0 : state.progress, blend);
    const desiredSplit =
      state.mode === "layers"
        ? 1
        : state.mode === "auto"
          ? Math.sin(Math.min(progress * 1.48, 1) * Math.PI) * 0.85
          : 0;
    split = lerp(split, desiredSplit, blend);
    night = lerp(
      night,
      state.mode === "dusk"
        ? 1
        : state.mode === "auto"
          ? Math.max(0, (progress - 0.62) / 0.38)
          : 0,
      blend,
    );
    moveX = lerp(moveX, moving ? mouseX : 0, blend);
    moveY = lerp(moveY, moving ? mouseY : 0, blend);
    angle = lerp(
      angle,
      0.67 +
        progress * 0.73 +
        state.turn +
        moveX * 0.12 +
        Math.sin(elapsed * 0.14) * 0.023,
      blend,
    );
    const mobile = w < 700;
    const radius = mobile ? 47 : 33.5;
    target.set(
      mobile ? 0 : -4.3 + progress * 3.5,
      mobile ? 1.5 : 2.5 + progress * 0.8,
      0,
    );
    position.set(
      Math.sin(angle) * radius + target.x,
      18.2 + progress * 5.2 + moveY * 1.3,
      Math.cos(angle) * radius,
    );
    camera.position.copy(position);
    camera.lookAt(target);
    if (mobile) camera.setViewOffset(w, h, 0, -h * 0.14, w, h);
    else camera.clearViewOffset();
    roof.position.y = split * 2.0;
    upper.position.y = split * 2.7;
    cap.position.y = split * 4.6;
    sun.intensity = lerp(4.1, 0.34, night);
    hemi.intensity = lerp(1.5, 0.8, night);
    fill.intensity = lerp(0.75, 1.8, night);
    glow.emissiveIntensity = lerp(0.04, 3.2, night);
    warmLights.forEach((light) => (light.intensity = night * 19));
    scene.background = dayColor.clone().lerp(nightColor, night);
    (scene.fog as T.Fog).color.copy(scene.background as T.Color);
    groundMaterial.color.copy(dayColor).lerp(nightColor, night);
    water.uniforms.uTime.value = elapsed;
    if (w >= 700) composer.render();
    else renderer.render(scene, camera);
  }
  renderer
    .compileAsync(scene, camera)
    .then(() => {
      if (!disposed) {
        onReady();
        render(performance.now());
      }
    })
    .catch(onError);

  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    intersection.disconnect();
    host.parentElement?.removeEventListener("pointermove", pointer);
    host.parentElement?.removeEventListener("pointerleave", leave);
    renderer.domElement.removeEventListener("webglcontextlost", lost);
    const geometries = new Set<T.BufferGeometry>(),
      materials = new Set<T.Material>();
    scene.traverse((obj) => {
      if (obj instanceof T.Mesh) {
        geometries.add(obj.geometry);
        (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(
          (m) => materials.add(m),
        );
      }
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    stoneTexture.dispose();
    reflector.getRenderTarget().dispose();
    environment.dispose();
    occlusion.dispose();
    output.dispose();
    composer.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
