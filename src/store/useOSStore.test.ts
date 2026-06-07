import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOSStore } from './useOSStore';
import type { PaintDoc } from '@/types/os';
import { generateId } from '@/utils/id';

vi.mock('@/utils/id', () => ({
  generateId: vi.fn(() => 'mock-id-1'),
}));

describe('useOSStore - Paint Docs', () => {
  beforeEach(() => {
    localStorage.clear();
    useOSStore.setState(useOSStore.getInitialState());
    vi.clearAllMocks();
  });

  describe('savePaintDoc', () => {
    it('should add a new paint doc', () => {
      const now = Date.now();
      const doc: PaintDoc = {
        id: 'doc-1',
        name: 'test-pic',
        imageData: 'data:image/png;base64,abc',
        createdAt: now,
        updatedAt: now,
        isDirty: false,
      };

      useOSStore.getState().savePaintDoc(doc);

      const state = useOSStore.getState();
      expect(state.paintDocs).toHaveLength(1);
      expect(state.paintDocs[0]).toEqual(doc);
    });

    it('should update an existing paint doc', () => {
      const now = Date.now();
      const doc: PaintDoc = {
        id: 'doc-1',
        name: 'test-pic',
        imageData: 'data:image/png;base64,abc',
        createdAt: now,
        updatedAt: now,
        isDirty: false,
      };

      useOSStore.getState().savePaintDoc(doc);

      const updatedDoc: PaintDoc = {
        ...doc,
        name: 'updated-pic',
        imageData: 'data:image/png;base64,def',
        updatedAt: now + 1000,
      };

      useOSStore.getState().savePaintDoc(updatedDoc);

      const state = useOSStore.getState();
      expect(state.paintDocs).toHaveLength(1);
      expect(state.paintDocs[0].name).toBe('updated-pic');
      expect(state.paintDocs[0].imageData).toBe('data:image/png;base64,def');
    });
  });

  describe('deletePaintDoc', () => {
    it('should delete a paint doc by id', () => {
      const now = Date.now();
      const doc1: PaintDoc = {
        id: 'doc-1',
        name: 'pic-1',
        imageData: 'data:image/png;base64,abc',
        createdAt: now,
        updatedAt: now,
        isDirty: false,
      };
      const doc2: PaintDoc = {
        id: 'doc-2',
        name: 'pic-2',
        imageData: 'data:image/png;base64,def',
        createdAt: now,
        updatedAt: now,
        isDirty: false,
      };

      useOSStore.getState().savePaintDoc(doc1);
      useOSStore.getState().savePaintDoc(doc2);

      useOSStore.getState().deletePaintDoc('doc-1');

      const state = useOSStore.getState();
      expect(state.paintDocs).toHaveLength(1);
      expect(state.paintDocs[0].id).toBe('doc-2');
    });
  });

  describe('openWindow with appState', () => {
    it('should pass appState to existing window', () => {
      const { openWindow } = useOSStore.getState();

      openWindow('paint');

      const state1 = useOSStore.getState();
      const windowId = state1.windows[0].id;

      openWindow('paint', {
        imageData: 'data:image/png;base64,test',
        docId: 'doc-1',
        docName: 'test-pic',
      });

      const state2 = useOSStore.getState();
      const updatedWindow = state2.windows.find(w => w.id === windowId)!;

      expect(updatedWindow.appState.imageData).toBe('data:image/png;base64,test');
      expect(updatedWindow.appState.docId).toBe('doc-1');
      expect(updatedWindow.appState.docName).toBe('test-pic');
    });

    it('should pass appState to minimized window when restoring', () => {
      const { openWindow, minimizeWindow } = useOSStore.getState();

      openWindow('paint');

      const state1 = useOSStore.getState();
      const windowId = state1.windows[0].id;

      minimizeWindow(windowId);

      openWindow('paint', {
        imageData: 'data:image/png;base64,test',
        docId: 'doc-1',
      });

      const state2 = useOSStore.getState();
      const updatedWindow = state2.windows.find(w => w.id === windowId)!;

      expect(updatedWindow.isMinimized).toBe(false);
      expect(updatedWindow.appState.imageData).toBe('data:image/png;base64,test');
    });
  });

  describe('persistence', () => {
    it('should persist paintDocs to localStorage', () => {
      const now = Date.now();
      const doc: PaintDoc = {
        id: 'doc-1',
        name: 'test-pic',
        imageData: 'data:image/png;base64,abc',
        createdAt: now,
        updatedAt: now,
        isDirty: false,
      };

      useOSStore.getState().savePaintDoc(doc);

      useOSStore.setState({ ...useOSStore.getState() });

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const saved = localStorage.getItem('retro-os-state-v1');
          expect(saved).not.toBeNull();
          const parsed = JSON.parse(saved!);
          expect(parsed.paintDocs).toHaveLength(1);
          expect(parsed.paintDocs[0].id).toBe('doc-1');
          resolve();
        }, 600);
      });
    });

    it('should load paintDocs from localStorage on init', () => {
      const now = Date.now();
      const savedState = {
        paintDocs: [
          {
            id: 'saved-doc-1',
            name: 'saved-pic',
            imageData: 'data:image/png;base64,saved',
            createdAt: now,
            updatedAt: now,
            isDirty: false,
          },
        ],
        notepadDocs: [],
        windows: [],
        theme: 'classic',
        desktopIcons: [],
        zIndexCounter: 100,
        activeWindowId: null,
      };

      localStorage.setItem('retro-os-state-v1', JSON.stringify(savedState));

      const loadStateFromStorage = () => {
        try {
          const saved = localStorage.getItem('retro-os-state-v1');
          if (saved) {
            const parsed = JSON.parse(saved);
            const { bootPhase, bootProgress, showStartMenu, contextMenu, selectedIconId, ...rest } = parsed;
            return rest;
          }
        } catch (e) {
          return null;
        }
        return null;
      };

      const loadedStateData = loadStateFromStorage();
      const newState = { ...useOSStore.getInitialState(), ...loadedStateData };
      useOSStore.setState(newState);

      const loadedState = useOSStore.getState();
      expect(loadedState.paintDocs).toHaveLength(1);
      expect(loadedState.paintDocs[0].id).toBe('saved-doc-1');
    });
  });
});
