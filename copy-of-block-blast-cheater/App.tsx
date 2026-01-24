
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  AppMode, 
  GridState, 
  GamePiece, 
  GameState,
  SolutionStep
} from './types';
import { 
  createEmptyGrid, 
  canPlacePiece, 
  placePiece, 
  checkAndClearLines, 
  findSolution
} from './utils/gameLogic';
import { GRID_SIZE, INITIAL_PIECES, COLORS } from './constants';
import { Block } from './components/Block';
import { PieceDesigner } from './components/PieceDesigner';
import { 
  RotateCcw, 
  Settings2, 
  LayoutGrid, 
  Shapes,
  Save,
  Trash2,
  Trophy,
  Lightbulb,
  XCircle,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

const MOBILE_DRAG_OFFSET_Y = 80;

const App: React.FC = () => {
  const [state, setState] = useState<GameState>({
    grid: createEmptyGrid(),
    tray: INITIAL_PIECES,
    mode: AppMode.PLAY,
    savedScenario: null
  });

  const [activePieceIndex, setActivePieceIndex] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [hoverCell, setHoverCell] = useState<{ r: number, c: number } | null>(null);
  const [editingPieceIndex, setEditingPieceIndex] = useState<number | null>(null);
  const [clearingCells, setClearingCells] = useState<Set<string>>(new Set());
  const [comboCount, setComboCount] = useState(0);
  
  // Solver State
  const [solution, setSolution] = useState<SolutionStep[] | null>(null);
  const [solutionStep, setSolutionStep] = useState(0);
  const [isSolving, setIsSolving] = useState(false);
  const [noSolutionFound, setNoSolutionFound] = useState(false);

  const boardRef = useRef<HTMLDivElement>(null);

  const handleCellClick = (r: number, c: number) => {
    if (state.mode !== AppMode.EDIT_BOARD) return;
    const newGrid = state.grid.map((rowArr, rowIndex) => 
      rowArr.map((cell, colIndex) => {
        if (rowIndex === r && colIndex === c) {
          return cell === null ? COLORS[1] : null;
        }
        return cell;
      })
    );
    setState(prev => ({ ...prev, grid: newGrid }));
    setSolution(null);
  };

  const onDragStart = (e: React.MouseEvent | React.TouchEvent, index: number) => {
    if (state.mode !== AppMode.PLAY) return;
    setSolution(null);
    
    const isTouch = 'touches' in e;
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setActivePieceIndex(index);
    
    const offsetY = isTouch ? MOBILE_DRAG_OFFSET_Y : (clientY - rect.top);
    const offsetX = isTouch ? (rect.width / 2) : (clientX - rect.left);

    setDragOffset({ x: offsetX, y: offsetY });
    setDragPos({ x: clientX, y: clientY });
  };

  const onDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (activePieceIndex === null) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragPos({ x: clientX, y: clientY });

    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      const blockSize = rect.width / GRID_SIZE;
      
      const targetX = clientX - rect.left - dragOffset.x;
      const targetY = clientY - rect.top - dragOffset.y;

      const r = Math.round(targetY / blockSize);
      const c = Math.round(targetX / blockSize);

      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
        setHoverCell({ r, c });
      } else {
        setHoverCell(null);
      }
    }
  }, [activePieceIndex, dragOffset]);

  const onDragEnd = useCallback(() => {
    if (activePieceIndex === null) return;

    if (hoverCell) {
      const piece = state.tray[activePieceIndex];
      if (canPlacePiece(state.grid, piece.layout, hoverCell.r, hoverCell.c)) {
        let newGrid = placePiece(state.grid, piece, hoverCell.r, hoverCell.c);
        
        const rowsToClear = [];
        const colsToClear = [];
        for (let i = 0; i < GRID_SIZE; i++) {
          if (newGrid[i].every(cell => cell !== null)) rowsToClear.push(i);
          let colFull = true;
          for (let j = 0; j < GRID_SIZE; j++) if (newGrid[j][i] === null) { colFull = false; break; }
          if (colFull) colsToClear.push(i);
        }

        if (rowsToClear.length > 0 || colsToClear.length > 0) {
          const cellsToAnimate = new Set<string>();
          rowsToClear.forEach(r => { for (let c = 0; c < GRID_SIZE; c++) cellsToAnimate.add(`${r}-${c}`); });
          colsToClear.forEach(c => { for (let r = 0; r < GRID_SIZE; r++) cellsToAnimate.add(`${r}-${c}`); });
          
          setClearingCells(cellsToAnimate);
          setComboCount(prev => prev + 1);

          setTimeout(() => {
            const { newGrid: clearedGrid } = checkAndClearLines(newGrid);
            setClearingCells(new Set());
            setState(prev => {
              const remainingTray = prev.tray.filter((_, i) => i !== activePieceIndex);
              return {
                ...prev,
                grid: clearedGrid,
                tray: remainingTray.length === 0 ? INITIAL_PIECES : remainingTray
              };
            });
          }, 350);
        } else {
          setComboCount(0);
          setState(prev => {
            const remainingTray = prev.tray.filter((_, i) => i !== activePieceIndex);
            return {
              ...prev,
              grid: newGrid,
              tray: remainingTray.length === 0 ? INITIAL_PIECES : remainingTray
            };
          });
        }
      }
    }

    setActivePieceIndex(null);
    setHoverCell(null);
  }, [activePieceIndex, hoverCell, state]);

  useEffect(() => {
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
    window.addEventListener('touchmove', onDragMove, { passive: false });
    window.addEventListener('touchend', onDragEnd);
    return () => {
      window.removeEventListener('mousemove', onDragMove);
      window.removeEventListener('mouseup', onDragEnd);
      window.removeEventListener('touchmove', onDragMove);
      window.removeEventListener('touchend', onDragEnd);
    };
  }, [onDragMove, onDragEnd]);

  const handleSolve = () => {
    setIsSolving(true);
    setNoSolutionFound(false);
    setSolution(null);
    
    // Use a small delay to let the UI show "Solving..."
    setTimeout(() => {
      const result = findSolution(state.grid, state.tray);
      if (result) {
        setSolution(result);
        setSolutionStep(0);
      } else {
        setNoSolutionFound(true);
        setTimeout(() => setNoSolutionFound(false), 2000);
      }
      setIsSolving(false);
    }, 100);
  };

  const resetScenario = () => {
    setSolution(null);
    if (state.savedScenario) {
      setState(prev => ({ ...prev, grid: prev.savedScenario!.grid, tray: prev.savedScenario!.tray }));
    } else {
      setState(prev => ({ ...prev, grid: createEmptyGrid(), tray: INITIAL_PIECES }));
    }
  };

  return (
    <div className="h-full flex flex-col items-center pt-6 pb-2 px-4 max-w-lg mx-auto overflow-hidden">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-4 px-2">
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 leading-none">
            BLOCK BLAST
          </h1>
          <span className="text-[10px] tracking-widest text-slate-500 font-bold">SIMULATOR</span>
        </div>
        
        <div className="flex gap-1.5">
          <button 
            onClick={() => {
              setSolution(null);
              setState(prev => ({ ...prev, mode: prev.mode === AppMode.EDIT_BOARD ? AppMode.PLAY : AppMode.EDIT_BOARD }));
            }}
            className={`p-2.5 rounded-xl transition-all ${state.mode === AppMode.EDIT_BOARD ? 'bg-blue-600 shadow-lg shadow-blue-600/30' : 'bg-slate-800 text-slate-400'}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            onClick={() => {
              setSolution(null);
              setState(prev => ({ ...prev, mode: prev.mode === AppMode.EDIT_PIECES ? AppMode.PLAY : AppMode.EDIT_PIECES }));
            }}
            className={`p-2.5 rounded-xl transition-all ${state.mode === AppMode.EDIT_PIECES ? 'bg-purple-600 shadow-lg shadow-purple-600/30' : 'bg-slate-800 text-slate-400'}`}
          >
            <Shapes size={18} />
          </button>
          <button onClick={handleSolve} disabled={isSolving || state.mode !== AppMode.PLAY} className={`p-2.5 rounded-xl transition-all ${isSolving ? 'bg-amber-600 animate-pulse' : 'bg-slate-800 text-amber-400 hover:text-amber-300'}`}>
            <Lightbulb size={18} />
          </button>
          <button onClick={resetScenario} className="p-2.5 bg-slate-800 text-slate-400 rounded-xl hover:text-white transition-colors">
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-h-[60vh] relative">
        {comboCount > 1 && !solution && (
          <div className="absolute top-4 flex items-center gap-1.5 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-bounce z-20">
            <Trophy size={14} /> COMBO X{comboCount}
          </div>
        )}

        {noSolutionFound && (
          <div className="absolute top-4 flex items-center gap-1.5 bg-red-500 text-white px-4 py-2 rounded-full text-xs font-bold animate-in fade-in slide-in-from-top-4 z-20">
            <XCircle size={14} /> NO SOLUTION POSSIBLE
          </div>
        )}

        {solution && (
          <div className="absolute top-4 flex flex-col items-center gap-2 z-20">
            <div className="bg-green-600 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg shadow-green-600/30">
              <Lightbulb size={14} /> SOLUTION FOUND! STEP {solutionStep + 1}/{solution.length}
            </div>
            <div className="flex gap-2">
               <button 
                 onClick={() => setSolutionStep(Math.max(0, solutionStep - 1))}
                 className="p-1.5 bg-slate-800 rounded-lg text-white disabled:opacity-30"
                 disabled={solutionStep === 0}
               >
                 <ChevronLeft size={16} />
               </button>
               <button 
                 onClick={() => setSolutionStep(Math.min(solution.length - 1, solutionStep + 1))}
                 className="p-1.5 bg-slate-800 rounded-lg text-white disabled:opacity-30"
                 disabled={solutionStep === solution.length - 1}
               >
                 <ChevronRight size={16} />
               </button>
               <button 
                 onClick={() => setSolution(null)}
                 className="p-1.5 bg-red-600 rounded-lg text-white"
               >
                 <XCircle size={16} />
               </button>
            </div>
          </div>
        )}

        <div className="relative p-2 bg-slate-900 rounded-3xl border-[6px] border-slate-800 shadow-2xl mt-4">
          <div 
            ref={boardRef}
            className="grid grid-cols-8 gap-1"
            style={{ width: 'min(88vw, 380px)', height: 'min(88vw, 380px)' }}
          >
            {state.grid.map((row, r) => (
              row.map((cell, c) => (
                <div 
                  key={`${r}-${c}`} 
                  onClick={() => handleCellClick(r, c)}
                  className="relative touch-none"
                >
                  <Block 
                    color={cell} 
                    size={undefined} 
                    isClearing={clearingCells.has(`${r}-${c}`)} 
                  />
                </div>
              ))
            ))}
          </div>

          {/* Solution Highlight */}
          {solution && (
             <div 
               className="absolute pointer-events-none z-10 animate-pulse"
               style={{
                 top: `calc(8px + ${solution[solutionStep].r} * (100% - 16px) / ${GRID_SIZE})`,
                 left: `calc(8px + ${solution[solutionStep].c} * (100% - 16px) / ${GRID_SIZE})`,
               }}
             >
               <PieceView 
                 piece={state.tray.find(p => p.id === solution[solutionStep].pieceId)!} 
                 size={(boardRef.current!.clientWidth - 16) / GRID_SIZE - 4} 
                 isPreview
                 isValid={true}
               />
             </div>
          )}

          {/* Ghost Placement */}
          {activePieceIndex !== null && hoverCell && (
             <div 
               className="absolute pointer-events-none opacity-40 z-10"
               style={{
                 top: `calc(8px + ${hoverCell.r} * (100% - 16px) / ${GRID_SIZE})`,
                 left: `calc(8px + ${hoverCell.c} * (100% - 16px) / ${GRID_SIZE})`,
               }}
             >
               <PieceView 
                 piece={state.tray[activePieceIndex]} 
                 size={(boardRef.current!.clientWidth - 16) / GRID_SIZE - 4} 
                 isPreview
                 isValid={canPlacePiece(state.grid, state.tray[activePieceIndex].layout, hoverCell.r, hoverCell.c)}
               />
             </div>
          )}
        </div>
        
        {state.mode === AppMode.EDIT_BOARD && (
          <button 
            onClick={() => setState(prev => ({...prev, grid: createEmptyGrid()}))}
            className="mt-4 flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-widest bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20"
          >
            <Trash2 size={14} /> Clear Board
          </button>
        )}
      </div>

      {/* Tray */}
      <div className="w-full bg-slate-900/50 backdrop-blur-lg rounded-t-[40px] border-t border-slate-800 p-6 pt-8 flex items-end justify-center gap-4">
        {state.tray.map((piece, i) => {
          const isTargetedBySolution = solution && solution[solutionStep].pieceId === piece.id;
          
          return (
            <div 
              key={piece.id}
              className={`relative flex items-center justify-center p-2 rounded-2xl min-h-[90px] min-w-[90px] transition-all tray-piece-transition 
                ${activePieceIndex === i ? 'scale-75 opacity-30' : 'bg-slate-800/40 hover:bg-slate-800'}
                ${isTargetedBySolution ? 'ring-4 ring-green-500 shadow-lg shadow-green-500/20 bg-slate-700/60' : ''}
              `}
              onMouseDown={(e) => onDragStart(e, i)}
              onTouchStart={(e) => onDragStart(e, i)}
              onClick={() => state.mode === AppMode.EDIT_PIECES && setEditingPieceIndex(i)}
            >
              <PieceView piece={piece} size={22} />
              {state.mode === AppMode.EDIT_PIECES && (
                <div className="absolute inset-0 bg-purple-600/20 rounded-2xl border-2 border-purple-500 flex items-center justify-center">
                  <Settings2 className="text-white" size={24} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active Draggable */}
      {activePieceIndex !== null && (
        <div 
          className="fixed pointer-events-none z-50 active-drag scale-125"
          style={{
            left: dragPos.x - dragOffset.x,
            top: dragPos.y - dragOffset.y,
          }}
        >
          <PieceView piece={state.tray[activePieceIndex]} size={36} />
        </div>
      )}

      {/* Modals */}
      {editingPieceIndex !== null && (
        <PieceDesigner 
          piece={state.tray[editingPieceIndex]}
          onSave={(updated) => {
            const newTray = [...state.tray];
            newTray[editingPieceIndex!] = updated;
            setState(prev => ({ ...prev, tray: newTray }));
            setEditingPieceIndex(null);
            setSolution(null);
          }}
          onCancel={() => setEditingPieceIndex(null)}
        />
      )}

      {/* Finish Edit Banner */}
      {state.mode !== AppMode.PLAY && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-50 flex justify-center">
          <button 
            onClick={() => {
              setSolution(null);
              setState(prev => ({ ...prev, savedScenario: {grid: prev.grid, tray: prev.tray}, mode: AppMode.PLAY }));
            }}
            className="bg-blue-600 text-white font-black px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce shadow-blue-600/50"
          >
            <Save size={20} /> SAVE SCENARIO
          </button>
        </div>
      )}
    </div>
  );
};

const PieceView: React.FC<{ piece: GamePiece, size?: number, isPreview?: boolean, isValid?: boolean }> = ({ piece, size = 30, isPreview = false, isValid = true }) => (
  <div className="flex flex-col gap-1">
    {piece.layout.map((row, r) => (
      <div key={r} className="flex gap-1">
        {row.map((cell, c) => (
          <div key={c} style={{ width: size, height: size }}>
            {cell === 1 ? (
              <Block color={piece.color} size={size} isPreview={isPreview} isValid={isValid} />
            ) : (
              isPreview ? <div style={{width: size, height: size}} /> : null
            )}
          </div>
        ))}
      </div>
    ))}
  </div>
);

export default App;
