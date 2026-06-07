import type { AppId } from '@/types/os';
import { useOSStore } from '@/store/useOSStore';

interface StartMenuItemProps {
  icon: string;
  label: string;
  appId: AppId;
}

export default function StartMenuItem({ icon, label, appId }: StartMenuItemProps) {
  const { openWindow } = useOSStore();

  const handleClick = () => {
    openWindow(appId);
  };

  return (
    <div
      className="os-menu-item py-2 px-3"
      onClick={handleClick}
    >
      <span className="text-2xl w-8 text-center">{icon}</span>
      <span className="text-sm">{label}</span>
    </div>
  );
}
