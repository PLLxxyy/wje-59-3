import { useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useWindowDrag } from '@/hooks/useWindowDrag'
import { useOSStore } from '@/store/useOSStore'
import WindowControls from './WindowControls'
import { cn } from '@/lib/utils'
import type { WindowState } from '@/types/os'

interface OSWindowProps {
  windowState: WindowState
  children?: ReactNode
}

export default function OSWindow({ windowState, children }: OSWindowProps) {
  const {
    id,
    title,
    icon,
    x,
    y,
    width,
    height,
    zIndex,
    isMinimized,
    isMaximized,
  } = windowState

  const {
    activeWindowId,
    focusWindow,
    moveWindow,
    resizeWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    closeWindow,
  } = useOSStore()

  const isActive = activeWindowId === id

  const handleMove = useCallback(
    (newX: number, newY: number) => {
      moveWindow(id, newX, newY)
    },
    [id, moveWindow]
  )

  const handleResize = useCallback(
    (newWidth: number, newHeight: number) => {
      resizeWindow(id, newWidth, newHeight)
    },
    [id, resizeWindow]
  )

  const handleFocus = useCallback(() => {
    focusWindow(id)
  }, [id, focusWindow])

  const {
    handleDragStart,
    handleResizeStart,
    handleMouseMove,
    handleMouseUp,
    handleDoubleClick,
  } = useWindowDrag(id, isMaximized, handleMove, handleResize, handleFocus)

  useEffect(() => {
    const handleMaximizeEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ windowId: string }>
      if (customEvent.detail.windowId === id) {
        maximizeWindow(id)
      }
    }

    const handleRestoreEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ windowId: string }>
      if (customEvent.detail.windowId === id) {
        restoreWindow(id)
      }
    }

    window.addEventListener('maximize-window', handleMaximizeEvent)
    window.addEventListener('restore-window', handleRestoreEvent)

    return () => {
      window.removeEventListener('maximize-window', handleMaximizeEvent)
      window.removeEventListener('restore-window', handleRestoreEvent)
    }
  }, [id, maximizeWindow, restoreWindow])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('touchmove', handleMouseMove as EventListener)
    document.addEventListener('touchend', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleMouseMove as EventListener)
      document.removeEventListener('touchend', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  const handleMinimize = () => {
    minimizeWindow(id)
  }

  const handleMaximizeToggle = () => {
    if (isMaximized) {
      restoreWindow(id)
    } else {
      maximizeWindow(id)
    }
  }

  const handleClose = () => {
    closeWindow(id)
  }

  if (isMinimized) {
    return null
  }

  return (
    <div
      className={cn(
        'os-window os-raised-2 absolute flex flex-col bg-[var(--os-windowBg)] overflow-hidden animate-fadeIn'
      )}
      style={{
        left: x,
        top: y,
        width: isMaximized ? '100%' : width,
        height: isMaximized ? 'calc(100% - 28px)' : height,
        zIndex,
      }}
      onClick={handleFocus}
    >
      <div
        className={cn(
          'flex items-center justify-between px-2 py-1 h-6 cursor-default select-none',
          isActive ? 'os-window-title-active' : 'os-window-title-inactive'
        )}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onDoubleClick={handleDoubleClick}
      >
        <div className="flex items-center gap-1 font-bold text-xs overflow-hidden">
          <span className="w-4 h-4 flex items-center justify-center text-sm">
            {icon}
          </span>
          <span className="truncate">{title}</span>
        </div>
        <WindowControls
          isMaximized={isMaximized}
          onMinimize={handleMinimize}
          onMaximize={handleMaximizeToggle}
          onClose={handleClose}
        />
      </div>

      <div className="flex-1 overflow-hidden p-1">
        <div className="os-inset-2 w-full h-full overflow-auto bg-white">
          {children}
        </div>
      </div>

      {!isMaximized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
        >
          <div className="w-full h-full border-r-2 border-b-2 border-[var(--os-buttonShadow)]" />
        </div>
      )}
    </div>
  )
}
