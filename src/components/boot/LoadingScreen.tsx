import { useEffect, useRef } from 'react';
import { useOSStore } from '@/store/useOSStore';

export default function LoadingScreen() {
  const { bootProgress, setBootProgress, setBootPhase } = useOSStore();
  const progressRef = useRef(bootProgress);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    progressRef.current = bootProgress;
  }, [bootProgress]);

  useEffect(() => {
    let startTime: number | null = null;
    const startProgress = Math.max(50, progressRef.current);
    const targetProgress = 100;
    const duration = 4000;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(
        targetProgress,
        startProgress + (elapsed / duration) * (targetProgress - startProgress)
      );

      setBootProgress(Math.floor(progress));

      if (progress < targetProgress) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        const timer = window.setTimeout(() => {
          setBootPhase('desktop');
        }, 800);
        return () => window.clearTimeout(timer);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [setBootProgress, setBootPhase]);

  return (
    <div
      className="flex flex-col items-center justify-center h-full w-full"
      style={{
        backgroundColor: '#000000',
      }}
    >
      <div className="flex flex-col items-center gap-8 px-8">
        <div
          className="text-6xl font-bold tracking-wider animate-pulse"
          style={{
            background: `linear-gradient(180deg, var(--os-windowTitleBarActiveEnd, #1084d0) 0%, var(--os-windowTitleBarActiveStart, #000080) 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Windows
        </div>

        <div
          className="text-2xl font-light tracking-wide"
          style={{
            color: 'var(--os-buttonHighlight, #ffffff)',
          }}
        >
          正在启动...
        </div>

        <div className="w-80">
          <div
            className="w-full h-6 border-2 overflow-hidden"
            style={{
              borderColor: 'var(--os-buttonHighlight, #ffffff)',
              backgroundColor: '#000000',
            }}
          >
            <div
              className="h-full transition-all duration-100 relative overflow-hidden"
              style={{
                width: `${bootProgress}%`,
                background: `linear-gradient(90deg, var(--os-windowTitleBarActiveStart, #000080) 0%, var(--os-windowTitleBarActiveEnd, #1084d0) 50%, var(--os-windowTitleBarActiveStart, #000080) 100%)`,
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(255,255,255,0.3) 8px, rgba(255,255,255,0.3) 16px)',
                  animation: 'progress-shine 1s linear infinite',
                }}
              />
            </div>
          </div>
          <div
            className="text-center mt-2 text-xs"
            style={{
              color: 'var(--os-buttonHighlight, #ffffff)',
            }}
          >
            {bootProgress}%
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-2">
          <div
            className="text-xs"
            style={{
              color: 'var(--os-buttonShadow, #808080)',
            }}
          >
            © 1985-1998 Microsoft Corporation
          </div>
          <div
            className="text-xs"
            style={{
              color: 'var(--os-buttonShadow, #808080)',
            }}
          >
            Version 4.10.1998
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progress-shine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
