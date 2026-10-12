import * as T from "three";
import type { Finish } from "./editor-model";

/** Original procedural textures: no remote assets, texture requests or licences. */
export function createStudyMaterials(renderer: T.WebGLRenderer) {
  const textures: T.Texture[] = [];
  function surface(kind: Finish | "earth" | "road", base: string) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const context = canvas.getContext("2d")!;
    context.fillStyle = base;
    context.fillRect(0, 0, 512, 512);
    let seed = 1742;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    if (kind === "brick" || kind === "stone") {
      const rowHeight = kind === "brick" ? 16 : 64;
      const brickWidth = kind === "brick" ? 40 : 96;
      context.fillStyle = kind === "brick" ? "#91755a" : "#908e7f";
      context.fillRect(0, 0, 512, 512);
      for (let row = 0; row < 512 / rowHeight; row++) {
        for (let col = -1; col < 512 / brickWidth + 1; col++) {
          const light =
            kind === "brick" ? 45 + random() * 12 : 57 + random() * 13;
          context.fillStyle =
            kind === "brick"
              ? `hsl(${24 + random() * 8} 32% ${light}%)`
              : `hsl(42 10% ${light}%)`;
          context.fillRect(
            col * brickWidth + ((row % 2) * brickWidth) / 2 + 1,
            row * rowHeight + 1,
            brickWidth - 2,
            rowHeight - 2,
          );
        }
      }
    }
    if (kind === "timber") {
      for (let x = 0; x < 512; x += 3) {
        context.strokeStyle = `rgba(48,28,12,${0.04 + random() * 0.14})`;
        context.beginPath();
        context.moveTo(x, 0);
        context.bezierCurveTo(x + 8, 150, x - 7, 320, x + 3, 512);
        context.stroke();
      }
    }
    if (kind === "plaster") {
      context.strokeStyle = "#d0cec1";
      context.lineWidth = 1;
      for (let i = 0; i <= 512; i += 128) {
        context.beginPath();
        context.moveTo(i, 0);
        context.lineTo(i, 512);
        context.moveTo(0, i);
        context.lineTo(512, i);
        context.stroke();
      }
    }
    const pixels = context.getImageData(0, 0, 512, 512);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const grain =
        (random() - 0.5) * (kind === "green" || kind === "earth" ? 34 : 14);
      for (let c = 0; c < 3; c++) pixels.data[i + c] += grain;
    }
    context.putImageData(pixels, 0, 0);
    const map = new T.CanvasTexture(canvas);
    map.colorSpace = T.SRGBColorSpace;
    map.wrapS = map.wrapT = T.RepeatWrapping;
    map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    textures.push(map);
    const bump = map.clone();
    bump.colorSpace = T.NoColorSpace;
    textures.push(bump);
    return new T.MeshStandardMaterial({
      color: "#ffffff",
      map,
      bumpMap: bump,
      bumpScale: kind === "brick" ? 0.013 : 0.006,
      roughness: kind === "timber" ? 0.76 : 0.94,
    });
  }
  const finishes = {
    brick: surface("brick", "#b7845a"),
    stone: surface("stone", "#a8a598"),
    timber: surface("timber", "#8c633a"),
    plaster: surface("plaster", "#e7e5db"),
    green: surface("green", "#78845b"),
  };
  const earth = surface("earth", "#a3a27b");
  const road = surface("road", "#777a75");
  return {
    finishes,
    earth,
    road,
    dispose: () => textures.forEach((t) => t.dispose()),
  };
}
