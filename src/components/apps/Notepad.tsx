import { useState, useEffect, useRef, useCallback } from 'react';
import { useOSStore } from '@/store/useOSStore';
import { generateId } from '@/utils/id';
import type { NotepadDoc } from '@/types/os';

interface NotepadProps {
  windowId: string;
}

export default function Notepad({ windowId }: NotepadProps) {
  const { notepadDocs, saveNotepadDoc, updateAppState, closeWindow } = useOSStore();
  const windowState = useOSStore(state => state.windows.find(w => w.id === windowId));

  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [docId, setDocId] = useState<string>('');
  const [docName, setDocName] = useState<string>('未命名');

  const [line, setLine] = useState(1);
  const [col, setCol] = useState(1);
  const [wordWrap, setWordWrap] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateTitle = useCallback((name: string, dirty: boolean) => {
    const title = `记事本 - ${name}${dirty ? ' *' : ''}`;
    updateAppState(windowId, { title });
  }, [windowId, updateAppState]);

  useEffect(() => {
    if (windowState) {
      const state = windowState.appState || {};
      if (state.content !== undefined && state.content !== content) {
        setContent(state.content);
      }
      if (state.isDirty !== undefined) {
        setIsDirty(state.isDirty);
      }
      if (state.docId !== undefined && state.docId !== docId) {
        setDocId(state.docId);
      }
      if (state.docName !== undefined && state.docName !== docName) {
        setDocName(state.docName);
      }
    }
  }, [windowState?.appState?.content, windowState?.appState?.isDirty, windowState?.appState?.docId, windowState?.appState?.docName]);

  useEffect(() => {
    updateTitle(docName, isDirty);
  }, [docName, isDirty, updateTitle]);

  useEffect(() => {
    if (textareaRef.current && textareaRef.current.value !== content) {
      textareaRef.current.value = content;
    }
  }, [content]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setIsDirty(true);
    updateAppState(windowId, { content: newContent, isDirty: true });
    updateCursorPosition(e.target);
  };

  const updateCursorPosition = (textarea: HTMLTextAreaElement) => {
    const pos = textarea.selectionStart;
    const textBefore = textarea.value.substring(0, pos);
    const lines = textBefore.split('\n');
    setLine(lines.length);
    setCol(lines[lines.length - 1].length + 1);
  };

  const handleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    updateCursorPosition(e.currentTarget);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    updateCursorPosition(e.currentTarget);
  };

  const checkUnsavedChanges = (): boolean => {
    if (isDirty) {
      const result = confirm(`${docName} 有未保存的更改，是否保存？`);
      if (result) {
        handleSave();
      }
      return result;
    }
    return true;
  };

  const handleNew = () => {
    if (!checkUnsavedChanges()) return;
    setContent('');
    setIsDirty(false);
    setDocId('');
    setDocName('未命名');
    updateAppState(windowId, { content: '', docId: '', docName: '未命名' });
  };

  const handleOpen = (doc: NotepadDoc) => {
    if (!checkUnsavedChanges()) return;
    setContent(doc.content);
    setIsDirty(false);
    setDocId(doc.id);
    setDocName(doc.name);
    updateAppState(windowId, { content: doc.content, docId: doc.id, docName: doc.name });
    setActiveMenu(null);
  };

  const handleSave = () => {
    const now = Date.now();
    const doc: NotepadDoc = {
      id: docId || generateId(),
      name: docName,
      content,
      createdAt: docId ? (notepadDocs.find(d => d.id === docId)?.createdAt || now) : now,
      updatedAt: now,
      isDirty: false,
    };
    saveNotepadDoc(doc);
    setDocId(doc.id);
    setIsDirty(false);
    updateAppState(windowId, { docId: doc.id });
  };

  const handleSaveAs = () => {
    const name = prompt('输入文件名：', docName);
    if (!name) return;
    const now = Date.now();
    const doc: NotepadDoc = {
      id: generateId(),
      name,
      content,
      createdAt: now,
      updatedAt: now,
      isDirty: false,
    };
    saveNotepadDoc(doc);
    setDocId(doc.id);
    setDocName(name);
    setIsDirty(false);
    updateAppState(windowId, { docId: doc.id, docName: name });
  };

  const handleExit = () => {
    if (!checkUnsavedChanges()) return;
    closeWindow(windowId);
  };

  const handleUndo = () => {
    document.execCommand('undo');
  };

  const handleCut = () => {
    document.execCommand('cut');
  };

  const handleCopy = () => {
    document.execCommand('copy');
  };

  const handlePaste = () => {
    document.execCommand('paste');
  };

  const handleSelectAll = () => {
    if (textareaRef.current) {
      textareaRef.current.select();
    }
  };

  const menuItems = {
    文件: [
      { label: '新建', onClick: handleNew, shortcut: 'Ctrl+N' },
      { label: '打开', submenu: true },
      { label: '保存', onClick: handleSave, shortcut: 'Ctrl+S' },
      { label: '另存为', onClick: handleSaveAs },
      { divider: true },
      { label: '退出', onClick: handleExit },
    ],
    编辑: [
      { label: '撤销', onClick: handleUndo, shortcut: 'Ctrl+Z' },
      { divider: true },
      { label: '剪切', onClick: handleCut, shortcut: 'Ctrl+X' },
      { label: '复制', onClick: handleCopy, shortcut: 'Ctrl+C' },
      { label: '粘贴', onClick: handlePaste, shortcut: 'Ctrl+V' },
      { divider: true },
      { label: '全选', onClick: handleSelectAll, shortcut: 'Ctrl+A' },
    ],
    查看: [
      { label: '自动换行', onClick: () => setWordWrap(!wordWrap), checked: wordWrap },
    ],
    帮助: [
      { label: '关于记事本', onClick: () => alert('复古记事本 v1.0') },
    ],
  };

  const handleMenuClick = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    if (activeMenu) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeMenu]);

  return (
    <div className="flex flex-col h-full bg-[var(--os-windowBg)]" onClick={(e) => e.stopPropagation()}>
      <div className="flex gap-1 px-1 py-0.5 text-xs">
        {Object.keys(menuItems).map((menu) => (
          <div key={menu} className="relative">
            <button
              className={`px-2 py-0.5 ${activeMenu === menu ? 'bg-[var(--os-menuHighlight)] text-[var(--os-selectedText)]' : ''}`}
              onClick={(e) => { e.stopPropagation(); handleMenuClick(menu); }}
            >
              <u>{menu[0]}</u>{menu.slice(1)}
            </button>
            {activeMenu === menu && (
              <div className="absolute left-0 top-full z-50 os-raised bg-[var(--os-menuBg)] min-w-32 py-1">
                {menuItems[menu as keyof typeof menuItems].map((item, idx) => (
                  item.divider ? (
                    <div key={idx} className="os-menu-divider" />
                  ) : item.submenu ? (
                    <div key={idx} className="relative">
                      <div className="os-menu-item">
                        <span>{item.label}</span>
                        <span className="ml-auto">▶</span>
                      </div>
                      {activeMenu === menu && (
                        <div className="absolute left-full top-0 os-raised bg-[var(--os-menuBg)] min-w-40 py-1 max-h-60 overflow-y-auto">
                          {notepadDocs.length === 0 ? (
                            <div className="os-menu-item os-menu-item-disabled">没有已保存的文档</div>
                          ) : (
                            notepadDocs.map((doc) => (
                              <div key={doc.id} className="os-menu-item" onClick={(e) => { e.stopPropagation(); handleOpen(doc); }}>
                                📄 {doc.name}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      key={idx}
                      className="os-menu-item"
                      onClick={(e) => { e.stopPropagation(); item.onClick?.(); setActiveMenu(null); }}
                    >
                      {item.checked !== undefined && <span>{item.checked ? '✓' : ' '}</span>}
                      <span>{item.label}</span>
                      {item.shortcut && <span className="ml-auto text-[var(--os-buttonShadow)]">{item.shortcut}</span>}
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-0.5 px-1 py-1 border-t border-[var(--os-buttonHighlight)] border-b border-[var(--os-buttonShadow)]">
        {[
          { icon: '📄', title: '新建', onClick: handleNew },
          { icon: '📂', title: '打开', onClick: () => setActiveMenu('文件') },
          { icon: '💾', title: '保存', onClick: handleSave },
          { type: 'divider' },
          { icon: '✂️', title: '剪切', onClick: handleCut },
          { icon: '📋', title: '复制', onClick: handleCopy },
          { icon: '📌', title: '粘贴', onClick: handlePaste },
        ].map((item, idx) => (
          item.type === 'divider' ? (
            <div key={idx} className="w-px mx-1 bg-[var(--os-buttonShadow)] border-r border-[var(--os-buttonHighlight)]" />
          ) : (
            <button
              key={idx}
              className="os-button w-8 h-8 px-0 py-0"
              onClick={item.onClick}
              title={item.title}
            >
              {item.icon}
            </button>
          )
        ))}
      </div>

      <div className="flex-1 os-inset bg-white m-1 overflow-hidden">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onClick={handleClick}
          onKeyUp={handleKeyUp}
          onMouseUp={handleClick}
          className="w-full h-full p-1 resize-none outline-none"
          style={{
            fontFamily: '"Courier New", "Consolas", monospace',
            fontSize: '13px',
            lineHeight: '1.4',
            whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
            overflowWrap: wordWrap ? 'break-word' : 'normal',
          }}
        />
      </div>

      <div className="flex gap-4 px-2 py-0.5 text-xs border-t border-[var(--os-buttonShadow)] bg-[var(--os-windowBg)]">
        <div className="os-inset px-2 py-0.5">第 {line} 行</div>
        <div className="os-inset px-2 py-0.5">第 {col} 列</div>
        <div className="os-inset px-2 py-0.5">{isDirty ? '已修改' : '已保存'}</div>
        <div className="ml-auto os-inset px-2 py-0.5">UTF-8</div>
      </div>
    </div>
  );
}
