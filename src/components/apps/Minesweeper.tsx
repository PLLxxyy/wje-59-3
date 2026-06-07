import { useState, useEffect, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'

type Difficulty = 'beginner' | 'intermediate' | 'expert'
type GameStatus = 'idle' | 'playing' | 'won' | 'lost'

interface Cell {
  isMine: boolean
  isRevealed: boolean
  isFlagged: boolean
  adjacentMines: number
}

const DIFFICULTIES: Record<Difficulty, { rows: number; cols: number; mines: number }> = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
}

const NUMBER_COLORS: Record<number, string> = {
  1: 'text-blue-600',
  2: 'text-green-600',
  3: 'text-red-600',
  4: 'text-purple-900',
  5: 'text-red-800',
  6: 'text-cyan-600',
  7: 'text-black',
  8: 'text-gray-500',
}

function createEmptyBoard(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  )
}

function placeMines(
  board: Cell[][],
  mines: number,
  excludeRow: number,
  excludeCol: number
): Cell[][] {
  const rows = board.length
  const cols = board[0].length
  const newBoard = board.map(row => row.map(cell => ({ ...cell })))
  let placed = 0

  while (placed < mines) {
    const r = Math.floor(Math.random() * rows)
    const c = Math.floor(Math.random() * cols)

    if (
      !newBoard[r][c].isMine &&
      !(Math.abs(r - excludeRow) <= 1 && Math.abs(c - excludeCol) <= 1)
    ) {
      newBoard[r][c].isMine = true
      placed++
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!newBoard[r][c].isMine) {
        let count = 0
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr
            const nc = c + dc
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newBoard[nr][nc].isMine) {
              count++
            }
          }
        }
        newBoard[r][c].adjacentMines = count
      }
    }
  }

  return newBoard
}

function revealCell(board: Cell[][], row: number, col: number): Cell[][] {
  const rows = board.length
  const cols = board[0].length
  const newBoard = board.map(r => r.map(c => ({ ...c })))

  const reveal = (r: number, c: number) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return
    if (newBoard[r][c].isRevealed || newBoard[r][c].isFlagged) return

    newBoard[r][c].isRevealed = true

    if (newBoard[r][c].adjacentMines === 0 && !newBoard[r][c].isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          reveal(r + dr, c + dc)
        }
      }
    }
  }

  reveal(row, col)
  return newBoard
}

function checkWin(board: Cell[][]): boolean {
  for (const row of board) {
    for (const cell of row) {
      if (!cell.isMine && !cell.isRevealed) return false
    }
  }
  return true
}

function SevenSegmentDisplay({ value, digits = 3 }: { value: number; digits?: number }) {
  const display = Math.max(-99, Math.min(999, value)).toString().padStart(digits, '0')

  return (
    <div className="flex bg-black px-1 py-0.5 border-2 border-t-gray-700 border-l-gray-700 border-r-white border-b-white">
      {display.split('').map((char, i) => (
        <span
          key={i}
          className="font-mono text-xl font-bold text-red-500 leading-none"
          style={{
            fontFamily: 'monospace',
            textShadow: '0 0 5px rgba(255, 0, 0, 0.5)',
            minWidth: '14px',
            textAlign: 'center',
          }}
        >
          {char}
        </span>
      ))}
    </div>
  )
}

interface MinesweeperProps {
  windowId: string;
}

