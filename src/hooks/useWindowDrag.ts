import { useCallback, useRef } from 'react';

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  windowStartX: number;
  windowStartY: number;
}

interface ResizeState {
  isResizing: boolean;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
}

export function useWindowDrag(
  windowId: string,
  isMaximized: boolean,
  onMove: (x: number, y: number) => void,
  onResize: (width: number, height: number) => void,
  onFocus: () => void
) {
  const dragState = useRef<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    windowStartX: 0,
    windowStartY: 0,
  });

  const resizeState = useRef<ResizeState>({
    isResizing: false,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
  });

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isMaximized) return;
      onFocus();

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const windowEl = (e.currentTarget as HTMLElement).closest('.os-window');
      if (!windowEl) return;

      const rect = windowEl.getBoundingClientRect();

      dragState.current = {
        isDragging: true,
        startX: clientX,
        startY: clientY,
        windowStartX: rect.left,
        windowStartY: rect.top,
      };

      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'move';
    },
    [isMaximized, onFocus]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isMaximized) return;
      e.stopPropagation();
      onFocus();

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const windowEl = (e.currentTarget as HTMLElement).closest('.os-window');
      if (!windowEl) return;

      const rect = windowEl.getBoundingClientRect();

      resizeState.current = {
        isResizing: true,
        startX: clientX,
        startY: clientY,
        startWidth: rect.width,
        startHeight: rect.height,
      };

      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'nwse-resize';
    },
    [isMaximized, onFocus]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (dragState.current.isDragging) {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const deltaX = clientX - dragState.current.startX;
        const deltaY = clientY - dragState.current.startY;

        let newX = dragState.current.windowStartX + deltaX;
        let newY = dragState.current.windowStartY + deltaY;

        newX = Math.max(0, Math.min(newX, window.innerWidth - 100));
        newY = Math.max(0, Math.min(newY, window.innerHeight - 60));

        onMove(newX, newY);
      }

      if (resizeState.current.isResizing) {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const deltaX = clientX - resizeState.current.startX;
        const deltaY = clientY - resizeState.current.startY;

        const newWidth = resizeState.current.startWidth + deltaX;
        const newHeight = resizeState.current.startHeight + deltaY;

        onResize(newWidth, newHeight);
      }
    },
    [onMove, onResize]
  );

  const handleMouseUp = useCallback(() => {
    dragState.current.isDragging = false;
    resizeState.current.isResizing = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (isMaximized) {
      const restoreEvent = new CustomEvent('restore-window', { detail: { windowId } });
      window.dispatchEvent(restoreEvent);
    } else {
      const maximizeEvent = new CustomEvent('maximize-window', { detail: { windowId } });
      window.dispatchEvent(maximizeEvent);
    }
  }, [isMaximized, windowId]);

  return {
    handleDragStart,
    handleResizeStart,
    handleMouseMove,
    handleMouseUp,
    handleDoubleClick,
  };
}
