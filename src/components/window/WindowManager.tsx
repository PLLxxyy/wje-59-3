import { useEffect, useRef } from 'react'
import { useOSStore } from '@/store/useOSStore'
import OSWindow from './OSWindow'
import type { AppId } from '@/types/os'
import MyComputer from '@/components/apps/MyComputer'
import RecycleBin from '@/components/apps/RecycleBin'
import Notepad from '@/components/apps/Notepad'
import Paint from '@/components/apps/Paint'
import Browser from '@/components/apps/Browser'
import Minesweeper from '@/components/apps/Minesweeper'

const appRenderers: Record<AppId, (windowId: string) => React.ReactNode> = {
  mycomputer: (windowId) => <MyComputer windowId={windowId} />,
  recyclebin: (windowId) => <RecycleBin windowId={windowId} />,
  notepad: (windowId) => <Notepad windowId={windowId} />,
  paint: (windowId) => <Paint windowId={windowId} />,
  browser: (windowId) => <Browser windowId={windowId} />,
  minesweeper: (windowId) => <Minesweeper windowId={windowId} />,
}

export default function WindowManager() {
  const { windows, maximizeWindow, restoreWindow } = useOSStore()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const handleMaximizeEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ windowId: string }>
      maximizeWindow(customEvent.detail.windowId)
    }

    const handleRestoreEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ windowId: string }>
      restoreWindow(customEvent.detail.windowId)
    }

    window.addEventListener('maximize-window', handleMaximizeEvent)
    window.addEventListener('restore-window', handleRestoreEvent)

    return () => {
      window.removeEventListener('maximize-window', handleMaximizeEvent)
      window.removeEventListener('restore-window', handleRestoreEvent)
    }
  }, [maximizeWindow, restoreWindow])

  const sortedWindows = [...windows].sort((a, b) => a.zIndex - b.zIndex)

  return (
    <div className="absolute inset-0 overflow-hidden">
      {sortedWindows.map((windowState) => {
        const renderer = appRenderers[windowState.appId]
        const children = renderer ? renderer(windowState.id) : null

        return (
          <OSWindow key={windowState.id} windowState={windowState}>
            {children}
          </OSWindow>
        )
      })}
    </div>
  )
}
