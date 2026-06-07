import { useRef } from 'react';
import type { DesktopIcon as DesktopIconType } from '@/types/os';
import { useOSStore } from '@/store/useOSStore';

interface DesktopIconProps {
  icon: DesktopIconType;
}

export default function DesktopIcon({ icon }: DesktopIconProps) {
  const { selectedIconId, setSelectedIconId, openWindow, setContextMenu } = useOSStore();
  const clickTimerRef = useRef<number | null>(null);
  const isSelected = selectedIconId === icon.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      return;
    }
    clickTimerRef.current = window.setTimeout(() => {
      setSelectedIconId(icon.id);
      clickTimerRef.current = null;
    }, 250);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    openWindow(icon.appId);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIconId(icon.id);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: '打开', icon: '📂', onClick: () => openWindow(icon.appId) },
        { label: '重命名', icon: '✏️', onClick: () => {}, disabled: true },
        { label: '删除', icon: '🗑️', onClick: () => {}, disabled: true, divider: true },
        { label: '属性', icon: '📋', onClick: () => {}, disabled: true },
      ],
    });
  };

  return (
    <div
      className={`absolute cursor-pointer select-none flex flex-col items-center w-20 p-1 rounded ${
        isSelected ? 'os-desktop-icon-selected' : ''
      }`}
      style={{ left: icon.x, top: icon.y }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      <div className="text-4xl mb-1 drop-shadow-sm">{icon.icon}</div>
      <div
        className={`text-center text-xs leading-tight px-1 ${
          isSelected ? 'os-selected-dashed' : ''
        }`}
        style={{ color: isSelected ? 'var(--os-selectedText)' : '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
      >
        {icon.label}
      </div>
    </div>
  );
}
