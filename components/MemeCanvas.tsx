
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Position, Alignment, MemeFilter } from '../types';

interface MemeCanvasProps {
  imageUrl: string;
  topText: string;
  bottomText: string;
  topTextPos: Position;
  bottomTextPos: Position;
  topFontSize: number;
  bottomFontSize: number;
  topFont: string;
  bottomFont: string;
  topAlign: Alignment;
  bottomAlign: Alignment;
  topTextColor: string;
  bottomTextColor: string;
  topOutlineColor: string;
  topOutlineWidth: number;
  bottomOutlineColor: string;
  bottomOutlineWidth: number;
  topZIndex: number;
  bottomZIndex: number;
  imageZIndex: number;
  topBgColor: string;
  topBgOpacity: number;
  bottomBgColor: string;
  bottomBgOpacity: number;
  zoom: number;
  pan: Position;
  filter: MemeFilter;
  canvasShadow: boolean;
  showGrid: boolean;
  onUpdatePosition: (type: 'top' | 'bottom', pos: Position) => void;
  onUpdatePan: (pos: Position) => void;
  onUpdateZoom: (zoom: number) => void;
  onUpdateFontSize: (type: 'top' | 'bottom', size: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const MemeCanvas: React.FC<MemeCanvasProps> = ({ 
  imageUrl, 
  topText, 
  bottomText, 
  topTextPos, 
  bottomTextPos,
  topFontSize,
  bottomFontSize,
  topFont,
  bottomFont,
  topAlign,
  bottomAlign,
  topTextColor,
  bottomTextColor,
  topOutlineColor,
  topOutlineWidth,
  bottomOutlineColor,
  bottomOutlineWidth,
  topZIndex,
  bottomZIndex,
  imageZIndex,
  topBgColor,
  topBgOpacity,
  bottomBgColor,
  bottomBgOpacity,
  zoom,
  pan,
  filter,
  canvasShadow,
  showGrid,
  onUpdatePosition,
  onUpdatePan,
  onUpdateZoom,
  onUpdateFontSize,
  onDragStart,
  onDragEnd
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const topTextRef = useRef<HTMLDivElement>(null);
  const bottomTextRef = useRef<HTMLDivElement>(null);
  
  const [activeDrag, setActiveDrag] = useState<'top' | 'bottom' | 'canvas' | 'resize-top' | 'resize-bottom' | null>(null);
  const [dragStart, setDragStart] = useState<Position | null>(null);
  const [initialFontSize, setInitialFontSize] = useState<number>(0);

  const handleMouseDown = (type: 'top' | 'bottom' | 'canvas' | 'resize-top' | 'resize-bottom') => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDrag(type);
    setDragStart({ x: e.clientX, y: e.clientY });
    
    if (type === 'resize-top') setInitialFontSize(topFontSize);
    if (type === 'resize-bottom') setInitialFontSize(bottomFontSize);
    
    if (onDragStart) onDragStart();
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 0.001;
    const newZoom = zoom - e.deltaY * zoomSpeed;
    onUpdateZoom(newZoom);
  }, [zoom, onUpdateZoom]);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (el) el.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!activeDrag || !containerRef.current || !dragStart) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      if (activeDrag === 'canvas') {
        onUpdatePan({
          x: pan.x + deltaX,
          y: pan.y + deltaY
        });
        setDragStart({ x: e.clientX, y: e.clientY });
      } else if (activeDrag.startsWith('resize-')) {
        const type = activeDrag === 'resize-top' ? 'top' : 'bottom';
        // Use average of movement to scale font smoothly
        const scaleFactor = 1 + (deltaX + deltaY) / 200;
        const newSize = Math.max(8, Math.min(250, initialFontSize * scaleFactor));
        onUpdateFontSize(type, newSize);
      } else {
        const rect = containerRef.current.getBoundingClientRect();
        const currentPos = activeDrag === 'top' ? topTextPos : bottomTextPos;
        
        // Adjust movement relative to zoom to maintain precision
        const moveXPercent = (deltaX / rect.width) * 100 / zoom;
        const moveYPercent = (deltaY / rect.height) * 100 / zoom;

        const newX = Math.max(0, Math.min(100, currentPos.x + moveXPercent));
        const newY = Math.max(0, Math.min(100, currentPos.y + moveYPercent));

        onUpdatePosition(activeDrag as 'top' | 'bottom', { x: newX, y: newY });
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      if (activeDrag && onDragEnd) onDragEnd();
      setActiveDrag(null);
      setDragStart(null);
    };

