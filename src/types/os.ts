export type AppId = 'mycomputer' | 'recyclebin' | 'notepad' | 'paint' | 'browser' | 'minesweeper';

export type BootPhase = 'bios' | 'loading' | 'desktop';

export interface WindowState {
  id: string;
  appId: AppId;
  title: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  prevX?: number;
  prevY?: number;
  prevWidth?: number;
  prevHeight?: number;
  appState: Record<string, any>;
}

export interface DesktopIcon {
  id: string;
  appId: AppId;
  label: string;
  icon: string;
  x: number;
  y: number;
}

export interface NotepadDoc {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  isDirty: boolean;
}

export interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  icon: string;
  size?: string;
  modified?: string;
  children?: FileItem[];
}

export interface ThemeColors {
  desktopBg: string;
  desktopBgPattern?: string;
  taskbarBg: string;
  taskbarText: string;
  taskbarHighlight: string;
  taskbarShadow: string;
  windowBg: string;
  windowBorder: string;
  windowTitleBarActiveStart: string;
  windowTitleBarActiveEnd: string;
  windowTitleBarInactiveStart: string;
  windowTitleBarInactiveEnd: string;
  windowTitleTextActive: string;
  windowTitleTextInactive: string;
  buttonFace: string;
  buttonHighlight: string;
  buttonShadow: string;
  buttonText: string;
  selectedBg: string;
  selectedText: string;
  menuBg: string;
  menuText: string;
  menuHighlight: string;
  accent: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
}

export interface ContextMenuItem {
  label: string;
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
  divider?: boolean;
}

export interface ContextMenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

export interface OSState {
  bootPhase: BootPhase;
  bootProgress: number;
  windows: WindowState[];
  activeWindowId: string | null;
  zIndexCounter: number;
  theme: string;
  desktopIcons: DesktopIcon[];
  notepadDocs: NotepadDoc[];
  showStartMenu: boolean;
  contextMenu: ContextMenuState | null;
  selectedIconId: string | null;
}
