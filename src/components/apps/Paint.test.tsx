import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Paint from './Paint';
import { useOSStore } from '@/store/useOSStore';
import type { PaintDoc } from '@/types/os';

vi.mock('@/store/useOSStore', () => ({
  useOSStore: vi.fn(),
}));

const getMenuButton = (label: string) => {
  return screen.getByRole('button', {
    name: (content) => content.replace(/\s/g, '').includes(label),
  });
};

const mockPaintDocs: PaintDoc[] = [
  {
    id: 'doc-1',
    name: 'test-pic-1',
    imageData: 'data:image/png;base64,abc123',
    createdAt: 1000,
    updatedAt: 2000,
    isDirty: false,
  },
  {
    id: 'doc-2',
    name: 'test-pic-2',
    imageData: 'data:image/png;base64,def456',
    createdAt: 3000,
    updatedAt: 4000,
    isDirty: false,
  },
];

const mockSavePaintDoc = vi.fn();
const mockUpdateAppState = vi.fn();
const mockCloseWindow = vi.fn();

function createMockStoreState(overrides: Partial<ReturnType<typeof useOSStore>> = {}) {
  const defaultState = {
    paintDocs: mockPaintDocs,
    savePaintDoc: mockSavePaintDoc,
    updateAppState: mockUpdateAppState,
    closeWindow: mockCloseWindow,
    windows: [],
  };

  (useOSStore as unknown as Mock).mockImplementation((selector?: Function) => {
    if (selector) {
      return selector(defaultState);
    }
    return defaultState;
  });

  return defaultState;
}

