'use client';

import { X, Search, LayoutGrid } from 'lucide-react';
import { PecsBoard } from '../types';
import { useEffect, useRef, useState } from 'react';

interface BoardSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (board: PecsBoard) => void;
    boards: PecsBoard[];
    currentBoardId?: string;
}

export default function BoardSelectorModal({
    isOpen,
    onClose,
    onSelect,
    boards,
    currentBoardId
}: BoardSelectorModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        searchRef.current?.focus();
        const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const filteredBoards = boards.filter(board =>
        board.id !== currentBoardId &&
        board.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/50 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="board-selector-title">
            <div className="bg-[#fffdf9] dark:bg-stone-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-scale-in flex flex-col">
                <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
                    <div>
                        <p className="section-kicker">Reuse a visual</p><h2 id="board-selector-title" className="text-xl font-bold text-stone-900 dark:text-white">Copy card to a board</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Select a destination board</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="editor-icon-button"
                        aria-label="Close board picker"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4 border-b dark:border-gray-700">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            ref={searchRef}
                            placeholder="Search boards"
                            aria-label="Search destination boards"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input w-full pl-10 pr-4 py-2.5 text-sm"
                        />
                    </div>
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                    {filteredBoards.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            {searchQuery ? 'No boards found matching your search' : 'No other boards available'}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {filteredBoards.map((board) => (
                                <button
                                    key={board.id}
                                    onClick={() => onSelect(board)}
                                    className="flex items-center gap-4 p-4 border border-stone-200 dark:border-stone-700 rounded-2xl hover:border-teal-600 hover:bg-teal-50/40 dark:hover:bg-teal-900/20 transition-all text-left bg-white dark:bg-stone-800/50 group"
                                >
                                    <div
                                        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: board.backgroundColor || '#f3f4f6' }}
                                    >
                                        <LayoutGrid className="w-6 h-6 opacity-50" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {board.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {board.cards.length} cards • Updated {new Date(board.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
