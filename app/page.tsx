
'use client';

import React, { useState, useEffect } from 'react';
import { PecsBoard, AppRoute } from './types';
import Board from './components/Board';
import Auth from './components/Auth';
import ThemeToggle from './components/ThemeToggle';
import FamilyGroups from './components/FamilyGroups';
import ConfirmDialog from './components/ConfirmDialog';
import { ToastContainer, ToastProps } from './components/Toast';
import TemplateModal from './components/TemplateModal';
import { createBoardFromTemplate, BoardTemplate } from './templates';
import { authService, storageService } from './services/supabase';
import { generateUUID, exportBoard, importBoard, initializeTTS } from './utils';
import { LayoutGrid, Printer, Plus, Home as HomeIcon, Sparkles, LogOut, User as UserIcon, Loader2, Trash2, ArrowLeft, Upload, Users, RefreshCw, Search, Copy, Download, FileUp } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import KeyboardShortcuts from './components/KeyboardShortcuts';

export default function Home() {
  const [route, setRoute] = useState<AppRoute>(AppRoute.HOME);
  const [boards, setBoards] = useState<PecsBoard[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFamilyGroup, setSelectedFamilyGroup] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; boardId: string | null }>({ isOpen: false, boardId: null });
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    checkUser();
    initializeTTS(); // Initialize text-to-speech voices
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N: New board
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (user && route === 'home') {
          createNewBoard();
        }
      }
      // Ctrl/Cmd + K: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('board-search')?.focus();
      }
      // Escape: Close modals
      if (e.key === 'Escape') {
        if (deleteConfirm.isOpen) {
          setDeleteConfirm({ isOpen: false, boardId: null });
        }
        if (showShortcuts) {
          setShowShortcuts(false);
        }
      }
      // ?: Show keyboard shortcuts
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowShortcuts(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [user, route, deleteConfirm.isOpen]);

  // Set up real-time subscription and polling fallback
  useEffect(() => {
    if (!user) return;

    // Polling fallback - refresh every 30 seconds
    const pollInterval = setInterval(() => {
      loadBoards(user.id);
    }, 30000);

    // Try to set up real-time subscription
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      const channel = supabase
        .channel('boards-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'boards'
          },
          () => {
            loadBoards(user.id);
          }
        )
        .subscribe();

      return () => {
        clearInterval(pollInterval);
        supabase.removeChannel(channel);
      };
    }

    return () => clearInterval(pollInterval);
  }, [user]);

  // Auto-trigger print when entering print route
  useEffect(() => {
    if (route === AppRoute.PRINT && activeBoardId) {
      const timer = setTimeout(() => {
        window.print();
      }, 800); // Wait for images to render
      return () => clearTimeout(timer);
    }
  }, [route, activeBoardId]);

  const checkUser = async () => {
    setLoading(true);
    try {
      const currentUser = await authService.getUser();
      setUser(currentUser);
      await loadBoards(currentUser?.id);
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadBoards = async (userId?: string) => {
    try {
      const data = await storageService.getBoards(userId);
      setBoards(data);
    } catch (error) {
      console.error("Error loading boards:", error);
      setBoards([]);
    }
  };

  const handleLogout = async () => {
    await authService.signOut();
    setUser(null);
    setRoute(AppRoute.HOME);
    await loadBoards(); // Reload local/guest boards if any
  };

  const createNewBoard = async (familyGroupId?: string) => {
    setShowTemplateModal(true);
  };

  const handleTemplateSelect = async (template: BoardTemplate | null) => {
    const newBoard: PecsBoard = template
      ? createBoardFromTemplate(template, user?.id)
      : {
        id: generateUUID(),
        userId: user?.id,
        familyGroupId: selectedFamilyGroup || null,
        title: "New Board",
        gridColumns: 4,
        gridGap: 16,
        backgroundColor: '#ffffff',
        cards: [],
        updatedAt: Date.now()
      };

    await storageService.saveBoard(newBoard, user?.id);
    await loadBoards(user?.id);
    setActiveBoardId(newBoard.id);
    setRoute(AppRoute.EDITOR);
    setShowTemplateModal(false);
    showToast(template ? `Created "${template.name}" board` : 'Board created successfully', 'success');
  };

  const openBoard = (id: string) => {
    setActiveBoardId(id);
    setRoute(AppRoute.EDITOR);
  };

  const handleBoardUpdate = async (updatedBoard: PecsBoard) => {
    setBoards(prev => prev.map(b => b.id === updatedBoard.id ? updatedBoard : b));
    // The Board component calls storageService, but we update local state for responsiveness
  };

  const handleDeleteBoard = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirm({ isOpen: true, boardId: id });
  };

  const showToast = (message: string, type: ToastProps['type']) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type, onClose: removeToast }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const confirmDelete = async () => {
    if (deleteConfirm.boardId) {
      await storageService.deleteBoard(deleteConfirm.boardId);
      await loadBoards(user?.id);
      showToast('Board deleted successfully', 'success');
    }
    setDeleteConfirm({ isOpen: false, boardId: null });
  };

  const duplicateBoard = async (board: PecsBoard) => {
    const duplicate: PecsBoard = {
      ...board,
      id: generateUUID(),
      title: `${board.title} (Copy)`,
      updatedAt: Date.now(),
      cards: board.cards.map(card => ({
        ...card,
        id: generateUUID()
      }))
    };
    await storageService.saveBoard(duplicate, user?.id);
    await loadBoards(user?.id);
    showToast('Board duplicated successfully', 'success');
  };

  const handleExportBoard = (e: React.MouseEvent, board: PecsBoard) => {
    e.stopPropagation();
    exportBoard(board);
    showToast(`Exported "${board.title}"`, 'success');
  };

  const handleImportBoard = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const board = await importBoard(file);
          board.userId = user?.id;
          await storageService.saveBoard(board, user?.id);
          await loadBoards(user?.id);
          showToast(`Imported "${board.title}"`, 'success');
        } catch (error) {
          showToast('Failed to import board', 'error');
        }
      }
    };
    input.click();
  };

  const filteredBoards = boards.filter(board =>
    board.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleManualPrint = () => {
    window.print();
  };

  const activeBoard = boards.find(b => b.id === activeBoardId);

  // --- Views ---

  if (route === AppRoute.PRINT && activeBoard) {
    return (
      <div className="min-h-screen bg-white text-black p-0 print-wrapper">
        <div className="no-print p-4 flex justify-between items-center border-b bg-gray-50 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setRoute(AppRoute.EDITOR)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Editor
            </button>
            <div className="text-sm text-gray-600 hidden md:block">
              <span className="font-semibold">Tip:</span> Enable "Background Graphics" in printer settings.
            </div>
          </div>
          <button
            onClick={handleManualPrint}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex gap-2 items-center shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print Board
          </button>
        </div>

        <div className="p-8 print:p-0 print-content w-full">
          <h1 className="text-3xl font-bold uppercase tracking-wider mb-6 text-center print:mb-4">{activeBoard.title}</h1>
          <div className="w-full">
            <Board board={activeBoard} onUpdate={() => { }} readOnly />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      {/* Navbar */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm sticky top-0 z-40 no-print transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2 font-bold text-xl text-blue-600 dark:text-blue-400 cursor-pointer"
            onClick={() => setRoute(AppRoute.HOME)}
          >
            <LayoutGrid className="w-6 h-6" />
            <span className="hidden sm:inline">PECS Creator</span>
          </div>

          <div className="flex gap-4 items-center">
            <ThemeToggle />

            {route === AppRoute.EDITOR && activeBoard && (
              <button
                onClick={() => setRoute(AppRoute.PRINT)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Mode
              </button>
            )}

            {user && route !== AppRoute.PRINT && (
              <button
                onClick={() => setRoute(route === AppRoute.FAMILY ? AppRoute.HOME : AppRoute.FAMILY)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${route === AppRoute.FAMILY
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                  }`}
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Family Groups</span>
              </button>
            )}

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>

            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Log Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setRoute(AppRoute.AUTH)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm hover:bg-black dark:hover:bg-gray-100 transition-colors"
              >
                <UserIcon className="w-4 h-4" /> Log In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-6 no-print">

        {route === AppRoute.AUTH && (
          <div className="py-12 animate-fade-in">
            <Auth onSuccess={() => {
              checkUser();
              setRoute(AppRoute.HOME);
            }} />
          </div>
        )}

        {route === AppRoute.HOME && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center py-12 px-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl text-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
              <div className="relative z-10">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">Create Custom PECS Boards</h1>
                <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto mb-8 font-light">
                  Design accessible communication tools instantly. Use your own photos or our camera tool. Now with customizable layouts and cloud saving.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => createNewBoard()}
                    className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-blue-50 transition-all hover:scale-105 shadow-lg flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Create New Board
                  </button>
                  <button
                    onClick={handleImportBoard}
                    className="bg-blue-800/30 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-blue-800/50 transition-all hover:scale-105 shadow-lg flex items-center gap-2 backdrop-blur-sm border border-white/20"
                  >
                    <FileUp className="w-5 h-5" />
                    Import Board
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <HomeIcon className="w-6 h-6 text-blue-500" />
                  {user ? 'Your Saved Boards' : 'Local Boards'}
                </h2>
                <div className="flex items-center gap-3">
                  {boards.length > 0 && (
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="board-search"
                        type="text"
                        placeholder="Search boards... (Ctrl+K)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                      />
                    </div>
                  )}
                  {user && (
                    <button
                      onClick={() => loadBoards(user.id)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title="Refresh boards (F5)"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span className="hidden sm:inline">Refresh</span>
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="text-center py-16">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500 mb-4" />
                  <p className="text-lg text-gray-600 dark:text-gray-400">Loading your boards...</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">This may take a moment</p>
                </div>
              ) : boards.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500">
                  <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-lg">No boards yet.</p>
                  <button onClick={() => createNewBoard()} className="text-blue-600 dark:text-blue-400 hover:underline mt-2">Start creating now</button>
                </div>
              ) : (
                <>
                  {searchQuery && filteredBoards.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-lg text-gray-400 dark:text-gray-500">No boards found matching "{searchQuery}"</p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-blue-600 dark:text-blue-400 hover:underline mt-2"
                      >
                        Clear search
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {filteredBoards.map(board => (
                        <div
                          key={board.id}
                          onClick={() => openBoard(board.id)}
                          className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer group relative overflow-hidden"
                        >
                          <div
                            className="h-32 rounded-lg mb-4 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-700"
                            style={{ backgroundColor: board.backgroundColor || '#f9fafb' }}
                          >
                            {board.cards.length > 0 ? (
                              <div
                                className="grid w-20 h-20 opacity-90 gap-[2px]"
                                style={{ gridTemplateColumns: `repeat(${Math.min(board.gridColumns, 3)}, 1fr)` }}
                              >
                                {board.cards.slice(0, 9).map((c, i) => (
                                  <div
                                    key={i}
                                    className="bg-white w-full h-full rounded-[2px] border border-gray-100 overflow-hidden relative flex items-center justify-center"
                                    style={{ backgroundColor: c.backgroundColor }}
                                  >
                                    {c.imageUrl ? (
                                      <img src={c.imageUrl} alt={c.label} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-[5px] text-gray-800 text-center leading-none px-[1px] truncate w-full font-medium">
                                        {c.label}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <LayoutGrid className="w-10 h-10 text-gray-300" />
                            )}
                          </div>
                          <h3 className="font-bold text-lg text-gray-800 dark:text-white truncate pr-6">{board.title}</h3>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{board.cards.length} cards • {board.gridColumns} cols</p>
                            {board.familyGroupId && (
                              <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                                <Users className="w-3 h-3" />
                                <span>Shared</span>
                              </div>
                            )}
                          </div>

                          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => handleExportBoard(e, board)}
                              className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm text-gray-400 dark:text-gray-500 hover:text-green-500 dark:hover:text-green-400 transition-colors transform hover:scale-110"
                              title="Export Board"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); duplicateBoard(board); }}
                              className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors transform hover:scale-110"
                              title="Duplicate Board"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteBoard(e, board.id)}
                              className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors transform hover:scale-110"
                              title="Delete Board"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {route === AppRoute.EDITOR && activeBoard && (
          <div className="animate-fade-in h-full">
            <Board
              board={activeBoard}
              userId={user?.id}
              onUpdate={handleBoardUpdate}
            />
          </div>
        )}

        {route === AppRoute.FAMILY && user && (
          <div className="animate-fade-in">
            <FamilyGroups onBoardCreate={(groupId) => createNewBoard(groupId)} />
          </div>
        )}

      </main>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Board"
        message="Are you sure you want to delete this board? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, boardId: null })}
      />

      {/* Template Selection Modal */}
      <TemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelectTemplate={handleTemplateSelect}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcuts
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Footer */}
      <footer className="border-t dark:border-gray-700 bg-white dark:bg-gray-800 py-8 mt-12 no-print transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400 flex flex-col items-center gap-3">
          <div className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
            Powered by <Sparkles className="w-4 h-4 text-purple-500" /> PECS Creator
          </div>
          <p>Designed to assist in creating AAC materials for everyone.</p>
        </div>
      </footer>


    </div>
  );
}
