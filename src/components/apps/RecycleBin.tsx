import { useState, useEffect } from 'react'
import { useOSStore } from '@/store/useOSStore'
import type { FileItem } from '@/types/os'

interface RecycleBinProps {
  windowId: string
}

const sampleItems: FileItem[] = [
  { id: 'deleted-1', name: '旧文档.txt', type: 'file', icon: '📄', size: '2.5 KB', modified: '2024-01-15' },
  { id: 'deleted-2', name: '临时文件夹', type: 'folder', icon: '📁', modified: '2024-01-14' },
  { id: 'deleted-3', name: '截图.png', type: 'file', icon: '🖼️', size: '450 KB', modified: '2024-01-13' },
]

export default function RecycleBin({ windowId }: RecycleBinProps) {
  const { updateAppState, windows } = useOSStore()
  const windowState = windows.find(w => w.id === windowId)
  const appState = windowState?.appState || {}

  const [items, setItems] = useState<FileItem[]>(appState.items ?? sampleItems)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    updateAppState(windowId, { items })
  }, [items, windowId, updateAppState])

  const handleEmptyRecycleBin = () => {
    setShowConfirm(true)
  }

  const confirmEmpty = () => {
    setItems([])
    setSelectedId(null)
    setShowConfirm(false)
  }

  const cancelEmpty = () => {
    setShowConfirm(false)
  }

  const handleRestore = (item: FileItem) => {
    setItems(items.filter(i => i.id !== item.id))
    setSelectedId(null)
  }

  const handleDelete = (item: FileItem) => {
    setItems(items.filter(i => i.id !== item.id))
    setSelectedId(null)
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
        <button className="os-button text-xs" onClick={handleEmptyRecycleBin} disabled={items.length === 0}>
          🗑️ 清空回收站
        </button>
        <button
          className="os-button text-xs"
          onClick={() => selectedId && handleRestore(items.find(i => i.id === selectedId)!)}
          disabled={!selectedId}
        >
          ↩️ 还原
        </button>
        <button
          className="os-button text-xs"
          onClick={() => selectedId && handleDelete(items.find(i => i.id === selectedId)!)}
          disabled={!selectedId}
        >
          ✖️ 删除
        </button>
      </div>

      <div className="os-inset bg-white px-2 py-1 flex items-center gap-1 text-xs">
        <span className="text-[var(--os-buttonShadow)]">地址</span>
        <span className="os-raised flex-1 px-2 py-0.5 bg-white">
          🗑️ 回收站
        </span>
      </div>

      <div className="flex-1 overflow-auto p-2 bg-white relative">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--os-buttonShadow)]">
            <span className="text-6xl mb-4 opacity-50">🗑️</span>
            <p className="text-sm">回收站为空</p>
            <p className="text-xs mt-1">您删除的文件和文件夹将显示在这里</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col items-center p-1 cursor-pointer rounded text-center ${
                  selectedId === item.id ? 'os-desktop-icon-selected' : 'hover:bg-blue-50'
                }`}
                onClick={() => setSelectedId(item.id)}
                onDoubleClick={() => handleRestore(item)}
              >
                <span className="text-3xl mb-1">{item.icon}</span>
                <span className="text-xs break-all leading-tight">{item.name}</span>
              </div>
            ))}
          </div>
        )}

        {showConfirm && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="os-raised-2 bg-[var(--os-windowBg)] p-3 w-72">
              <div className="os-window-title-active px-2 py-1 -m-3 mb-3 font-bold text-xs">
                确认删除
              </div>
              <div className="flex gap-3 mb-4">
                <span className="text-3xl">⚠️</span>
                <div className="flex-1">
                  <p className="text-xs mb-2">确定要删除回收站中的所有项目吗？</p>
                  <p className="text-xs text-[var(--os-buttonShadow)]">此操作无法撤销。</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button className="os-button text-xs" onClick={confirmEmpty}>
                  是(Y)
                </button>
                <button className="os-button text-xs" onClick={cancelEmpty}>
                  否(N)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="os-inset bg-[var(--os-buttonFace)] px-2 py-1 flex gap-8 text-xs text-[var(--os-buttonText)]">
        <span>{items.length} 个对象</span>
        {selectedId && (
          <span>
            选定：{items.find(i => i.id === selectedId)?.name}
          </span>
        )}
      </div>
    </div>
  )
}
