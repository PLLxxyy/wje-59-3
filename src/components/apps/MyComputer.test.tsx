import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComputer from './MyComputer';
import { useOSStore } from '@/store/useOSStore';
import type { PaintDoc } from '@/types/os';

vi.mock('@/store/useOSStore', () => ({
  useOSStore: vi.fn(),
}));

const mockPaintDocs: PaintDoc[] = [
  {
    id: 'paint-doc-1',
    name: 'my-drawing',
    imageData: 'data:image/png;base64,abc123',
    createdAt: 1700000000000,
    updatedAt: 1700000001000,
    isDirty: false,
  },
  {
    id: 'paint-doc-2',
    name: 'sunset-pic',
    imageData: 'data:image/png;base64,def456',
    createdAt: 1700000002000,
    updatedAt: 1700000003000,
    isDirty: false,
  },
];

const mockUpdateAppState = vi.fn();
const mockOpenWindow = vi.fn();

function createMockStoreState(overrides: Partial<ReturnType<typeof useOSStore>> = {}) {
  const defaultState = {
    updateAppState: mockUpdateAppState,
    openWindow: mockOpenWindow,
    paintDocs: mockPaintDocs,
    windows: [],
  };

  (useOSStore as unknown as Mock).mockImplementation((selector?: Function) => {
    const state = { ...defaultState, ...overrides };
    if (selector) {
      return selector(state);
    }
    return state;
  });

  return defaultState;
}

describe('MyComputer Component - Paint Files Integration', () => {
  const testWindowId = 'my-computer-window-123';

  beforeEach(() => {
    vi.clearAllMocks();
    createMockStoreState();
  });

  function renderMyComputer(initialAppState: Record<string, any> = {}) {
    const windows = [
      {
        id: testWindowId,
        appId: 'mycomputer',
        appState: initialAppState,
      },
    ];

    (useOSStore as unknown as Mock).mockImplementation((selector?: Function) => {
      const state = {
        updateAppState: mockUpdateAppState,
        openWindow: mockOpenWindow,
        paintDocs: mockPaintDocs,
        windows,
      };
      if (selector) {
        return selector(state);
      }
      return state;
    });

    return render(<MyComputer windowId={testWindowId} />);
  }

  it('should show paint files in 图片收藏 folder', async () => {
    renderMyComputer();

    const myDocsFolder = screen.getByText('我的文档');
    fireEvent.doubleClick(myDocsFolder);

    await waitFor(() => {
      expect(screen.getByText('图片收藏')).toBeInTheDocument();
    });

    const photosFolder = screen.getByText('图片收藏');
    fireEvent.doubleClick(photosFolder);

    await waitFor(() => {
      expect(screen.getByText('my-drawing.png')).toBeInTheDocument();
      expect(screen.getByText('sunset-pic.png')).toBeInTheDocument();
    });
  });

  it('should open paint with correct data when double-clicking paint file', async () => {
    const user = userEvent.setup();
    renderMyComputer();

    const myDocsFolder = screen.getByText('我的文档');
    await user.dblClick(myDocsFolder);

    await waitFor(() => {
      expect(screen.getByText('图片收藏')).toBeInTheDocument();
    });

    const photosFolder = screen.getByText('图片收藏');
    await user.dblClick(photosFolder);

    await waitFor(() => {
      expect(screen.getByText('my-drawing.png')).toBeInTheDocument();
    });

    const paintFile = screen.getByText('my-drawing.png');
    await user.dblClick(paintFile);

    expect(mockOpenWindow).toHaveBeenCalledWith('paint', {
      imageData: 'data:image/png;base64,abc123',
      docId: 'paint-doc-1',
      docName: 'my-drawing',
      isDirty: false,
    });
  });

  it('should show correct file size for paint files', async () => {
    renderMyComputer();

    const myDocsFolder = screen.getByText('我的文档');
    fireEvent.doubleClick(myDocsFolder);

    await waitFor(() => {
      expect(screen.getByText('图片收藏')).toBeInTheDocument();
    });

    const photosFolder = screen.getByText('图片收藏');
    fireEvent.doubleClick(photosFolder);

    await waitFor(() => {
      const items = screen.getAllByText(/\.png$/);
      expect(items).toHaveLength(2);
    });
  });

  it('should navigate back from photos folder', async () => {
    const user = userEvent.setup();
    renderMyComputer();

    const myDocsFolder = screen.getByText('我的文档');
    await user.dblClick(myDocsFolder);

    await waitFor(() => {
      expect(screen.getByText('图片收藏')).toBeInTheDocument();
    });

    const photosFolder = screen.getByText('图片收藏');
    await user.dblClick(photosFolder);

    await waitFor(() => {
      expect(screen.getByText('my-drawing.png')).toBeInTheDocument();
    });

    const backButton = screen.getByText('← 后退');
    await user.click(backButton);

    expect(screen.getByText('图片收藏')).toBeInTheDocument();
    expect(screen.queryByText('my-drawing.png')).not.toBeInTheDocument();
  });

  it('should update breadcrumb when navigating', async () => {
    renderMyComputer();

    expect(screen.getByText('我的电脑')).toBeInTheDocument();

    const myDocsFolder = screen.getByText('我的文档');
    fireEvent.doubleClick(myDocsFolder);

    await waitFor(() => {
      expect(screen.getByText('我的电脑 ▸ 我的文档')).toBeInTheDocument();
    });

    const photosFolder = screen.getByText('图片收藏');
    fireEvent.doubleClick(photosFolder);

    await waitFor(() => {
      expect(screen.getByText('我的电脑 ▸ 我的文档 ▸ 图片收藏')).toBeInTheDocument();
    });
  });

  it('should show object count in photos folder', async () => {
    renderMyComputer();

    const myDocsFolder = screen.getByText('我的文档');
    fireEvent.doubleClick(myDocsFolder);

    await waitFor(() => {
      expect(screen.getByText('图片收藏')).toBeInTheDocument();
    });

    const photosFolder = screen.getByText('图片收藏');
    fireEvent.doubleClick(photosFolder);

    await waitFor(() => {
      expect(screen.getByText('2 个对象')).toBeInTheDocument();
    });
  });

  it('should not show paint files in other folders', async () => {
    renderMyComputer();

    const myDocsFolder = screen.getByText('我的文档');
    fireEvent.doubleClick(myDocsFolder);

    await waitFor(() => {
      expect(screen.getByText('我的视频')).toBeInTheDocument();
    });

    const videosFolder = screen.getByText('我的视频');
    fireEvent.doubleClick(videosFolder);

    await waitFor(() => {
      expect(screen.queryByText('.png')).not.toBeInTheDocument();
    });
  });
});