    if (activeDrag) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeDrag, dragStart, onUpdatePosition, onUpdatePan, onUpdateFontSize, onDragEnd, pan, topTextPos, bottomTextPos, zoom, initialFontSize]);

  const getFilterCSS = (f: MemeFilter) => {
    switch (f) {
      case 'grayscale': return 'grayscale(100%)';
      case 'sepia': return 'sepia(100%)';
      case 'invert': return 'invert(100%)';
      case 'blur': return 'blur(5px)';
      case 'saturate': return 'saturate(200%)';
      default: return 'none';
    }
  };

  const getOutlineStyle = (color: string, width: number) => {
    if (width <= 0) return {};
    const shadows = [];
    const step = width <= 2 ? 0.5 : 1;
    for (let x = -width; x <= width; x += step) {
      for (let y = -width; y <= width; y += step) {
        if (Math.abs(x) < 0.1 && Math.abs(y) < 0.1) continue;
        if (width > 2 && (x*x + y*y) < (width-1)*(width-1)) continue;
        shadows.push(`${x}px ${y}px 0 ${color}`);
      }
    }
    shadows.push(`0 0 4px rgba(0,0,0,0.6)`);
    return { textShadow: shadows.join(', ') };
  };

  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const getCanvasShadowClass = () => {
    if (!canvasShadow) return '';
    if (activeDrag !== null) return 'shadow-xl transition-shadow duration-300';
    return 'shadow-[0_20px_70px_-15px_rgba(0,0,0,0.8)] transition-shadow duration-500';
  };

  const handleResetView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateZoom(1);
    onUpdatePan({ x: 0, y: 0 });
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full aspect-video md:aspect-square max-h-[600px] overflow-hidden rounded-2xl border-4 border-slate-800 bg-slate-900 group select-none transition-colors duration-300 ${getCanvasShadowClass()}`}
      onMouseDown={handleMouseDown('canvas')}
      style={{ 
        cursor: activeDrag === 'canvas' ? 'grabbing' : 'grab',
      }}
    >
      <div 
        className="w-full h-full relative"
        style={{ 
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transformOrigin: 'center center',
          transition: activeDrag ? 'none' : 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <img 
          src={imageUrl} 
          alt="Meme base" 
          className="w-full h-full object-cover pointer-events-none transition-all duration-300 relative"
          style={{ 
            filter: getFilterCSS(filter),
            zIndex: imageZIndex 
          }}
        />

        {/* Grid Overlay */}
        {showGrid && (
          <div 
            className="absolute inset-0 pointer-events-none z-40"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(99, 102, 241, 0.15) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(99, 102, 241, 0.15) 1px, transparent 1px)
              `,
              backgroundSize: '10% 10%'
            }}
          />
        )}
        
        {/* Top Text Block */}
        <div 
          ref={topTextRef}
          onMouseDown={handleMouseDown('top')}
          style={{ 
            top: `${topTextPos.y}%`, 
            left: `${topTextPos.x}%`,
            fontSize: `${topFontSize}px`,
            fontFamily: topFont,
            textAlign: topAlign,
            color: topTextColor,
            transform: `translate(-50%, -50%)`,
            cursor: 'move',
            zIndex: topZIndex,
            backgroundColor: hexToRgba(topBgColor, topBgOpacity),
            backdropFilter: topBgOpacity > 0 ? 'blur(8px)' : 'none',
            ...getOutlineStyle(topOutlineColor, topOutlineWidth)
          }}
          className={`absolute select-none max-w-[90%] min-w-[150px] px-4 py-2 rounded-xl border-2 transition-all duration-200 group/text-top ${
            activeDrag === 'top' 
              ? 'border-indigo-500 shadow-lg scale-105 bg-indigo-500/10' 
              : 'border-transparent hover:border-white/30 hover:bg-white/5'
          }`}
        >
          <h2 className="leading-tight break-words uppercase pointer-events-none">
            {topText}
          </h2>
          {/* Resize Handle */}
          <div 
            onMouseDown={handleMouseDown('resize-top')}
            className={`absolute -bottom-2 -right-2 w-6 h-6 bg-indigo-600 rounded-full border-2 border-white flex items-center justify-center cursor-nwse-resize shadow-xl transition-opacity ${activeDrag === 'top' || activeDrag === 'resize-top' ? 'opacity-100 scale-110' : 'opacity-0 group-hover/text-top:opacity-100'}`}
          >
             <i className="fas fa-up-right-and-down-left-from-center text-[10px] text-white"></i>
          </div>
        </div>

        {/* Bottom Text Block */}
        <div 
          ref={bottomTextRef}
          onMouseDown={handleMouseDown('bottom')}
          style={{ 
            top: `${bottomTextPos.y}%`, 
            left: `${bottomTextPos.x}%`,
            fontSize: `${bottomFontSize}px`,
            fontFamily: bottomFont,
            textAlign: bottomAlign,
            color: bottomTextColor,
            transform: `translate(-50%, -50%)`,
            cursor: 'move',
            zIndex: bottomZIndex,
            backgroundColor: hexToRgba(bottomBgColor, bottomBgOpacity),
            backdropFilter: bottomBgOpacity > 0 ? 'blur(8px)' : 'none',
            ...getOutlineStyle(bottomOutlineColor, bottomOutlineWidth)
          }}
          className={`absolute select-none max-w-[90%] min-w-[150px] px-4 py-2 rounded-xl border-2 transition-all duration-200 group/text-bottom ${
            activeDrag === 'bottom' 
              ? 'border-indigo-500 shadow-lg scale-105 bg-indigo-500/10' 
              : 'border-transparent hover:border-white/30 hover:bg-white/5'
          }`}
        >
          <h2 className="leading-tight break-words uppercase pointer-events-none">
            {bottomText}
          </h2>
          {/* Resize Handle */}
          <div 
            onMouseDown={handleMouseDown('resize-bottom')}
            className={`absolute -bottom-2 -right-2 w-6 h-6 bg-indigo-600 rounded-full border-2 border-white flex items-center justify-center cursor-nwse-resize shadow-xl transition-opacity ${activeDrag === 'bottom' || activeDrag === 'resize-bottom' ? 'opacity-100 scale-110' : 'opacity-0 group-hover/text-bottom:opacity-100'}`}
          >
             <i className="fas fa-up-right-and-down-left-from-center text-[10px] text-white"></i>
          </div>
        </div>
      </div>
      
      {/* Visual Status Toolbar Overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 items-end pointer-events-none">
         <div className="flex gap-2">
            <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/50 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
               <div className="flex items-center gap-2">
                 <i className="fas fa-magnifying-glass text-[10px] text-indigo-400"></i>
                 <span className="text-[10px] font-black text-white">{Math.round(zoom * 100)}%</span>
               </div>
               <div className="w-[1px] h-3 bg-slate-700"></div>
               <div className="flex items-center gap-2">
                 <i className="fas fa-up-down-left-right text-[10px] text-indigo-400"></i>
                 <span className="text-[10px] font-black text-white">{Math.round(pan.x)} , {Math.round(pan.y)}</span>
               </div>
            </div>
         </div>
      </div>

      {/* Floating Action Menu */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button 
          onClick={handleResetView}
          className="bg-indigo-600 hover:bg-indigo-500 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all group pointer-events-auto border border-indigo-400/30"
          title="Reset View (Zoom & Pan)"
        >
          <i className="fas fa-compress-arrows-alt group-hover:rotate-12 transition-transform"></i>
        </button>
      </div>

      {/* Drag Indicator Overlays */}
      {activeDrag === 'canvas' && (
        <div className="absolute inset-0 pointer-events-none border-4 border-indigo-500/50 animate-pulse rounded-2xl z-50"></div>
      )}
      
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] font-bold text-slate-500 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <i className="fas fa-mouse text-[8px]"></i>
          <span>Scroll to Zoom • Drag Text corner to resize</span>
        </div>
      </div>
    </div>
  );
};

export default MemeCanvas;
