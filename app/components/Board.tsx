
import React, { useState, useEffect, useRef } from 'react';
import { PecsBoard, PecsCard, FamilyGroup } from '../types';
import CardEditor from './CardEditor';
import { Plus, Trash2, Edit2, GripVertical, Settings2, Palette, Users, Share2, Undo2, Redo2, Volume2, Search, Copy, Check, Clock, ArrowRight, ArrowUp, ArrowDown, WifiOff, HelpCircle, X, Sparkles } from 'lucide-react';
import { storageService, familyService } from '../services/supabase';
import { BoardHistory, speakText } from '../utils';
import BoardSelectorModal from './BoardSelectorModal';

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
  const [familyGroupName, setFamilyGroupName] = useState<string | null>(null);
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const historyRef = useRef(new BoardHistory());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Copy to board state
  const [copyingCard, setCopyingCard] = useState<PecsCard | null>(null);
  const [availableBoards, setAvailableBoards] = useState<PecsBoard[]>([]);

  // Initialize history when board loads
  useEffect(() => {
    historyRef.current.initialize(board);
    updateHistoryState();
    if (!readOnly && !localStorage.getItem('pictoboard_editor_intro')) setShowOnboarding(true);
  }, [board.id]);

  useEffect(() => {
    if (userId) {
      loadFamilyGroups();
    }
  }, [userId]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const updateHistoryState = () => {
    setCanUndo(historyRef.current.canUndo());
    setCanRedo(historyRef.current.canRedo());
  };

  const saveToHistory = (updatedBoard: PecsBoard) => {
    historyRef.current.push(updatedBoard);
    updateHistoryState();
  };

  const handleUndo = () => {
    const previousBoard = historyRef.current.undo();
    if (previousBoard) {
      onUpdate(previousBoard);
      storageService.saveBoard(previousBoard, userId);
      updateHistoryState();
    }
  };

  const handleRedo = () => {
    const nextBoard = historyRef.current.redo();
    if (nextBoard) {
      onUpdate(nextBoard);
      storageService.saveBoard(nextBoard, userId);
      updateHistoryState();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showShareMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('.share-menu-container')) {
          setShowShareMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShareMenu]);

  useEffect(() => {
    if (board.familyGroupId && familyGroups.length > 0) {
      const group = familyGroups.find(g => g.id === board.familyGroupId);
      setFamilyGroupName(group?.name || null);
    }
  }, [board.familyGroupId, familyGroups]);

  const loadFamilyGroups = async () => {
    if (!userId) return;
    try {
      const groups = await familyService.getFamilyGroups(userId);
      setFamilyGroups(groups);
    } catch (error) {
      console.error('Error loading family groups:', error);
    }
  };

  const saveWithIndicator = async (updatedBoard: PecsBoard) => {
    setIsSaving(true);
    setSaveError(false);
    try {
      await storageService.saveBoard(updatedBoard, userId);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Unable to save board:', error);
      setSaveError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCard = async (newCard: PecsCard) => {
    let newCards = [...board.cards];
    if (editingCard) {
      newCards = newCards.map(c => c.id === newCard.id ? newCard : c);
    } else {
      newCards.push(newCard);
    }

    const updatedBoard = { ...board, cards: newCards, updatedAt: Date.now() };
    saveToHistory(updatedBoard);
    onUpdate(updatedBoard);
    await saveWithIndicator(updatedBoard);

    setEditingCard(null);
    setIsCreatorOpen(false);
  };

  const handleDeleteCard = async (id: string) => {
    if (confirm("Remove this card?")) {
      const updatedBoard = {
        ...board,
        cards: board.cards.filter(c => c.id !== id),
        updatedAt: Date.now()
      };
      saveToHistory(updatedBoard);
      onUpdate(updatedBoard);
      await saveWithIndicator(updatedBoard);
    }
  };

  const handleDuplicateCard = async (card: PecsCard) => {
    const duplicate: PecsCard = {
      ...card,
      id: crypto.randomUUID()
    };
    const updatedBoard = {
      ...board,
      cards: [...board.cards, duplicate],
      updatedAt: Date.now()
    };
    saveToHistory(updatedBoard);
    onUpdate(updatedBoard);
    await saveWithIndicator(updatedBoard);
  };

  // Simple Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggedCardIndex(board.cards.findIndex(card => card.id === cardId));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, cardId: string) => {
    e.preventDefault();
    if (draggedCardIndex === null) return;

    const dropIndex = board.cards.findIndex(card => card.id === cardId);
    const newCards = [...board.cards];
    const [draggedItem] = newCards.splice(draggedCardIndex, 1);
    newCards.splice(dropIndex, 0, draggedItem);

    const updatedBoard = { ...board, cards: newCards, updatedAt: Date.now() };
    saveToHistory(updatedBoard);
    onUpdate(updatedBoard);
    saveWithIndicator(updatedBoard);
    setDraggedCardIndex(null);
  };

  const moveCard = (cardId: string, direction: -1 | 1) => {
    const currentIndex = board.cards.findIndex(card => card.id === cardId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= board.cards.length) return;
    const cards = [...board.cards];
    [cards[currentIndex], cards[nextIndex]] = [cards[nextIndex], cards[currentIndex]];
    const updatedBoard = { ...board, cards, updatedAt: Date.now() };
    saveToHistory(updatedBoard);
    onUpdate(updatedBoard);
    saveWithIndicator(updatedBoard);
  };

  const dismissOnboarding = () => {
    localStorage.setItem('pictoboard_editor_intro', 'seen');
    setShowOnboarding(false);
  };

  const updateBoardSettings = (settings: Partial<PecsBoard>) => {
    const updated = { ...board, ...settings, updatedAt: Date.now() };
    saveToHistory(updated);
    onUpdate(updated);
    storageService.saveBoard(updated, userId);
  };

  const [speakingCardId, setSpeakingCardId] = useState<string | null>(null);

  // Filter cards based on search and category
  const filteredCards = board.cards.filter(card => {
    const matchesSearch = card.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || card.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCardClick = async (card: PecsCard) => {
    if (!readOnly) {
      // Update usage statistics
      const updatedCard = {
        ...card,
        usageCount: (card.usageCount || 0) + 1,
        lastUsed: Date.now()
      };

      const updatedBoard = {
        ...board,
        cards: board.cards.map(c => c.id === card.id ? updatedCard : c),
        updatedAt: Date.now()
      };

      onUpdate(updatedBoard);
      await saveWithIndicator(updatedBoard);

      // Visual and audio feedback
      setSpeakingCardId(card.id);

      // Play custom audio if available, otherwise use TTS
      if (card.audioUrl) {
        const audio = new Audio(card.audioUrl);
        audio.play();
      } else {
        speakText(card.label);
      }

      // Clear speaking state after a delay
      setTimeout(() => {
        setSpeakingCardId(null);
      }, 1500);
    }
  };

  const handleShareWithGroup = async (groupId: string | null) => {
    const updated = { ...board, familyGroupId: groupId, updatedAt: Date.now() };
    onUpdate(updated);
    await storageService.saveBoard(updated, userId);
    setShowShareMenu(false);

    if (groupId) {
      const group = familyGroups.find(g => g.id === groupId);
      alert(`Board shared with ${group?.name}!`);
    } else {
      alert('Board is now private (unshared)');
    }
  };

  const handleInitiateCopy = async (card: PecsCard) => {
    setCopyingCard(card);
    try {
      const boards = await storageService.getBoards(userId);
      setAvailableBoards(boards);
    } catch (error) {
      console.error("Error fetching boards for copy:", error);
      // Fallback or empty list logic handled by modal state
    }
  };

  const handleCopyToBoard = async (targetBoard: PecsBoard) => {
    if (!copyingCard) return;

    try {
      const newCard: PecsCard = {
        ...copyingCard,
        id: crypto.randomUUID()
      };

      const updatedTargetBoard = {
        ...targetBoard,
        cards: [...targetBoard.cards, newCard],
        updatedAt: Date.now()
      };

      await storageService.saveBoard(updatedTargetBoard, userId);
      setCopyingCard(null);
      // Optional: show a toast or notification. Since we don't have toast context here easily without props, a simple alert or nothing is fine.
      // Ideally we would trigger a toast from parent, but keeping it simple for now as per "allow me to copy..."
      alert(`Card copied to "${targetBoard.title}"!`);
    } catch (error) {
      console.error("Error copying card to board:", error);
      alert("Failed to copy card to board.");
    }
  };

  return (
    <div className="editor-workspace w-full h-full flex flex-col pb-20 sm:pb-0">
      {!readOnly && (
        <div className="editor-toolbar mb-6 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="w-full sm:w-auto">
              <input
                aria-label="Board title"
                className="w-full sm:w-auto text-2xl sm:text-3xl font-bold tracking-tight text-stone-800 dark:text-white border-b-2 border-transparent focus:border-teal-600 outline-none bg-transparent"
                value={board.title}
                onChange={(e) => updateBoardSettings({ title: e.target.value })}
              />
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <p className="text-stone-500 dark:text-stone-400 text-sm">{filteredCards.length} of {board.cards.length} cards</p>
                {familyGroupName && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <div className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
                      <Users className="w-3 h-3" />
                      <span>{familyGroupName}</span>
                    </div>
                  </>
                )}
                {(lastSaved || isSaving || saveError) && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      {saveError ? (
                        <><WifiOff className="w-3.5 h-3.5 text-red-500" /><span className="text-red-600">Not saved — check connection</span></>
                      ) : isSaving ? (
                        <>
                          <Clock className="w-3 h-3 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                          <span>Saved {lastSaved?.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search cards"
                  aria-label="Search cards"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input w-full pl-10 pr-4 py-2.5 text-sm"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter cards by category"
                className="search-input px-4 py-2.5 text-sm"
              >
                <option value="all">All Categories</option>
                <option value="noun">Nouns</option>
                <option value="verb">Verbs</option>
                <option value="adjective">Adjectives</option>
                <option value="social">Social</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div></div>

            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button onClick={() => setShowOnboarding(true)} className="editor-icon-button" title="Editor help" aria-label="Open editor help"><HelpCircle className="w-5 h-5" /></button>
              <div className="relative share-menu-container">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className={`editor-icon-button ${showShareMenu ? 'is-active' : ''}`}
                  title="Share with family group"
                >
                  <Share2 className="w-5 h-5" />
                </button>

                {showShareMenu && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-2">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 px-2">
                      Share with Family Group
                    </div>
                    <div className="space-y-1">
                      <button
                        onClick={() => handleShareWithGroup(null)}
                        className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${!board.familyGroupId ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                      >
                        🔒 Private (Just Me)
                      </button>
                      {familyGroups.map(group => (
                        <button
                          key={group.id}
                          onClick={() => handleShareWithGroup(group.id)}
                          className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${board.familyGroupId === group.id ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}
                        >
                          <Users className="w-3 h-3 inline mr-2" />
                          {group.name}
                        </button>
                      ))}
                      {familyGroups.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
                          No family groups yet
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleUndo}
                  disabled={!canUndo}
                  title="Undo (Ctrl+Z)"
                  className="editor-icon-button disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Undo2 className="w-5 h-5" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={!canRedo}
                  title="Redo (Ctrl+Y)"
                  className="editor-icon-button disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Redo2 className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`editor-icon-button ${showSettings ? 'is-active' : ''}`}
                aria-label="Board appearance settings"
              >
                <Settings2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsCreatorOpen(true)}
                className="primary-button flex-1 sm:flex-none !min-h-10 !py-2"
              >
                <Plus className="w-5 h-5" />
                Add card
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="pt-4 border-t dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              Grid columns
                </label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6, 8].map(cols => (
                    <button
                      key={cols}
                      onClick={() => updateBoardSettings({ gridColumns: cols })}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${board.gridColumns === cols ? 'bg-teal-700 text-white' : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200'}`}
                    >
                      {cols}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              Card spacing
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
                  <Palette className="w-4 h-4" /> Board background
                </label>
                <div className="flex gap-2 flex-wrap items-center">
                  {['#f3f4f6', '#ffffff', '#fff1f2', '#f0f9ff', '#f0fdf4', '#faf5ff', '#1f2937'].map(color => (
                    <button
                      key={color}
                      onClick={() => updateBoardSettings({ backgroundColor: color })}
                      className={`w-10 h-10 rounded-full border-2 border-gray-300 dark:border-gray-600 shadow-sm hover:scale-110 transition-transform ${board.backgroundColor === color ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800' : ''}`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                  <div className="relative">
                    <input
                      type="color"
                      value={board.backgroundColor || '#ffffff'}
                      onChange={(e) => updateBoardSettings({ backgroundColor: e.target.value })}
                      className="w-10 h-10 rounded-full border-2 border-gray-300 dark:border-gray-600 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                      title="Custom color"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 flex items-end">
                <button
                  onClick={() => import('../utils').then(u => u.exportBoard(board))}
                  className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Settings2 className="w-4 h-4" /> Export board data
                </button>
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
        {filteredCards.map((card) => (
          <div
            key={card.id}
            draggable={!readOnly}
            onDragStart={(e) => handleDragStart(e, card.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, card.id)}
            className={`
              relative aspect-square border-4 rounded-xl overflow-hidden flex flex-col shadow-sm bg-white
              communication-card ${readOnly ? '' : 'cursor-grab active:cursor-grabbing'}
              ${speakingCardId === card.id ? 'animate-card-click' : ''}
              break-inside-avoid animate-bounce-in
            `}
            style={{ borderColor: card.backgroundColor }}
          >
            {/* Image Area */}
            <div
              className="h-[75%] w-full flex items-center justify-center p-2 bg-white cursor-pointer relative group"
              onClick={() => handleCardClick(card)}
            >
              <img src={card.imageUrl} alt={card.label} className="max-h-full max-w-full object-contain pointer-events-none" />
              {/* TTS indicator */}
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity pointer-events-none ${speakingCardId === card.id
                ? 'opacity-100 bg-blue-500/20'
                : 'opacity-0 group-hover:opacity-100 bg-black/10'
                }`}>
                <Volume2 className={`w-8 h-8 drop-shadow-lg transition-all ${speakingCardId === card.id
                  ? 'text-blue-600 scale-110 animate-pulse'
                  : 'text-blue-600'
                  }`} />
              </div>
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
              <div className="card-actions absolute top-2 right-2 flex gap-1 bg-white/90 dark:bg-stone-800/90 rounded-lg p-1 shadow-sm backdrop-blur-sm">
                <button onClick={() => moveCard(card.id, -1)} disabled={board.cards[0]?.id === card.id} className="card-action" title="Move card earlier" aria-label={`Move ${card.label} earlier`}><ArrowUp className="w-4 h-4" /></button>
                <button onClick={() => moveCard(card.id, 1)} disabled={board.cards[board.cards.length - 1]?.id === card.id} className="card-action" title="Move card later" aria-label={`Move ${card.label} later`}><ArrowDown className="w-4 h-4" /></button>
                <button
                  onClick={() => handleInitiateCopy(card)}
                  className="card-action"
                  title="Copy to another Board"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDuplicateCard(card)}
                  className="card-action"
                  title="Duplicate Card"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setEditingCard(card); setIsCreatorOpen(true); }}
                  className="card-action"
                  title="Edit Card"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="card-action hover:!text-red-600"
                  title="Delete Card"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Drag Handle Indicator */}
            {!readOnly && (
              <div className="drag-handle absolute top-2 left-2 text-stone-400 bg-white/80 rounded-md p-1" aria-hidden="true">
                <GripVertical className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {/* Empty State placeholder if grid is empty */}
        {board.cards.length === 0 && !readOnly && (
          <div
            onClick={() => setIsCreatorOpen(true)}
            className="aspect-square border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-2xl flex flex-col items-center justify-center text-stone-500 cursor-pointer hover:border-teal-600 hover:text-teal-700 transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            <Plus className="w-12 h-12 mb-2" />
            <span className="font-medium">Add your first card</span>
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="mobile-editor-bar sm:hidden">
          <button onClick={handleUndo} disabled={!canUndo} aria-label="Undo"><Undo2 className="w-5 h-5" /></button>
          <button onClick={() => setShowSettings(!showSettings)} aria-label="Board settings"><Settings2 className="w-5 h-5" /></button>
          <button onClick={() => setIsCreatorOpen(true)} className="mobile-add"><Plus className="w-6 h-6" /><span>Add card</span></button>
          <button onClick={() => setShowShareMenu(!showShareMenu)} aria-label="Share board"><Share2 className="w-5 h-5" /></button>
        </div>
      )}

      {showOnboarding && !readOnly && (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4 bg-stone-950/45 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="editor-intro-title">
          <div className="intro-dialog animate-scale-in">
            <button onClick={dismissOnboarding} className="intro-close" aria-label="Close introduction"><X className="w-5 h-5" /></button>
            <div className="eyebrow"><Sparkles className="w-4 h-4" /> Quick tour</div>
            <h2 id="editor-intro-title">Make this board your own</h2>
            <p>Three simple steps are all it takes to create a useful visual communication board.</p>
            <ol>
              <li><span>1</span><div><b>Add familiar pictures</b><small>Choose an emoji, upload a photo, or use your camera.</small></div></li>
              <li><span>2</span><div><b>Arrange the cards</b><small>Drag cards, or use the arrow controls for keyboard and touch access.</small></div></li>
              <li><span>3</span><div><b>Use or print</b><small>Tap a card to hear it spoken, or open Print mode for a paper board.</small></div></li>
            </ol>
            <button onClick={dismissOnboarding} className="primary-button w-full mt-6">Start creating <ArrowRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

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

      {/* Board Selector Modal */}
      <BoardSelectorModal
        isOpen={!!copyingCard}
        onClose={() => setCopyingCard(null)}
        onSelect={handleCopyToBoard}
        boards={availableBoards}
        currentBoardId={board.id}
      />
    </div>
  );
};

export default Board;
