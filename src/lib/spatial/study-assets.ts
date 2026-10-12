import * as T from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { planPoint } from "./editor-model";

/** CC BY 4.0 landscape context. Credits and modifications live at /credits. */
export async function addStudyAssets(
  parent: T.Group,
  trees: { x: number; z: number; s: number }[],
  isDisposed: () => boolean,
  changed: () => void,
) {
  const manager = new T.LoadingManager();
  if (matchMedia("(max-width: 700px)").matches)
    manager.setURLModifier((url) =>
      url.replace(
        /(prithvika-(?:forest|bench)-texture-\d+)\.webp$/,
        "$1-mobile.webp",
      ),
    );
  const loader = new GLTFLoader(manager);
  const resources: T.Object3D[] = [];
  function dispose() {
    const textures = new Set<T.Texture>();
    const materials = new Set<T.Material>();
    for (const root of resources)
      root.traverse((o) => {
        if (o instanceof T.Mesh) {
          o.geometry.dispose();
          for (const m of Array.isArray(o.material)
            ? o.material
            : [o.material]) {
            materials.add(m);
            for (const v of Object.values(m))
              if (v instanceof T.Texture) textures.add(v);
          }
        }
      });
    textures.forEach((t) => t.dispose());
    materials.forEach((m) => m.dispose());
  }
  function sourceGeometry(mesh: T.Mesh) {
    const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!,
      center = box.getCenter(new T.Vector3());
    geometry.translate(-center.x, -box.min.y, -center.z);
    return { geometry, size: box.getSize(new T.Vector3()) };
  }
  await Promise.allSettled([
    loader.loadAsync("/models/prithvika-forest.glb").then((gltf) => {
      resources.push(gltf.scene);
      if (isDisposed()) return;
      gltf.scene.updateMatrixWorld(true);
      const meshes: T.Mesh[] = [];
      gltf.scene.traverse((o) => {
        if (o instanceof T.Mesh) meshes.push(o);
      });
      // Broadleaf silhouettes, shrubs and ferns only. No botanical/species claim.
      meshes.forEach((source, kind) => {
        const { geometry, size } = sourceGeometry(source);
        const material = (source.material as T.MeshStandardMaterial).clone();
        material.transparent = false;
        material.alphaTest = 0.48;
        material.depthWrite = true;
        material.side = T.DoubleSide;
        material.roughness = 0.92;
        material.metalness = 0;
        const locations =
          kind < 2
            ? trees.filter((_, i) => i % 7 === kind)
            : trees.filter((_, i) => i % 17 === kind);
        const instances = new T.InstancedMesh(
          geometry,
          material,
          locations.length,
        );
        const dummy = new T.Object3D();
        locations.forEach((p, i) => {
          const targetHeight = kind < 2 ? 0.95 + p.s : 0.14 + p.s * 0.45;
          dummy.position.set(p.x + (kind < 2 ? 0.22 : 0.5), 0.015, p.z - 0.2);
          dummy.scale.setScalar(targetHeight / Math.max(size.y, 0.001));
          dummy.rotation.y = i * 2.399;
          dummy.updateMatrix();
          instances.setMatrixAt(i, dummy.matrix);
        });
        instances.castShadow = kind < 2;
        instances.receiveShadow = true;
        instances.name = "Sketchfab landscape by 99.Miles";
        parent.add(instances);
        resources.push(instances);
      });
      changed();
    }),
    loader.loadAsync("/models/prithvika-bench.glb").then((gltf) => {
      resources.push(gltf.scene);
      if (isDisposed()) return;
      gltf.scene.updateMatrixWorld(true);
      gltf.scene.traverse((o) => {
        if (!(o instanceof T.Mesh)) return;
        const { geometry, size } = sourceGeometry(o);
        const instances = new T.InstancedMesh(geometry, o.material, 8);
        const dummy = new T.Object3D(),
          center = planPoint(1003, 332);
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          dummy.position.set(
            center[0] + Math.cos(angle) * 3.7,
            0.026,
            center[1] + Math.sin(angle) * 3.7,
          );
          dummy.scale.setScalar(0.22 / Math.max(size.x, size.z));
          dummy.rotation.y = -angle;
          dummy.updateMatrix();
          instances.setMatrixAt(i, dummy.matrix);
        }
        instances.name = "Wooden benches by TheMadraver";
        instances.castShadow = true;
        instances.receiveShadow = true;
        parent.add(instances);
        resources.push(instances);
      });
      changed();
    }),
  ]);
  return dispose;
}
