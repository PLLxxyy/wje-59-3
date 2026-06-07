import { useOSStore } from '@/store/useOSStore';
import StartButton from './StartButton';
import TaskbarApp from './TaskbarApp';
import SystemTray from './SystemTray';

export default function Taskbar() {
  const { windows } = useOSStore();

  return (
    <div
      className="absolute bottom-0 left-0 right-0 flex items-center z-50"
      style={{
        height: '28px',
        background: 'var(--os-taskbarBg)',
        borderTop: '1px solid var(--os-taskbarHighlight)',
      }}
    >
      <StartButton />
      <div className="h-5 mx-1 border-l border-[var(--os-taskbarShadow)] border-r border-[var(--os-taskbarHighlight)]" />
      <div className="flex-1 flex items-center gap-1 px-1 overflow-x-auto">
        {windows.map((window) => (
          <TaskbarApp key={window.id} window={window} />
        ))}
      </div>
      <div className="h-5 mx-1 border-l border-[var(--os-taskbarShadow)] border-r border-[var(--os-taskbarHighlight)]" />
      <SystemTray />
    </div>
  );
}
