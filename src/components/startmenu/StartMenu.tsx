import { useEffect, useRef } from 'react';
import { useOSStore } from '@/store/useOSStore';
import StartMenuItem from './StartMenuItem';

const menuItems = [
  { appId: 'mycomputer' as const, icon: '💻', label: '我的电脑' },
  { appId: 'recyclebin' as const, icon: '🗑️', label: '回收站' },
  { appId: 'notepad' as const, icon: '📝', label: '记事本' },
  { appId: 'paint' as const, icon: '🎨', label: '画图' },
  { appId: 'browser' as const, icon: '🌐', label: '浏览器' },
  { appId: 'minesweeper' as const, icon: '💣', label: '扫雷' },
];

export default function StartMenu() {
  const { showStartMenu, setShowStartMenu, setTheme, theme, resetOS } = useOSStore();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showStartMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        const startButton = document.querySelector('[data-start-button]');
        if (startButton && !startButton.contains(e.target as Node)) {
          setShowStartMenu(false);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowStartMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showStartMenu, setShowStartMenu]);

  if (!showStartMenu) return null;

  const themes = [
    { id: 'win95', name: 'Windows 95' },
    { id: 'win98', name: 'Windows 98' },
    { id: 'win2000', name: 'Windows 2000' },
    { id: 'winxp', name: 'Windows XP' },
    { id: 'macos9', name: 'Classic Mac' },
    { id: 'highcontrast', name: '高对比度' },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed left-0 bottom-7 z-[9998] flex animate-slideUp"
      style={{
        background: 'var(--os-menuBg)',
        borderTop: '2px solid var(--os-buttonHighlight)',
        borderLeft: '2px solid var(--os-buttonHighlight)',
        borderRight: '2px solid var(--os-buttonShadow)',
        borderBottom: '2px solid var(--os-buttonShadow)',
      }}
    >
      <div
        className="w-10 flex flex-col justify-end pb-2"
        style={{
          background: 'linear-gradient(to top, var(--os-windowTitleBarActiveStart), var(--os-windowTitleBarActiveEnd))',
        }}
      >
        <div
          className="text-white font-bold text-lg whitespace-nowrap origin-bottom-left -rotate-90 translate-y-[-8px] translate-x-[4px]"
          style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
        >
          Windows
        </div>
      </div>

      <div className="flex flex-col min-w-[200px]">
        <div className="py-1">
          {menuItems.map((item) => (
            <StartMenuItem key={item.appId} {...item} />
          ))}
        </div>

        <div className="os-menu-divider" />

        <div className="relative group">
          <div className="os-menu-item py-2 px-3 justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl w-8 text-center">🎨</span>
              <span className="text-sm">主题</span>
            </div>
            <span className="text-xs">▶</span>
          </div>
          <div
            className="absolute left-full top-0 hidden group-hover:block os-raised-2"
            style={{ background: 'var(--os-menuBg)', minWidth: '150px' }}
          >
            {themes.map((t) => (
              <div
                key={t.id}
                className={`os-menu-item py-1 px-3 ${theme === t.id ? 'os-desktop-icon-selected' : ''}`}
                onClick={() => setTheme(t.id)}
              >
                {theme === t.id && <span className="mr-1">●</span>}
                <span>{t.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="os-menu-divider" />

        <div
          className="os-menu-item py-2 px-3"
          onClick={() => {
            if (confirm('确定要重置系统吗？所有数据将丢失。')) {
              resetOS();
            }
          }}
        >
          <span className="text-2xl w-8 text-center">🔄</span>
          <span className="text-sm">重置系统</span>
        </div>

        <div className="os-menu-divider" />

        <div className="os-menu-item py-2 px-3">
          <span className="text-2xl w-8 text-center">⏻</span>
          <span className="text-sm">关机</span>
        </div>
      </div>
    </div>
  );
}
