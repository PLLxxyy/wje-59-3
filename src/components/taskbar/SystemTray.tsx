import { useState, useEffect } from 'react';

export default function SystemTray() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="h-6 px-2 mx-1 flex items-center gap-2 os-inset">
      <span className="text-base cursor-pointer" title="音量">🔊</span>
      <span className="text-base cursor-pointer" title="网络">📶</span>
      <span className="text-xs ml-1" style={{ color: 'var(--os-taskbarText)' }}>
        {formatTime(time)}
      </span>
    </div>
  );
}
