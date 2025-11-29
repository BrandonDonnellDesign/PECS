
import React, { useState } from 'react';
import { PecsBoard, PecsCard } from '../types';
import CardEditor from './CardEditor';
import { Plus, Trash2, Edit2, GripVertical, Settings2, Palette } from 'lucide-react';
import { storageService } from '../services/supabase';

interface BoardProps {
  board: PecsBoard;
  userId?: string;
  onUpdate: (board: PecsBoard) => void;
  readOnly?: boolean;
}

const Board: React.FC<BoardProps> = ({ board, userId, onUpdate, readOnly = false }) => {
  const [editingCard, setEditingCard] = useState<PecsCard | null>(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [draggedCardIndex, setDraggedCardIndex] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleSaveCard = (newCard: PecsCard) => {
    let newCards = [...board.cards];
    if (editingCard) {
      newCards = newCards.map(c => c.id === newCard.id ? newCard : c);
    } else {
      newCards.push(newCard);
    }

    const updatedBoard = { ...board, cards: newCards, updatedAt: Date.now() };
    onUpdate(updatedBoard);
    storageService.saveBoard(updatedBoard, userId);

    setEditingCard(null);
    setIsCreatorOpen(false);
  };

  const handleDeleteCard = (id: string) => {
    if (confirm("Remove this card?")) {
      const updatedBoard = {
        ...board,
        cards: board.cards.filter(c => c.id !== id),
        updatedAt: Date.now()
      };
      onUpdate(updatedBoard);
      storageService.saveBoard(updatedBoard, userId);
    }
  };

  // Simple Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedCardIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedCardIndex === null) return;

    const newCards = [...board.cards];
    const [draggedItem] = newCards.splice(draggedCardIndex, 1);
    newCards.splice(dropIndex, 0, draggedItem);

    const updatedBoard = { ...board, cards: newCards, updatedAt: Date.now() };
    onUpdate(updatedBoard);
    storageService.saveBoard(updatedBoard, userId);
    setDraggedCardIndex(null);
  };

  const updateBoardSettings = (settings: Partial<PecsBoard>) => {
    const updated = { ...board, ...settings, updatedAt: Date.now() };
    onUpdate(updated);
    storageService.saveBoard(updated, userId);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {!readOnly && (
        <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border dark:border-gray-700 space-y-4 transition-colors duration-300">
          <div className="flex justify-between items-center">
            <div>
              <input
                className="text-2xl font-bold text-gray-800 dark:text-white border-b-2 border-transparent focus:border-blue-500 outline-none bg-transparent"
                value={board.title}
                onChange={(e) => updateBoardSettings({ title: e.target.value })}
              />
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{board.cards.length} Cards</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                <Settings2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsCreatorOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
              >
                <Plus className="w-5 h-5" />
                Add Card
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="pt-4 border-t dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  Grid Columns
                </label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6, 8].map(cols => (
                    <button
                      key={cols}
                      onClick={() => updateBoardSettings({ gridColumns: cols })}
                      className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium transition-colors ${board.gridColumns === cols ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                    >
                      {cols}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  Grid Spacing
                </label>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={board.gridGap ?? 16}
                  onChange={(e) => updateBoardSettings({ gridGap: Number(e.target.value) })}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 text-right">{board.gridGap ?? 16}px</div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Palette className="w-4 h-4" /> Board Background
                </label>
                <div className="flex gap-2 flex-wrap">
                  {['#f3f4f6', '#ffffff', '#fff1f2', '#f0f9ff', '#f0fdf4', '#faf5ff', '#1f2937'].map(color => (
                    <button
                      key={color}
                      onClick={() => updateBoardSettings({ backgroundColor: color })}
                      className={`w-8 h-8 rounded-full border shadow-sm ${board.backgroundColor === color ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid Display */}
      <div
        className="board-grid w-full transition-all duration-300 rounded-lg"
        style={{
          '--board-cols': board.gridColumns,
          gap: `${board.gridGap ?? 16}px`,
          backgroundColor: readOnly ? (board.backgroundColor || 'transparent') : 'transparent',
          padding: readOnly ? '16px' : '0'
        } as React.CSSProperties}
      >
        {board.cards.map((card, index) => (
          <div
            key={card.id}
            draggable={!readOnly}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            className={`
              relative aspect-square border-4 rounded-xl overflow-hidden flex flex-col shadow-sm transition-transform hover:shadow-md bg-white
              ${readOnly ? '' : 'cursor-grab active:cursor-grabbing'}
            `}
            style={{ borderColor: card.backgroundColor }}
          >
            {/* Image Area */}
            <div className="h-[75%] w-full flex items-center justify-center p-2 bg-white">
              <img src={card.imageUrl} alt={card.label} className="max-h-full max-w-full object-contain pointer-events-none" />
            </div>

            {/* Label Area */}
            <div
              className="h-[25%] w-full flex items-center justify-center text-center font-bold text-sm sm:text-base uppercase px-1 leading-tight border-t-2"
              style={{
                backgroundColor: card.backgroundColor,
                borderColor: 'rgba(0,0,0,0.1)',
                color: 'black'
              }}
            >
              {card.label}
            </div>

            {/* Edit Controls */}
            {!readOnly && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 hover:opacity-100 transition-opacity bg-white/80 rounded-lg p-1 shadow-sm backdrop-blur-sm">
                <button
                  onClick={() => { setEditingCard(card); setIsCreatorOpen(true); }}
                  className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="p-1.5 hover:bg-red-100 rounded text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Drag Handle Indicator */}
            {!readOnly && (
              <div className="absolute top-2 left-2 text-gray-300 opacity-0 hover:opacity-100">
                <GripVertical className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {/* Empty State placeholder if grid is empty */}
        {board.cards.length === 0 && !readOnly && (
          <div
            onClick={() => setIsCreatorOpen(true)}
            className="aspect-square border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            <Plus className="w-12 h-12 mb-2" />
            <span className="font-medium">Add First Card</span>
          </div>
        )}
      </div>

      {(isCreatorOpen || editingCard) && (
        <CardEditor
          card={editingCard || undefined}
          userId={userId}
          onSave={handleSaveCard}
          onCancel={() => {
            setIsCreatorOpen(false);
            setEditingCard(null);
          }}
        />
      )}
    </div>
  );
};

export default Board;
