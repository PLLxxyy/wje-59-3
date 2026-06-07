import '@testing-library/jest-dom';
import { vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const canvasContextMap = new WeakMap();

HTMLCanvasElement.prototype.getContext = vi.fn(function () {
  if (!canvasContextMap.has(this)) {
    const ctx = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      rect: vi.fn(),
      ellipse: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(600 * 400 * 4),
        width: 600,
        height: 400,
      })),
      putImageData: vi.fn(),
    };
    canvasContextMap.set(this, ctx);
  }
  return canvasContextMap.get(this);
});

global.confirm = vi.fn(() => true);
global.prompt = vi.fn(() => 'test-file');

let mockImageInstances: any[] = [];

// @ts-ignore - 定义一个可构造的 mock Image
global.Image = function Image() {
  const instance: any = {};
  instance.onload = null;
  instance.src = '';
  mockImageInstances.push(instance);
  setTimeout(() => {
    if (instance.onload) {
      instance.onload();
    }
  }, 0);
  return instance;
} as any;

// 添加 mock 属性供测试使用
Object.defineProperty(global.Image, 'mock', {
  get() {
    return {
      results: mockImageInstances.map((value) => ({ value })),
    };
  },
});