export default function Minesweeper({}: MinesweeperProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner')
  const [board, setBoard] = useState<Cell[][]>([])
  const [status, setStatus] = useState<GameStatus>('idle')
  const [time, setTime] = useState(0)
  const [flagCount, setFlagCount] = useState(0)
  const timerRef = useRef<number | null>(null)

  const config = DIFFICULTIES[difficulty]

  const initGame = useCallback(() => {
    setBoard(createEmptyBoard(config.rows, config.cols))
    setStatus('idle')
    setTime(0)
    setFlagCount(0)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [config])

  useEffect(() => {
    initGame()
  }, [initGame])

  useEffect(() => {
    if (status === 'playing') {
      timerRef.current = window.setInterval(() => {
        setTime(t => Math.min(t + 1, 999))
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [status])

  const handleCellClick = (row: number, col: number) => {
    if (status === 'won' || status === 'lost') return
    if (board[row][col].isRevealed || board[row][col].isFlagged) return

    let currentBoard = board

    if (status === 'idle') {
      currentBoard = placeMines(board, config.mines, row, col)
      setStatus('playing')
    }

    if (currentBoard[row][col].isMine) {
      const lostBoard = currentBoard.map(r =>
        r.map(c => ({
          ...c,
          isRevealed: c.isMine ? true : c.isRevealed,
        }))
      )
      setBoard(lostBoard)
      setStatus('lost')
      return
    }

    const newBoard = revealCell(currentBoard, row, col)
    setBoard(newBoard)

    if (checkWin(newBoard)) {
      setStatus('won')
    }
  }

  const handleRightClick = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault()
    if (status === 'won' || status === 'lost') return
    if (board[row][col].isRevealed) return

    const newBoard = board.map(r => r.map(c => ({ ...c })))
    newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged
    setBoard(newBoard)
    setFlagCount(prev => (newBoard[row][col].isFlagged ? prev + 1 : prev - 1))
  }

  const getFace = () => {
    if (status === 'won') return '😎'
    if (status === 'lost') return '😵'
    return '😊'
  }

  const getCellContent = (cell: Cell) => {
    if (cell.isFlagged && !cell.isRevealed) return '🚩'
    if (!cell.isRevealed) return ''
    if (cell.isMine) return '💣'
    if (cell.adjacentMines === 0) return ''
    return cell.adjacentMines
  }

  const remainingMines = config.mines - flagCount

  return (
    <div className="flex flex-col items-center p-2 bg-[#c0c0c0] h-full">
      <div className="flex gap-2 mb-2">
        {(['beginner', 'intermediate', 'expert'] as Difficulty[]).map(d => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            className={cn(
              'px-2 py-1 text-xs border-2',
              difficulty === d
                ? 'border-t-gray-700 border-l-gray-700 border-r-white border-b-white bg-[#c0c0c0]'
                : 'border-t-white border-l-white border-r-gray-700 border-b-gray-700 bg-[#c0c0c0] hover:bg-[#d0d0d0]'
            )}
          >
            {d === 'beginner' ? '初级' : d === 'intermediate' ? '中级' : '高级'}
          </button>
        ))}
      </div>

      <div
        className="border-4 border-t-gray-700 border-l-gray-700 border-r-white border-b-white p-2"
        style={{ backgroundColor: '#c0c0c0' }}
      >
        <div className="flex justify-between items-center mb-2 p-2 border-2 border-t-gray-700 border-l-gray-700 border-r-white border-b-white">
          <SevenSegmentDisplay value={remainingMines} />
          <button
            onClick={initGame}
            className="text-xl border-2 border-t-white border-l-white border-r-gray-700 border-b-gray-700 bg-[#c0c0c0] w-9 h-9 flex items-center justify-center active:border-t-gray-700 active:border-l-gray-700 active:border-r-white active:border-b-white"
          >
            {getFace()}
          </button>
          <SevenSegmentDisplay value={time} />
        </div>

        <div
          className="border-4 border-t-gray-700 border-l-gray-700 border-r-white border-b-white"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${config.cols}, 20px)`,
            gridTemplateRows: `repeat(${config.rows}, 20px)`,
          }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                onContextMenu={(e) => handleRightClick(e, r, c)}
                className={cn(
                  'w-5 h-5 flex items-center justify-center text-xs font-bold select-none',
                  cell.isRevealed
                    ? 'border border-gray-400 bg-[#c0c0c0]'
                    : 'border-2 border-t-white border-l-white border-r-gray-700 border-b-gray-700 bg-[#c0c0c0] active:border-0 active:bg-[#c0c0c0]',
                  !cell.isRevealed && 'hover:brightness-95',
                  cell.isRevealed && cell.isMine && 'bg-red-500',
                  NUMBER_COLORS[cell.adjacentMines]
                )}
                disabled={status === 'won' || status === 'lost'}
              >
                {getCellContent(cell)}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
