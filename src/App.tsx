import { useOSStore } from '@/store/useOSStore';
import BootScreen from '@/components/boot';
import Desktop from '@/components/desktop/Desktop';
import WindowManager from '@/components/window/WindowManager';
import Taskbar from '@/components/taskbar/Taskbar';
import StartMenu from '@/components/startmenu/StartMenu';

export default function App() {
  const { bootPhase } = useOSStore();

  return (
    <div className="w-screen h-screen overflow-hidden select-none">
      {bootPhase !== 'desktop' && <BootScreen />}
      {bootPhase === 'desktop' && (
        <>
          <Desktop />
          <WindowManager />
          <StartMenu />
          <Taskbar />
        </>
      )}
    </div>
  );
}