describe('Paint Component', () => {
  const testWindowId = 'test-window-123';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    createMockStoreState();

    global.Image = vi.fn().mockImplementation(() => ({
      onload: null as null | (() => void),
      src: '',
    }));

    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mock-data');
  });

  function renderPaint(initialAppState: Record<string, any> = {}) {
    const windows = [
      {
        id: testWindowId,
        appId: 'paint',
        appState: initialAppState,
      },
    ];

    (useOSStore as unknown as Mock).mockImplementation((selector?: Function) => {
      const state = {
        paintDocs: mockPaintDocs,
        savePaintDoc: mockSavePaintDoc,
        updateAppState: mockUpdateAppState,
        closeWindow: mockCloseWindow,
        windows,
      };
      if (selector) {
        return selector(state);
      }
      return state;
    });

    return render(<Paint windowId={testWindowId} />);
  }

  it('should render with default state', () => {
    renderPaint();
    expect(getMenuButton('文件')).toBeInTheDocument();
    expect(getMenuButton('编辑')).toBeInTheDocument();
    expect(screen.getByText('已保存')).toBeInTheDocument();
  });

  it('should update title with doc name and dirty state', async () => {
    renderPaint();

    await waitFor(() => {
      expect(mockUpdateAppState).toHaveBeenCalledWith(
        testWindowId,
        expect.objectContaining({
          title: '画图 - 未命名',
        })
      );
    });
  });

  it('should mark as dirty when drawing', () => {
    renderPaint();

    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas).toBeInTheDocument();

    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
    fireEvent.mouseUp(canvas);

    expect(screen.getByText('已修改')).toBeInTheDocument();
  });

  it('should save document when save is clicked', async () => {
    renderPaint();

    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas).toBeInTheDocument();
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
    fireEvent.mouseUp(canvas);

    const fileMenu = getMenuButton('文件');
    fireEvent.click(fileMenu);

    const saveItem = screen.getByText('保存');
    fireEvent.click(saveItem);

    expect(mockSavePaintDoc).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '未命名',
        imageData: 'data:image/png;base64,mock-data',
        isDirty: false,
      })
    );
  });

  it('should handle save as with custom name', async () => {
    const user = userEvent.setup();
    renderPaint();

    (global.prompt as Mock).mockReturnValue('my-drawing');

    const fileMenu = getMenuButton('文件');
    await user.click(fileMenu);

    const saveAsItem = screen.getByText('另存为');
    await user.click(saveAsItem);

    expect(global.prompt).toHaveBeenCalledWith('输入文件名：', '未命名');
    expect(mockSavePaintDoc).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'my-drawing',
        imageData: 'data:image/png;base64,mock-data',
      })
    );
  });

  it('should show confirm dialog when closing with unsaved changes', async () => {
    const user = userEvent.setup();
    renderPaint();

    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas).toBeInTheDocument();
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
    fireEvent.mouseUp(canvas);

    (global.confirm as Mock).mockReturnValue(false);

    const fileMenu = getMenuButton('文件');
    await user.click(fileMenu);

    const exitItem = screen.getByText('退出');
    await user.click(exitItem);

    expect(global.confirm).toHaveBeenCalledWith('未命名 有未保存的更改，是否保存？');
    expect(mockCloseWindow).not.toHaveBeenCalled();
  });

  it('should load image data from appState', async () => {
    let imgInstance: any = null;
    let imageConstructorCalled = false;

    const OriginalImage = global.Image;
    // @ts-ignore
    global.Image = function MockImageForTest() {
      imageConstructorCalled = true;
      imgInstance = {
        onload: null,
        src: '',
      };
      return imgInstance;
    };

    const mockImageData = 'data:image/png;base64,test-image-data';

    renderPaint({
      imageData: mockImageData,
      docId: 'doc-1',
      docName: 'existing-pic',
    });

    await waitFor(() => {
      expect(imageConstructorCalled).toBe(true);
      expect(imgInstance).not.toBeNull();
      expect(imgInstance.src).toBe(mockImageData);
      expect(imgInstance.onload).toBeDefined();
    });

    // @ts-ignore
    global.Image = OriginalImage;
  });

  it('should have paintDocs in store', () => {
    renderPaint();
    expect(mockPaintDocs).toHaveLength(2);
    expect(mockPaintDocs[0].name).toBe('test-pic-1');
    expect(mockPaintDocs[1].name).toBe('test-pic-2');
  });

  it('should handle undo without index errors', () => {
    renderPaint();

    const editMenu = getMenuButton('编辑');
    fireEvent.click(editMenu);

    const undoItem = screen.getByText('撤销');

    expect(() => {
      fireEvent.click(undoItem);
    }).not.toThrow();
  });

  it('should handle redo without index errors', () => {
    renderPaint();

    const editMenu = getMenuButton('编辑');
    fireEvent.click(editMenu);

    const redoItem = screen.getByText('重做');

    expect(() => {
      fireEvent.click(redoItem);
    }).not.toThrow();
  });

  it('should clear canvas on new', async () => {
    const user = userEvent.setup();
    renderPaint();

    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas).toBeInTheDocument();
    const ctx = canvas.getContext('2d')!;
    const initialFillRectCalls = ctx.fillRect.mock.calls.length;

    const fileMenu = getMenuButton('文件');
    await user.click(fileMenu);

    const newItem = screen.getByText('新建');
    await user.click(newItem);

    expect(ctx.fillRect.mock.calls.length).toBeGreaterThan(initialFillRectCalls);
  });

  it('should export PNG with correct filename', () => {
    renderPaint({ docName: 'my-pic' });

    const mockLink = {
      click: vi.fn(),
      download: '',
      href: '',
    };
    const originalCreateElement = document.createElement;
    const mockCreateElement = vi.spyOn(document, 'createElement');
    mockCreateElement.mockImplementation((tag: string) => {
      if (tag === 'a') {
        return mockLink as unknown as HTMLAnchorElement;
      }
      return originalCreateElement.call(document, tag);
    });

    const fileMenu = getMenuButton('文件');
    fireEvent.click(fileMenu);

    const exportItem = screen.getByText('导出图片');
    fireEvent.click(exportItem);

    expect(mockLink.download).toBe('my-pic.png');
    expect(mockLink.click).toHaveBeenCalled();

    mockCreateElement.mockRestore();
  });
});
