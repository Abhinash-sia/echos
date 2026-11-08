/**
 * WebGL 3D Scene Architecture Interfaces
 * Provides a drop-in adapter contract for native WebGL2 and custom GLSL scenes
 */

export interface ScenePointer {
  x: number; // [-1, 1]
  y: number; // [-1, 1]
  targetX: number;
  targetY: number;
}

export interface SceneRenderer {
  init(gl: WebGLRenderingContext | WebGL2RenderingContext, _canvas: HTMLCanvasElement): void;
  resize(width: number, height: number, _dpr: number): void;
  render(time: number, pointer: ScenePointer): void;
  destroy(): void;
  setReducedMotion(reduced: boolean): void;
}
