interface WindowControlsProps {
  isMaximized: boolean
  onMinimize: () => void
  onMaximize: () => void
  onClose: () => void
}

export default function WindowControls({
  isMaximized,
  onMinimize,
  onMaximize,
  onClose,
}: WindowControlsProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onMinimize}
        className="os-button w-5 h-5 p-0 flex items-center justify-center text-xs font-bold"
        title="最小化"
      >
        _
      </button>
      <button
        onClick={onMaximize}
        className="os-button w-5 h-5 p-0 flex items-center justify-center text-xs font-bold"
        title={isMaximized ? '还原' : '最大化'}
      >
        {isMaximized ? '❐' : '□'}
      </button>
      <button
        onClick={onClose}
        className="os-button w-5 h-5 p-0 flex items-center justify-center text-xs font-bold"
        title="关闭"
      >
        ×
      </button>
    </div>
  )
}
