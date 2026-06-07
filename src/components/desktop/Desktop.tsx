import { useOSStore } from '@/store/useOSStore';
import DesktopIcon from './DesktopIcon';
import ContextMenu from './ContextMenu';

export default function Desktop() {
  const { desktopIcons, setSelectedIconId, setContextMenu, setShowStartMenu } = useOSStore();

  const handleDesktopClick = () => {
    setSelectedIconId(null);
    setShowStartMenu(false);
    setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedIconId(null);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: '查看', icon: '👁️', onClick: () => {} },
        { label: '排序方式', icon: '📊', onClick: () => {}, divider: true },
        { label: '刷新', icon: '🔄', onClick: () => window.location.reload() },
        { label: '粘贴', icon: '📋', onClick: () => {}, disabled: true, divider: true },
        { label: '新建', icon: '➕', onClick: () => {}, disabled: true },
        { label: '属性', icon: '⚙️', onClick: () => {}, divider: true },
        { label: '个性化', icon: '🎨', onClick: () => {} },
      ],
    });
  };

  return (
    <div
      className="absolute inset-0 bottom-7 overflow-hidden"
      style={{ background: 'var(--os-desktopBg)' }}
      onClick={handleDesktopClick}
      onContextMenu={handleContextMenu}
    >
      {desktopIcons.map((icon) => (
        <DesktopIcon key={icon.id} icon={icon} />
      ))}
      <ContextMenu />
    </div>
  );
}
