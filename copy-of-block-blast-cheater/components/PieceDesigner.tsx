
import React, { useState } from 'react';
import { GamePiece, PieceLayout } from '../types';
import { PIECE_MAX_SIZE, COLORS } from '../constants';
import { Block } from './Block';

interface PieceDesignerProps {
  piece: GamePiece;
  onSave: (updatedPiece: GamePiece) => void;
  onCancel: () => void;
}

export const PieceDesigner: React.FC<PieceDesignerProps> = ({ piece, onSave, onCancel }) => {
  const [layout, setLayout] = useState<PieceLayout>(() => {
    const base = Array(PIECE_MAX_SIZE).fill(0).map(() => Array(PIECE_MAX_SIZE).fill(0));
    piece.layout.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (r < PIECE_MAX_SIZE && c < PIECE_MAX_SIZE) base[r][c] = cell;
      });
    });
    return base;
  });
  const [color, setColor] = useState(piece.color);

  const toggleCell = (r: number, c: number) => {
    const newLayout = layout.map((rowArr, rowIndex) => 
      rowArr.map((cell, colIndex) => (rowIndex === r && colIndex === c ? (cell === 1 ? 0 : 1) : cell))
    );
    setLayout(newLayout);
  };

  const handleSave = () => {
    // Trim empty edges
    let minR = PIECE_MAX_SIZE, maxR = 0, minC = PIECE_MAX_SIZE, maxC = 0;
    let hasCells = false;
    
    layout.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell === 1) {
          hasCells = true;
          minR = Math.min(minR, r);
          maxR = Math.max(maxR, r);
          minC = Math.min(minC, c);
          maxC = Math.max(maxC, c);
        }
      });
    });

    if (!hasCells) return alert("Piece must have at least one block!");

    const trimmed: PieceLayout = [];
    for (let r = minR; r <= maxR; r++) {
      const row: number[] = [];
      for (let c = minC; c <= maxC; c++) {
        row.push(layout[r][c]);
      }
      trimmed.push(row);
    }

    onSave({ ...piece, layout: trimmed, color });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl max-w-md w-full shadow-2xl">
        <h3 className="text-2xl font-bold mb-6 text-center">Design Piece</h3>
        
        <div className="flex flex-col items-center gap-6">
          <div className="grid grid-cols-5 gap-1 bg-slate-800 p-3 rounded-xl border border-slate-700">
            {layout.map((row, r) => (
              row.map((cell, c) => (
                <button
                  key={`${r}-${c}`}
                  onClick={() => toggleCell(r, c)}
                  className="focus:outline-none"
                >
                  <Block color={cell === 1 ? color : null} size={48} />
                </button>
              ))
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-10 h-10 rounded-full border-4 transition-transform hover:scale-110 ${color === c ? 'border-white' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="flex w-full gap-4 mt-4">
            <button 
              onClick={onCancel}
              className="flex-1 py-3 px-6 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-colors shadow-lg shadow-blue-500/20"
            >
              Save Piece
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
