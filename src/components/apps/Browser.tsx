import { useState, useEffect } from 'react'
import { useOSStore } from '@/store/useOSStore'

interface BrowserProps {
  windowId: string
}

interface HistoryItem {
  url: string
  title: string
}

const welcomePage = {
  url: 'http://welcome.internet',
  title: '欢迎使用互联网',
  content: (
    <div className="min-h-full bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🌐</div>
          <h1 className="text-2xl font-bold text-[var(--os-accent)] mb-2">
            欢迎使用互联网！</h1>
          <p className="text-gray-600">欢迎来到信息高速公路</p>
        </div>

        <div className="os-inset p-4 mb-6 bg-[#ffffe0]">
          <p className="text-sm">
            <strong>🎉 恭喜！</strong>您已成功连接到互联网。
            现在您可以浏览万维网，发送电子邮件，下载文件，以及更多！
          </p>
          <p className="text-sm mt-2">
            这是一个模拟的浏览器演示页面。
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div
            className="os-raised p-3 text-center bg-[var(--os-buttonFace)] cursor-pointer hover:brightness-105"
            data-url="http://search.internet"
          >
            <div className="text-3xl mb-2">📧</div>
            <div className="text-sm font-bold">电子邮件</div>
            <div className="text-xs text-gray-600">发送和接收邮件</div>
          </div>
          <div
            className="os-raised p-3 text-center bg-[var(--os-buttonFace)] cursor-pointer hover:brightness-105"
            data-url="http://search.internet"
          >
            <div className="text-3xl mb-2">🔍</div>
            <div className="text-sm font-bold">搜索引擎</div>
            <div className="text-xs text-gray-600">搜索整个网络</div>
          </div>
          <div
            className="os-raised p-3 text-center bg-[var(--os-buttonFace)] cursor-pointer hover:brightness-105"
            data-url="http://search.internet"
          >
            <div className="text-3xl mb-2">📁</div>
            <div className="text-sm font-bold">文件下载</div>
            <div className="text-xs text-gray-600">下载共享软件</div>
          </div>
        </div>

        <div className="os-raised p-4 bg-[var(--os-buttonFace)]">
          <div className="font-bold mb-2 text-sm">📰 今日要闻</div>
          <ul className="text-sm space-y-1">
            <li>• Windows 95 发布，开启新时代</li>
            <li>• 拨号上网速度达到 56Kbps</li>
            <li>• 互联网用户突破 1000 万</li>
            <li>• 电子商务开始流行</li>
          </ul>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>© 1995-2024 Retro Internet, Inc.</p>
          <p className="mt-1">最佳浏览分辨率 800x600</p>
        </div>
      </div>
    </div>
  ),
}

const aboutPage = {
  url: 'about:blank',
  title: '空白页',
  content: (
    <div className="min-h-full bg-white flex items-center justify-center">
      <div className="text-center text-gray-400">
        <div className="text-4xl mb-2">📄</div>
        <p>空白页</p>
      </div>
    </div>
  ),
}

