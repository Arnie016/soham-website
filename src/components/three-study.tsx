"use client";
import { useEffect, useRef, useState } from "react";
import {
  RotateCcw,
  Move,
  Layers3,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
export function ThreeStudy({
  decorative = false,
  paused = false,
}: {
  decorative?: boolean;
  paused?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const control = useRef<{
    reset: () => void;
    toggle: () => void;
    rotate: (angle: number) => void;
    pause: () => void;
  }>({ reset: () => {}, toggle: () => {}, rotate: () => {}, pause: () => {} });
  const [failed, setFailed] = useState(false);
  const [wire, setWire] = useState(decorative);
  const [stopped, setStopped] = useState(false);
  useEffect(() => {
    let cleanup = () => {};
    let cancelled = false;
    (async () => {
      const THREE = await import("three");
      const { OrbitControls } =
        await import("three/examples/jsm/controls/OrbitControls.js");
      if (cancelled || !host.current) return;
      const container = host.current;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
        });
      } catch {
        setFailed(true);
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
      camera.position.set(18, 15, 20);
      const orbit = new OrbitControls(camera, renderer.domElement);
      orbit.target.set(0, 1, 0);
      orbit.enableDamping = true;
      orbit.enablePan = false;
      orbit.enableZoom = !decorative;
      orbit.minDistance = 15;
      orbit.maxDistance = 40;
      orbit.minPolarAngle = 0.35;
      orbit.maxPolarAngle = Math.PI / 2.2;
      orbit.enabled = !decorative;
      orbit.autoRotate = true;
      orbit.autoRotateSpeed = 0.35;
      orbit.saveState();
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
      const model = new THREE.Group();
      scene.add(model);
      const geometries: InstanceType<typeof THREE.BufferGeometry>[] = [];
      const materials: InstanceType<typeof THREE.Material>[] = [];
      const solid = new THREE.MeshStandardMaterial({
        color: 0xc8c7b7,
        roughness: 0.94,
      });
      const roof = new THREE.MeshStandardMaterial({
        color: 0xe4e1d6,
        roughness: 1,
      });
      const glass = new THREE.MeshStandardMaterial({
        color: 0x505e56,
        roughness: 0.45,
        metalness: 0.15,
      });
      const line = new THREE.LineBasicMaterial({
        color: decorative ? 0x777f70 : 0x6b7162,
        transparent: true,
        opacity: decorative ? 0.65 : 0.33,
      });
      materials.push(solid, roof, glass, line);
      const meshes: InstanceType<typeof THREE.Mesh>[] = [];
      const box = (
        x: number,
        y: number,
        z: number,
        w: number,
        h: number,
        d: number,
        mat = solid,
      ) => {
        const g = new THREE.BoxGeometry(w, h, d);
        geometries.push(g);
        const mesh = new THREE.Mesh(g, mat);
        mesh.position.set(x, y + h / 2, z);
        model.add(mesh);
        meshes.push(mesh);
        const e = new THREE.EdgesGeometry(g);
        geometries.push(e);
        const lines = new THREE.LineSegments(e, line);
        lines.position.copy(mesh.position);
        model.add(lines);
        return mesh;
      };
      box(0, -0.25, 0, 18, 0.25, 13, roof);
      // Original schematic courtyard massing, not a measured model of a portfolio project.
      for (const [x, z, w, d] of [
        [-4, -2, 3, 7],
        [1, -4, 7, 2.5],
        [5, 1, 2.5, 7],
        [0, 4, 6, 2.5],
      ]) {
        box(x, 0, z, w, 2.3, d);
        box(x, 2.3, z, w + 0.35, 0.15, d + 0.35, roof);
        for (let level = 0; level < 2; level++)
          box(
            x,
            level * 0.85 + 0.45,
            z + d / 2 + 0.02,
            w - 0.5,
            0.55,
            0.04,
            glass,
          );
        for (let n = 0; n < Math.floor(w / 0.65); n++)
          box(
            x - w / 2 + 0.32 + n * 0.65,
            0,
            z + d / 2 + 0.1,
            0.09,
            2.3,
            0.12,
            roof,
          );
      }
      for (let i = 0; i < 3; i++) {
        const g = new THREE.CylinderGeometry(
          1.4 + i * 0.06,
          1.4 + i * 0.06,
          0.65,
          36,
        );
        geometries.push(g);
        const m = new THREE.Mesh(g, i % 2 ? glass : roof);
        m.position.set(-0.8, 0.35 + i * 0.7, 0.2);
        model.add(m);
        meshes.push(m);
        const e = new THREE.EdgesGeometry(g);
        geometries.push(e);
        const l = new THREE.LineSegments(e, line);
        l.position.copy(m.position);
        model.add(l);
      }
      for (const [x, z] of [
        [-7, -4],
        [-7, 1],
        [-7, 4],
        [6, -5],
        [2, 0],
        [1, 1],
        [7, 4],
      ]) {
        box(x, 0, z, 0.1, 1, 0.1, glass);
        const g = new THREE.IcosahedronGeometry(0.6, 1);
        geometries.push(g);
        const m = new THREE.Mesh(g, glass);
        m.position.set(x, 1.3, z);
        model.add(m);
        meshes.push(m);
      }
      scene.add(new THREE.HemisphereLight(0xffffff, 0xa5a48d, 2.7));
      const sun = new THREE.DirectionalLight(0xfff7e4, 3);
      sun.position.set(-5, 14, 10);
      scene.add(sun);
      let userPaused = false;
      let wireMode = decorative;
      const visibility = () => meshes.forEach((m) => (m.visible = !wireMode));
      visibility();
      control.current = {
        reset: () => {
          orbit.reset();
        },
        toggle: () => {
          wireMode = !wireMode;
          visibility();
          setWire(wireMode);
        },
        rotate: (angle) => {
          camera.position
            .sub(orbit.target)
            .applyAxisAngle(new THREE.Vector3(0, 1, 0), angle)
            .add(orbit.target);
          orbit.update();
        },
        pause: () => {
          userPaused = !userPaused;
          setStopped(userPaused);
        },
      };
      const resize = () => {
        const w = container.clientWidth,
          h = container.clientHeight;
        if (!w || !h) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      const observer = new ResizeObserver(resize);
      observer.observe(container);
      resize();
      let inView = true;
      const intersection = new IntersectionObserver(
        ([entry]) => (inView = entry.isIntersecting),
      );
      intersection.observe(container);
      let frame = 0;
      let last = 0;
      const render = (time: number) => {
        frame = requestAnimationFrame(render);
        if (time - last < 33 || !inView || document.hidden) return;
        last = time;
        orbit.autoRotate = !paused && !userPaused && !reduced.matches;
        orbit.update();
        renderer.render(scene, camera);
      };
      render(0);
      const onLoss = (event: Event) => {
        event.preventDefault();
        setFailed(true);
      };
      renderer.domElement.addEventListener("webglcontextlost", onLoss);
      cleanup = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        intersection.disconnect();
        orbit.dispose();
        geometries.forEach((g) => g.dispose());
        materials.forEach((m) => m.dispose());
        renderer.dispose();
        renderer.domElement.remove();
      };
    })().catch(() => setFailed(true));
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [decorative, paused]);
  return (
    <div
      className={`three-study ${decorative ? "decorative" : ""}`}
      aria-hidden={decorative || undefined}
    >
      <div
        className="three-canvas"
        ref={host}
        role={decorative ? undefined : "img"}
        aria-label={
          decorative
            ? undefined
            : "Interactive schematic of a courtyard building. Drag to rotate, or use the rotate left and right buttons. Reset view restores the camera."
        }
      />
      {failed && (
        <div className="three-fallback">
          <img
            src="/portfolio/thesis/page-14.jpg"
            alt="Architectural site plan"
          />
          <span>Site plan study</span>
        </div>
      )}
      {!decorative && !failed && (
        <>
          <span className="model-hint">
            <Move size={13} /> Drag to explore
          </span>
          <div className="model-controls">
            <button
              onClick={() => control.current.toggle()}
              aria-pressed={wire}
            >
              <Layers3 size={16} />
              {wire ? "Show materials" : "Show structure"}
            </button>
            <button
              aria-label="Rotate model left"
              onClick={() => control.current.rotate(-0.3)}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              aria-label="Rotate model right"
              onClick={() => control.current.rotate(0.3)}
            >
              <ChevronRight size={16} />
            </button>
            <button
              aria-label={
                stopped ? "Play model rotation" : "Pause model rotation"
              }
              onClick={() => control.current.pause()}
            >
              {stopped ? <Play size={14} /> : <Pause size={14} />}
            </button>
            <button
              aria-label="Reset model view"
              onClick={() => control.current.reset()}
            >
              <RotateCcw size={16} />
            </button>
          </div>
          <span className="model-note">
            Schematic spatial study · not a construction model
          </span>
        </>
      )}
    </div>
  );
}
