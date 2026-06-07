import { create } from 'zustand';
import type {
  OSState,
  WindowState,
  AppId,
  BootPhase,
  NotepadDoc,
  PaintDoc,
  ContextMenuState,
} from '../types/os';
import { defaultThemeId, getThemeById, applyTheme } from '../themes';
import { generateId } from '../utils/id';

const STORAGE_KEY = 'retro-os-state-v1';

const defaultDesktopIcons = [
  { id: 'icon-mycomputer', appId: 'mycomputer' as AppId, label: '我的电脑', icon: '💻', x: 20, y: 20 },
  { id: 'icon-recyclebin', appId: 'recyclebin' as AppId, label: '回收站', icon: '🗑️', x: 20, y: 110 },
  { id: 'icon-notepad', appId: 'notepad' as AppId, label: '记事本', icon: '📝', x: 20, y: 200 },
  { id: 'icon-paint', appId: 'paint' as AppId, label: '画图', icon: '🎨', x: 20, y: 290 },
  { id: 'icon-browser', appId: 'browser' as AppId, label: '浏览器', icon: '🌐', x: 20, y: 380 },
  { id: 'icon-minesweeper', appId: 'minesweeper' as AppId, label: '扫雷', icon: '💣', x: 20, y: 470 },
];

const getInitialState = (): OSState => ({
  bootPhase: 'bios',
  bootProgress: 0,
  windows: [],
  activeWindowId: null,
  zIndexCounter: 100,
  theme: defaultThemeId,
  desktopIcons: defaultDesktopIcons,
  notepadDocs: [],
  paintDocs: [],
  showStartMenu: false,
  contextMenu: null,
  selectedIconId: null,
});

function loadStateFromStorage(): Partial<OSState> | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const { bootPhase, bootProgress, showStartMenu, contextMenu, selectedIconId, ...rest } = parsed;
      return rest;
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
  return null;
}

