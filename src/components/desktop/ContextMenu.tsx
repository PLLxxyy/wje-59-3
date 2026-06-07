import { useEffect, useRef } from 'react';
import { useOSStore } from '@/store/useOSStore';

export default function ContextMenu() {
  const { contextMenu, setContextMenu } = useOSStore();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contextMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu, setContextMenu]);

  if (!contextMenu) return null;

  const handleItemClick = (item: typeof contextMenu.items[0]) => {
    if (!item.disabled) {
      item.onClick();
      setContextMenu(null);
    }
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] os-raised-2 animate-fadeIn"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
        background: 'var(--os-menuBg)',
        minWidth: '180px',
      }}
    >
      {contextMenu.items.map((item, index) => (
        <div key={index}>
          {item.divider && <div className="os-menu-divider" />}
          <div
            className={`os-menu-item ${item.disabled ? 'os-menu-item-disabled' : ''}`}
            onClick={() => handleItemClick(item)}
          >
            {item.icon && <span className="w-4 text-center">{item.icon}</span>}
            <span>{item.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
