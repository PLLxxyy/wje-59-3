import { useState, useEffect, useMemo } from 'react'
import { useOSStore } from '@/store/useOSStore'
import type { FileItem } from '@/types/os'

interface MyComputerProps {
  windowId: string
}

const fileSystem: FileItem[] = [
  {
    id: 'c-drive',
    name: '本地磁盘 (C:)',
    type: 'folder',
    icon: '💾',
    children: [
      { id: 'program-files', name: 'Program Files', type: 'folder', icon: '📁', children: [] },
      { id: 'windows', name: 'Windows', type: 'folder', icon: '📁', children: [] },
      { id: 'users', name: 'Users', type: 'folder', icon: '📁', children: [] },
      { id: 'readme', name: 'README.txt', type: 'file', icon: '📄', size: '1.2 KB', modified: '2024-01-01' },
    ],
  },
  {
    id: 'd-drive',
    name: '数据 (D:)',
    type: 'folder',
    icon: '💿',
    children: [
      { id: 'docs', name: '我的文档', type: 'folder', icon: '📁', children: [] },
      { id: 'games', name: '游戏', type: 'folder', icon: '🎮', children: [] },
      { id: 'music', name: '音乐', type: 'folder', icon: '🎵', children: [] },
    ],
  },
  {
    id: 'my-documents',
    name: '我的文档',
    type: 'folder',
    icon: '📁',
    children: [
      { id: 'photos', name: '图片收藏', type: 'folder', icon: '🖼️', children: [] },
      { id: 'videos', name: '我的视频', type: 'folder', icon: '🎬', children: [] },
      { id: 'downloads', name: '下载', type: 'folder', icon: '⬇️', children: [] },
    ],
  },
  {
    id: 'shared',
    name: '共享文件夹',
    type: 'folder',
    icon: '📂',
    children: [
      { id: 'public', name: '公共文档', type: 'folder', icon: '📁', children: [] },
    ],
  },
]

function findItemByPath(items: FileItem[], path: string[]): FileItem[] | null {
  if (path.length === 0) return items
  let current: FileItem[] | undefined = items
  for (const segment of path) {
    const found = current?.find(item => item.id === segment)
    if (!found?.children) return null
    current = found.children
  }
  return current
}

function getBreadcrumbNames(path: string[]): string[] {
  const names: string[] = ['我的电脑']
  let current = fileSystem
  for (const segment of path) {
    const found = current.find(item => item.id === segment)
    if (found) {
      names.push(found.name)
      current = found.children || []
    }
  }
  return names
}

export default function MyComputer({ windowId }: MyComputerProps) {
  const { updateAppState, windows } = useOSStore()
  const windowState = windows.find(w => w.id === windowId)
  const appState = windowState?.appState || {}

  const [currentPath, setCurrentPath] = useState<string[]>(appState.currentPath || [])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    updateAppState(windowId, { currentPath })
  }, [currentPath, windowId, updateAppState])

  const currentItems = useMemo(() => {
    return findItemByPath(fileSystem, currentPath) || []
  }, [currentPath])

  const breadcrumbNames = getBreadcrumbNames(currentPath)

  const handleDoubleClick = (item: FileItem) => {
    if (item.type === 'folder') {
      setCurrentPath([...currentPath, item.id])
      setSelectedId(null)
    }
  }

  const handleBack = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1))
      setSelectedId(null)
    }
  }

  const handleUp = () => {
    handleBack()
  }

  return (
    <div className="flex flex-col h-full bg-[var(--os-windowBg)]">
      <div className="bg-[var(--os-menuBg)] px-1 py-0.5 border-b border-[var(--os-buttonShadow)] flex gap-4 text-xs">
        <span className="cursor-pointer hover:bg-[var(--os-menuHighlight)] hover:text-[var(--os-selectedText)] px-2 py-0.5">文件(F)</span>
        <span className="cursor-pointer hover:bg-[var(--os-menuHighlight)] hover:text-[var(--os-selectedText)] px-2 py-0.5">编辑(E)</span>
        <span className="cursor-pointer hover:bg-[var(--os-menuHighlight)] hover:text-[var(--os-selectedText)] px-2 py-0.5">查看(V)</span>
        <span className="cursor-pointer hover:bg-[var(--os-menuHighlight)] hover:text-[var(--os-selectedText)] px-2 py-0.5">收藏(A)</span>
        <span className="cursor-pointer hover:bg-[var(--os-menuHighlight)] hover:text-[var(--os-selectedText)] px-2 py-0.5">工具(T)</span>
        <span className="cursor-pointer hover:bg-[var(--os-menuHighlight)] hover:text-[var(--os-selectedText)] px-2 py-0.5">帮助(H)</span>
      </div>

      <div className="os-inset bg-[var(--os-buttonFace)] p-1 flex items-center gap-1 flex-wrap">
        <button
          className="os-button text-xs"
          onClick={handleBack}
          disabled={currentPath.length === 0}
        >
          ← 后退
        </button>
        <button
          className="os-button text-xs"
          disabled
        >
          → 前进
        </button>
        <button
          className="os-button text-xs"
          onClick={handleUp}
          disabled={currentPath.length === 0}
        >
          ↑ 向上
        </button>
        <button className="os-button text-xs">🔍 搜索</button>
        <button className="os-button text-xs">📁 文件夹</button>
      </div>

      <div className="os-inset bg-white px-2 py-1 flex items-center gap-1 text-xs">
        <span className="text-[var(--os-buttonShadow)]">地址</span>
        <span className="os-raised flex-1 px-2 py-0.5 bg-white">
          {breadcrumbNames.join(' ▸ ')}
        </span>
      </div>

      <div className="flex-1 overflow-auto p-2 bg-white">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {currentItems.map((item) => (
            <div
              key={item.id}
              className={`flex flex-col items-center p-1 cursor-pointer rounded text-center ${
                selectedId === item.id ? 'os-desktop-icon-selected' : 'hover:bg-blue-50'
              }`}
              onClick={() => setSelectedId(item.id)}
              onDoubleClick={() => handleDoubleClick(item)}
            >
              <span className="text-3xl mb-1">{item.icon}</span>
              <span className="text-xs break-all leading-tight">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="os-inset bg-[var(--os-buttonFace)] px-2 py-1 flex gap-8 text-xs text-[var(--os-buttonText)]">
        <span>{currentItems.length} 个对象</span>
        {selectedId && (
          <span>
            选定：{currentItems.find(i => i.id === selectedId)?.name}
          </span>
        )}
      </div>
    </div>
  )
}