const searchPage = {
  url: 'http://search.internet',
  title: '网络搜索',
  content: (
    <div className="min-h-full bg-white p-8">
      <div className="max-w-xl mx-auto text-center">
        <div className="text-5xl mb-6">🔍</div>
        <h1 className="text-3xl font-bold text-[var(--os-accent)] mb-6">网络搜索</h1>
        <div className="os-inset p-2 mb-4">
          <input
            type="text"
            className="w-full px-3 py-2 border-none outline-none text-sm"
            placeholder="输入搜索关键词..."
          />
        </div>
        <div className="flex justify-center gap-2">
          <button className="os-button">🔍 搜索</button>
          <button className="os-button">🎲 手气不错</button>
        </div>
        <div className="mt-8 text-left">
          <div className="text-sm font-bold mb-2">热门搜索：</div>
          <div className="flex flex-wrap gap-2">
            {['Windows 95', '互联网', '计算机', '游戏', '软件下载', '科技新闻'].map(tag => (
              <span
                key={tag}
                className="os-raised px-2 py-1 text-xs bg-[var(--os-buttonFace)] cursor-pointer hover:bg-blue-50"
                data-url="http://welcome.internet"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
}

const pages: Record<string, { url: string; title: string; content: React.ReactNode }> = {
  'http://welcome.internet': welcomePage,
  'about:blank': aboutPage,
  'http://search.internet': searchPage,
}

export default function Browser({ windowId }: BrowserProps) {
  const { updateAppState, windows } = useOSStore()
  const windowState = windows.find(w => w.id === windowId)
  const appState = windowState?.appState || {}

  const [history, setHistory] = useState<HistoryItem[]>(appState.history || [{ url: 'http://welcome.internet', title: '欢迎使用互联网' }])
  const [historyIndex, setHistoryIndex] = useState<number>(appState.historyIndex ?? 0)
  const [addressInput, setAddressInput] = useState('')

  useEffect(() => {
    updateAppState(windowId, { history, historyIndex })
  }, [history, historyIndex, windowId, updateAppState])

  const currentUrl = history[historyIndex]?.url || 'about:blank'
  const currentPage = pages[currentUrl] || aboutPage

  const handleGo = () => {
    const url = addressInput.trim() || 'about:blank'
    const newHistory = history.slice(0, historyIndex + 1)
    const newUrl = pages[url] ? url : 'about:blank'
    setHistory([...newHistory, { url: newUrl, title: pages[newUrl]?.title || newUrl }])
    setHistoryIndex(newHistory.length)
    setAddressInput('')
  }

  const handleBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
    }
  }

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
    }
  }

  const handleRefresh = () => {
    const newHistory = [...history]
    setHistory(newHistory)
  }

  const handleHome = () => {
    const newHistory = history.slice(0, historyIndex + 1)
    setHistory([...newHistory, { url: 'http://welcome.internet', title: '欢迎使用互联网' }])
    setHistoryIndex(newHistory.length)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGo()
    }
  }

  const handleNavClick = (url: string) => {
    const newHistory = history.slice(0, historyIndex + 1)
    setHistory([...newHistory, { url, title: pages[url]?.title || url }])
    setHistoryIndex(newHistory.length)
  }

  return (
    <div className="flex flex-col h-full bg-[var(--os-windowBg)]">
      <div className="bg-[var(--os-menuBg)] px-1 py-0.5 border-b border-[var(--os-buttonShadow)] flex gap-4 text-xs">
        <span className="cursor-pointer hover:bg-[var(--os-menuHighlight)] hover:text-[var(--os-selectedText)] px-2 py-0.5">文件(F)</span>
        <span className="cursor-pointer hover:bg-[var(--os-menuHighlight)] hover:text-[var(--os-selectedText)] px-2 py-0.5">编辑(E)</span>
        <span className="cursor-pointer hover:bg-[var(--os-menuHighlight)] hover:text-[var(--os-selectedText)] px-2 py-0.5">查看(V)</span>
        <span className="cursor-pointer hover:bg-[var(--os-menuHighlight)] hover:text-[var(--os-selectedText)] px-2 py-0.5">收藏(A)</span>
        <span className="cursor-pointer hover:bg-[var(--os-menuHighlight)] hover:text-[var(--os-selectedText)] px-2 py-0.5">工具(T)</span>
        <span className="cursor-pointer hover:bg-[var(--os-menuHighlight)] hover:text-[var(--os-selectedText)] px-2 py-0.5">帮助(H)</span>
      </div>

      <div className="os-inset bg-[var(--os-buttonFace)] p-1 flex items-center gap-1 flex-wrap">
        <button className="os-button text-xs" onClick={handleBack} disabled={historyIndex === 0}>
          ← 后退
        </button>
        <button className="os-button text-xs" onClick={handleForward} disabled={historyIndex >= history.length - 1}>
          → 前进
        </button>
        <button className="os-button text-xs" onClick={handleRefresh}>
          🔄 刷新
        </button>
        <button className="os-button text-xs" onClick={handleHome}>
          🏠 主页
        </button>
      </div>

      <div className="os-inset bg-white px-2 py-1 flex items-center gap-1 text-xs">
        <span className="text-[var(--os-buttonShadow)]">地址</span>
        <input
          type="text"
          className="os-raised flex-1 px-2 py-0.5 bg-white outline-none text-xs"
          placeholder={currentUrl}
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="os-button text-xs" onClick={handleGo}>
          ➡️ 转到
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-white">
        <div onClick={(e) => {
          const target = e.target as HTMLElement
          const url = target.getAttribute('data-url')
          if (url && pages[url]) {
            e.preventDefault()
            handleNavClick(url)
          }
        }}>
          {currentPage.content}
        </div>
      </div>

      <div className="os-inset bg-[var(--os-buttonFace)] px-2 py-1 flex gap-8 text-xs text-[var(--os-buttonText)]">
        <span>完成</span>
        <span>本地 Intranet</span>
        <span>
          {currentUrl.startsWith('http') ? '🔒 安全' : '📄 文档'}
        </span>
      </div>
    </div>
  )
}
