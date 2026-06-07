import { useOSStore } from '@/store/useOSStore';
import BiosScreen from './BiosScreen';
import LoadingScreen from './LoadingScreen';

export default function BootScreen() {
  const { bootPhase } = useOSStore();

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {bootPhase === 'bios' && (
        <div className="w-full h-full animate-fade-in">
          <BiosScreen />
        </div>
      )}
      {bootPhase === 'loading' && (
        <div className="w-full h-full animate-fade-in">
          <LoadingScreen />
        </div>
      )}
      <style>{`
        @keyframes fade-in {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