function saveStateToStorage(state: OSState): void {
  try {
    const { bootPhase, bootProgress, showStartMenu, contextMenu, selectedIconId, ...persistable } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

interface OSActions {
  setBootPhase: (phase: BootPhase) => void;
  setBootProgress: (progress: number) => void;
  openWindow: (appId: AppId, appState?: Record<string, any>) => void;
  closeWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  maximizeWindow: (windowId: string) => void;
  restoreWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  moveWindow: (windowId: string, x: number, y: number) => void;
  resizeWindow: (windowId: string, width: number, height: number) => void;
  updateAppState: (windowId: string, state: Record<string, any>) => void;
  setTheme: (themeId: string) => void;
  toggleStartMenu: () => void;
  setShowStartMenu: (show: boolean) => void;
  setContextMenu: (menu: ContextMenuState | null) => void;
  setSelectedIconId: (id: string | null) => void;
  saveNotepadDoc: (doc: NotepadDoc) => void;
  deleteNotepadDoc: (docId: string) => void;
  savePaintDoc: (doc: PaintDoc) => void;
  deletePaintDoc: (docId: string) => void;
  resetOS: () => void;
}

export type OSStore = OSState & OSActions;

export const useOSStore = create<OSStore>((set, get) => {
  const loadedState = loadStateFromStorage();
  const initialState = {
    ...getInitialState(),
    ...loadedState,
  };

  const savedTheme = getThemeById(initialState.theme);
  applyTheme(savedTheme);

  return {
    ...initialState,

    setBootPhase: (phase) => set({ bootPhase: phase }),
    setBootProgress: (progress) => set({ bootProgress: progress }),

    openWindow: (appId, appState = {}) => {
      const state = get();
      const existingWindow = state.windows.find(
        (w) => w.appId === appId && !w.isMinimized
      );

      if (existingWindow) {
        if (Object.keys(appState).length > 0) {
          set({
            windows: state.windows.map((w) =>
              w.id === existingWindow.id
                ? { ...w, appState: { ...w.appState, ...appState } }
                : w
            ),
          });
        }
        get().focusWindow(existingWindow.id);
        return;
      }

      const minimizedWindow = state.windows.find(
        (w) => w.appId === appId && w.isMinimized
      );

      if (minimizedWindow) {
        set({
          windows: state.windows.map((w) =>
            w.id === minimizedWindow.id
              ? { ...w, isMinimized: false, appState: { ...w.appState, ...appState } }
              : w
          ),
          activeWindowId: minimizedWindow.id,
          showStartMenu: false,
        });
        get().focusWindow(minimizedWindow.id);
        return;
      }

      const newZIndex = state.zIndexCounter + 1;

      const appConfigs: Record<AppId, Partial<WindowState>> = {
        mycomputer: {
          title: '我的电脑',
          icon: '💻',
          width: 600,
          height: 400,
          minWidth: 400,
          minHeight: 300,
        },
        recyclebin: {
          title: '回收站',
          icon: '🗑️',
          width: 500,
          height: 350,
          minWidth: 350,
          minHeight: 250,
        },
        notepad: {
          title: '记事本',
          icon: '📝',
          width: 500,
          height: 400,
          minWidth: 300,
          minHeight: 200,
        },
        paint: {
          title: '画图',
          icon: '🎨',
          width: 700,
          height: 500,
          minWidth: 400,
          minHeight: 300,
        },
        browser: {
          title: '浏览器',
          icon: '🌐',
          width: 700,
          height: 500,
          minWidth: 400,
          minHeight: 300,
        },
        minesweeper: {
          title: '扫雷',
          icon: '💣',
          width: 350,
          height: 420,
          minWidth: 250,
          minHeight: 320,
        },
      };

      const config = appConfigs[appId];
      const offsetX = (state.windows.length % 5) * 30;
      const offsetY = (state.windows.length % 5) * 30;

      const newWindow: WindowState = {
        id: generateId(),
        appId,
        title: config.title || appId,
        icon: config.icon || '📄',
        x: 100 + offsetX,
        y: 50 + offsetY,
        width: config.width || 500,
        height: config.height || 400,
        minWidth: config.minWidth || 300,
        minHeight: config.minHeight || 200,
        zIndex: newZIndex,
        isMinimized: false,
        isMaximized: false,
        appState,
      };

      set({
        windows: [...state.windows, newWindow],
        activeWindowId: newWindow.id,
        zIndexCounter: newZIndex,
        showStartMenu: false,
      });
    },

    closeWindow: (windowId) => {
      const state = get();
      const remainingWindows = state.windows.filter((w) => w.id !== windowId);
      const newActiveId = remainingWindows.length > 0
        ? remainingWindows[remainingWindows.length - 1].id
        : null;

      set({
        windows: remainingWindows,
        activeWindowId: newActiveId,
      });
    },

    minimizeWindow: (windowId) => {
      const state = get();
      const visibleWindows = state.windows.filter(
        (w) => w.id !== windowId && !w.isMinimized
      );
      const newActiveId = visibleWindows.length > 0
        ? visibleWindows[visibleWindows.length - 1].id
        : null;

      set({
        windows: state.windows.map((w) =>
          w.id === windowId ? { ...w, isMinimized: true } : w
        ),
        activeWindowId: newActiveId,
      });
    },

    maximizeWindow: (windowId) => {
      const state = get();
      set({
        windows: state.windows.map((w) => {
          if (w.id !== windowId) return w;
          return {
            ...w,
            isMaximized: true,
            prevX: w.x,
            prevY: w.y,
            prevWidth: w.width,
            prevHeight: w.height,
            x: 0,
            y: 0,
            width: window.innerWidth,
            height: window.innerHeight - 28,
          };
        }),
      });
      get().focusWindow(windowId);
    },

    restoreWindow: (windowId) => {
      const state = get();
      set({
        windows: state.windows.map((w) => {
          if (w.id !== windowId) return w;
          return {
            ...w,
            isMaximized: false,
            x: w.prevX ?? w.x,
            y: w.prevY ?? w.y,
            width: w.prevWidth ?? w.width,
            height: w.prevHeight ?? w.height,
          };
        }),
      });
      get().focusWindow(windowId);
    },

    focusWindow: (windowId) => {
      const state = get();
      const newZIndex = state.zIndexCounter + 1;
      set({
        windows: state.windows.map((w) =>
          w.id === windowId ? { ...w, zIndex: newZIndex } : w
        ),
        activeWindowId: windowId,
        zIndexCounter: newZIndex,
        showStartMenu: false,
      });
    },

    moveWindow: (windowId, x, y) => {
      const state = get();
      set({
        windows: state.windows.map((w) =>
          w.id === windowId ? { ...w, x, y } : w
        ),
      });
    },

    resizeWindow: (windowId, width, height) => {
      const state = get();
      set({
        windows: state.windows.map((w) => {
          if (w.id !== windowId) return w;
          return {
            ...w,
            width: Math.max(w.minWidth, width),
            height: Math.max(w.minHeight, height),
          };
        }),
      });
    },

    updateAppState: (windowId, newState) => {
      const state = get();
      set({
        windows: state.windows.map((w) =>
          w.id === windowId
            ? { ...w, appState: { ...w.appState, ...newState } }
            : w
        ),
      });
    },

    setTheme: (themeId) => {
      const theme = getThemeById(themeId);
      applyTheme(theme);
      set({ theme: themeId });
    },

    toggleStartMenu: () => {
      const state = get();
      set({ showStartMenu: !state.showStartMenu, contextMenu: null });
    },

    setShowStartMenu: (show) => {
      set({ showStartMenu: show, contextMenu: null });
    },

    setContextMenu: (menu) => {
      set({ contextMenu: menu, showStartMenu: false });
    },

    setSelectedIconId: (id) => {
      set({ selectedIconId: id });
    },

    saveNotepadDoc: (doc) => {
      const state = get();
      const existingIndex = state.notepadDocs.findIndex((d) => d.id === doc.id);
      let newDocs;
      if (existingIndex >= 0) {
        newDocs = [...state.notepadDocs];
        newDocs[existingIndex] = doc;
      } else {
        newDocs = [...state.notepadDocs, doc];
      }
      set({ notepadDocs: newDocs });
    },

    deleteNotepadDoc: (docId) => {
      const state = get();
      set({
        notepadDocs: state.notepadDocs.filter((d) => d.id !== docId),
      });
    },

    savePaintDoc: (doc) => {
      const state = get();
      const existingIndex = state.paintDocs.findIndex((d) => d.id === doc.id);
      let newDocs;
      if (existingIndex >= 0) {
        newDocs = [...state.paintDocs];
        newDocs[existingIndex] = doc;
      } else {
        newDocs = [...state.paintDocs, doc];
      }
      set({ paintDocs: newDocs });
    },

    deletePaintDoc: (docId) => {
      const state = get();
      set({
        paintDocs: state.paintDocs.filter((d) => d.id !== docId),
      });
    },

    resetOS: () => {
      localStorage.removeItem(STORAGE_KEY);
      const freshState = getInitialState();
      applyTheme(getThemeById(freshState.theme));
      set(freshState);
    },
  };
});

let saveTimeout: number | null = null;

useOSStore.subscribe((state) => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = window.setTimeout(() => {
    saveStateToStorage(state);
  }, 500);
});
