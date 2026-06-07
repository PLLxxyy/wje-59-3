import { useOSStore } from '@/store/useOSStore';

export default function StartButton() {
  const { showStartMenu, toggleStartMenu } = useOSStore();

  return (
    <button
      data-start-button
      className={`h-6 px-2 mx-1 flex items-center gap-1 font-bold text-sm cursor-pointer select-none ${
        showStartMenu ? 'os-button-active' : 'os-button'
      }`}
      onClick={toggleStartMenu}
    >
      <span className="text-lg">🪟</span>
      <span>开始</span>
    </button>
  );
}
