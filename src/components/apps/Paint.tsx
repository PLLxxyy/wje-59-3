import React, { useState, useRef, useEffect, useCallback } from 'react';

type Tool = 'pencil' | 'brush' | 'eraser' | 'fill' | 'line' | 'rect' | 'ellipse';
type BrushSize = 1 | 3 | 5 | 8;

const PALETTE = ['#000000','#808080','#800000','#808000','#008000','#008080','#000080','#800080','#808040','#004040','#0080ff','#004080','#ffffff','#c0c0c0','#ff0000','#ffff00','#00ff00','#00ffff','#0000ff','#ff00ff','#ffff80','#00ff80','#80ffff','#8080ff'];
const TOOLS: {id:Tool;icon:string}[] = [{id:'pencil',icon:'✏️'},{id:'brush',icon:'🖌️'},{id:'eraser',icon:'🧽'},{id:'fill',icon:'🪣'},{id:'line',icon:'📏'},{id:'rect',icon:'⬜'},{id:'ellipse',icon:'⭕'}];
const BRUSH_SIZES: BrushSize[] = [1, 3, 5, 8];

interface PaintProps {
  windowId: string;
}

export default function Paint({}: PaintProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const historyRef = useRef<ImageData[]>([]);
  const historyIdxRef = useRef(-1);

  const [tool, setTool] = useState<Tool>('pencil');
  const [brushSize, setBrushSize] = useState<BrushSize>(3);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{x:number;y:number} | null>(null);
  const [mousePos, setMousePos] = useState<{x:number;y:number} | null>(null);
  const [canvasSize] = useState({ w: 600, h: 400 });
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [tempData, setTempData] = useState<ImageData | null>(null);

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current, ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const img = ctx.getImageData(0, 0, canvasSize.w, canvasSize.h);
    historyRef.current = historyRef.current.slice(0, historyIdxRef.current + 1);
    historyRef.current.push(img);
    historyIdxRef.current = historyRef.current.length - 1;
    if (historyRef.current.length > 50) { historyRef.current.shift(); historyIdxRef.current--; }
  }, [canvasSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctxRef.current = ctx;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);
    saveHistory();
  }, []);

  const undo = () => { if (historyIdxRef.current > 0) { historyIdxRef.current--; restore(); }};
  const redo = () => { if (historyIdxRef.current < historyRef.current.length - 1) { historyIdxRef.current++; restore(); }};
  const restore = () => { const ctx = ctxRef.current; if (ctx) ctx.putImageData(historyRef.current[historyIdxRef.current], 0, 0); };

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const r = canvas.getBoundingClientRect();
    return { x: Math.floor((e.clientX - r.left) * (canvasSize.w / r.width)), y: Math.floor((e.clientY - r.top) * (canvasSize.h / r.height)) };
  };

  const floodFill = (sx: number, sy: number, color: string) => {
    const canvas = canvasRef.current, ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const img = ctx.getImageData(0, 0, canvasSize.w, canvasSize.h), d = img.data;
    const si = (sy * canvasSize.w + sx) * 4, sr = d[si], sg = d[si+1], sb = d[si+2];
    const fr = parseInt(color.slice(1,3),16), fg = parseInt(color.slice(3,5),16), fb = parseInt(color.slice(5,7),16);
    if (sr === fr && sg === fg && sb === fb) return;
    const stack = [[sx, sy]];
    while (stack.length) {
      const [x, y] = stack.pop()!;
      if (x < 0 || x >= canvasSize.w || y < 0 || y >= canvasSize.h) continue;
      const i = (y * canvasSize.w + x) * 4;
      if (d[i] !== sr || d[i+1] !== sg || d[i+2] !== sb) continue;
      d[i] = fr; d[i+1] = fg; d[i+2] = fb; d[i+3] = 255;
      stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
    }
    ctx.putImageData(img, 0, 0);
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getPos(e);
    setDrawing(true);
    setStartPos(pos);
    const ctx = ctxRef.current;
    if (!ctx) return;
    if (tool === 'fill') { floodFill(pos.x, pos.y, fgColor); saveHistory(); setDrawing(false); return; }
    if (['pencil','brush','eraser'].includes(tool)) {
      ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = tool === 'eraser' ? bgColor : fgColor;
      ctx.lineWidth = tool === 'pencil' ? 1 : brushSize;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    } else {
      setTempData(ctx.getImageData(0, 0, canvasSize.w, canvasSize.h));
    }
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getPos(e);
    setMousePos(pos);
    if (!drawing) return;
    const ctx = ctxRef.current;
    if (!ctx || !startPos) return;
    if (['pencil','brush','eraser'].includes(tool)) {
      ctx.lineTo(pos.x, pos.y); ctx.stroke();
    } else if (tempData) {
      ctx.putImageData(tempData, 0, 0);
      ctx.strokeStyle = fgColor; ctx.lineWidth = brushSize; ctx.beginPath();
      if (tool === 'line') { ctx.moveTo(startPos.x, startPos.y); ctx.lineTo(pos.x, pos.y); }
      else if (tool === 'rect') ctx.rect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
      else if (tool === 'ellipse') {
        const rx = Math.abs(pos.x - startPos.x) / 2, ry = Math.abs(pos.y - startPos.y) / 2;
        const cx = startPos.x + (pos.x - startPos.x) / 2, cy = startPos.y + (pos.y - startPos.y) / 2;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      }
      ctx.stroke();
    }
  };

  const onMouseUp = () => { if (drawing) saveHistory(); setDrawing(false); setStartPos(null); setTempData(null); ctxRef.current?.beginPath(); };
  const clearCanvas = () => { const ctx = ctxRef.current; if (!ctx) return; ctx.fillStyle = bgColor; ctx.fillRect(0,0,canvasSize.w,canvasSize.h); saveHistory(); };
  const exportPNG = () => { const c = canvasRef.current; if (!c) return; const a = document.createElement('a'); a.download='drawing.png'; a.href=c.toDataURL('image/png'); a.click(); };

  const menus: Record<string, {label:string;onClick?:()=>void;disabled?:boolean;divider?:boolean}[][]> = {
    '文件': [[{label:'新建',onClick:clearCanvas},{label:'打开',disabled:true},{label:'保存',onClick:exportPNG},{label:'另存为',onClick:exportPNG,divider:true},{label:'退出',disabled:true}]],
    '编辑': [[{label:'撤销',onClick:undo},{label:'重做',onClick:redo,divider:true},{label:'剪切',disabled:true},{label:'复制',disabled:true},{label:'粘贴',disabled:true,divider:true},{label:'全选',disabled:true}]],
    '查看': [[{label:'工具箱',disabled:true},{label:'颜料盒',disabled:true}]],
    '图像': [[{label:'清除图像',onClick:clearCanvas},{label:'翻转/旋转',disabled:true}]],
    '颜色': [[{label:'编辑颜色',disabled:true}]],
    '帮助': [[{label:'关于画图',disabled:true}]],
  };

  return (
    <div className="flex flex-col h-full bg-[var(--os-windowBg)]" style={{fontFamily:'system-ui,sans-serif',fontSize:'12px'}} onClick={(e) => e.stopPropagation()}>
      <div className="flex px-1 py-0.5 text-xs">
        {Object.keys(menus).map(menu => (
          <div key={menu} className="relative">
            <button className={`px-2 py-0.5 ${activeMenu === menu ? 'bg-[var(--os-menuHighlight)] text-[var(--os-selectedText)]' : ''}`} onClick={(e)=>{e.stopPropagation();setActiveMenu(activeMenu===menu?null:menu);}}>
              <u>{menu[0]}</u>{menu.slice(1)}
            </button>
            {activeMenu===menu && (
              <div className="absolute left-0 top-full z-10 os-raised bg-[var(--os-menuBg)]" style={{minWidth:'120px'}}>
                {menus[menu].map((g,gi)=>(
                  <div key={gi}>
                    {g.map((item,ii)=>(
                      <div key={ii}>
                        <button className="w-full text-left px-4 py-1 os-menu-item disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-inherit" onClick={(e)=>{e.stopPropagation();item.onClick?.();setActiveMenu(null);}} disabled={item.disabled}>
                          {item.label}
                        </button>
                        {item.divider && <div className="os-menu-divider"/>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-1 overflow-hidden" onClick={()=>setActiveMenu(null)}>
        <div className="p-1 flex flex-col gap-1 os-raised m-1">
          {TOOLS.map(t=>(
            <button key={t.id} className={`w-8 h-8 text-base flex items-center justify-center ${tool===t.id ? 'os-button-active' : 'os-button'}`} style={{padding:0}} onClick={()=>setTool(t.id)}>
              {t.icon}
            </button>
          ))}
          <div className="mt-2 flex flex-col gap-1 items-center">
            {BRUSH_SIZES.map(s=>(
              <button key={s} className={`w-7 h-5 flex items-center justify-center ${brushSize===s ? 'os-button-active' : 'os-button'}`} style={{padding:0}} onClick={()=>setBrushSize(s)}>
                <div style={{width:s*2,height:s*2,background:'#000',borderRadius:'50%'}}/>
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-2 overflow-auto">
          <div className="os-inset-2">
            <canvas ref={canvasRef} width={canvasSize.w} height={canvasSize.h} className="block" style={{cursor:tool==='fill'?'cell':'crosshair',imageRendering:'pixelated'}} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}/>
          </div>
        </div>
      </div>
      <div className="p-1 flex items-center gap-2 border-t border-[var(--os-buttonShadow)] bg-[var(--os-windowBg)]">
        <div className="flex items-center gap-1 p-1 os-inset">
          <div className="relative w-8 h-8">
            <div className="absolute top-0 left-0 w-6 h-6 border border-black" style={{background:bgColor}}/>
            <div className="absolute bottom-0 right-0 w-6 h-6 border border-black" style={{background:fgColor}}/>
          </div>
        </div>
        <div className="flex flex-wrap gap-0.5">
          {PALETTE.map((c,i)=>(
            <button key={i} className={`w-5 h-5 border border-black ${fgColor===c ? 'os-button-active' : 'os-button'}`} style={{padding:0,background:c}} onClick={()=>setFgColor(c)} onContextMenu={(e)=>{e.preventDefault();setBgColor(c);}}/>
          ))}
        </div>
        <div className="flex gap-1">
          <div className="relative"><input type="color" value={fgColor} onChange={(e)=>setFgColor(e.target.value)} className="w-5 h-5 opacity-0 absolute inset-0 cursor-pointer"/><div className="w-5 h-5 border border-black os-button" style={{padding:0,background:fgColor}}/></div>
          <div className="relative"><input type="color" value={bgColor} onChange={(e)=>setBgColor(e.target.value)} className="w-5 h-5 opacity-0 absolute inset-0 cursor-pointer"/><div className="w-5 h-5 border border-black os-button" style={{padding:0,background:bgColor}}/></div>
        </div>
      </div>
      <div className="flex gap-1 px-1 py-0.5 text-xs border-t border-[var(--os-buttonShadow)] bg-[var(--os-windowBg)]">
        <div className="px-2 py-0.5 os-inset">{mousePos?`${mousePos.x}, ${mousePos.y}`:'0, 0'}</div>
        <div className="px-2 py-0.5 os-inset">{canvasSize.w} × {canvasSize.h}</div>
      </div>
    </div>
  );
}
