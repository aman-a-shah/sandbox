import type { Vector2 } from "../types/vector";

export function mustGet2DContext(targetCanvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = targetCanvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D context unavailable");
  }
  return context;
}

export function getCanvasCoordinates(canvas: HTMLCanvasElement, event: MouseEvent): Vector2 {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

export function resizeCanvasDisplay(canvas: HTMLCanvasElement, renderWidth: number, renderHeight: number): void {
  const scale = Math.min(window.innerWidth / renderWidth, window.innerHeight / renderHeight);
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const displayWidth = Math.max(1, Math.floor(renderWidth * safeScale));
  const displayHeight = Math.max(1, Math.floor(renderHeight * safeScale));

  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;
  canvas.style.left = `${Math.floor((window.innerWidth - displayWidth) / 2)}px`;
  canvas.style.top = `${Math.floor((window.innerHeight - displayHeight) / 2)}px`;
}

export function scalePixels(basePixels: number, globalScale: number): number {
  return Math.max(1, Math.round(basePixels * globalScale));
}

export function canvasFont(basePixels: number, globalScale: number): string {
  return `${scalePixels(basePixels, globalScale)}px sans-serif`;
}
