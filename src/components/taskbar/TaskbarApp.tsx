import type { WindowState } from '@/types/os';
import { useOSStore } from '@/store/useOSStore';

interface TaskbarAppProps {
  window: WindowState;
}

export default function TaskbarApp({ window }: TaskbarAppProps) {
  const { activeWindowId, focusWindow, minimizeWindow, restoreWindow } = useOSStore();
  const isActive = activeWindowId === window.id && !window.isMinimized;

  const handleClick = () => {
    if (window.isMinimized) {
      restoreWindow(window.id);
    } else if (isActive) {
      minimizeWindow(window.id);
    } else {
      focusWindow(window.id);
    }
  };

  return (
    <button
      className={`h-6 px-2 mx-0.5 flex items-center gap-1 text-sm cursor-pointer select-none min-w-[120px] max-w-[160px] ${
        isActive ? 'os-button-active' : 'os-button'
      }`}
      onClick={handleClick}
      title={window.title}
    >
      <span className="text-base">{window.icon}</span>
      <span className="truncate">{window.title}</span>
    </button>
  );
}
