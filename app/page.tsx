
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
import { LayoutGrid, Printer, Plus, Sparkles, LogOut, User as UserIcon, Loader2, Trash2, ArrowLeft, Users, RefreshCw, Search, Copy, Download, FileUp, ArrowUpRight, Clock3, MoreHorizontal } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import AccountSettings from './components/AccountSettings';

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
  const [showAccountSettings, setShowAccountSettings] = useState(false);

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
    <div className="app-shell min-h-screen flex flex-col text-stone-900 dark:text-stone-100 font-sans transition-colors duration-300">
      {/* Navbar */}
      <header className="app-header sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-[72px] flex items-center justify-between">
          <div
            className="flex items-center gap-3 font-bold text-xl text-stone-900 dark:text-white cursor-pointer group"
            onClick={() => setRoute(AppRoute.HOME)}
          >
            <span className="brand-mark"><LayoutGrid className="w-5 h-5" /></span>
            <span className="hidden sm:inline tracking-[-0.03em]">Picto<span className="text-teal-700 dark:text-teal-400">board</span></span>
          </div>

          <div className="flex gap-2 sm:gap-3 items-center">
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

            <div className="w-px h-6 bg-stone-200 dark:bg-stone-700"></div>

            {user ? (
              <div className="flex items-center gap-4">
                <button onClick={() => setShowAccountSettings(true)} className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors" title="Account settings">
                  <span className="w-7 h-7 grid place-items-center rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-bold">{(user.user_metadata?.display_name || user.email || 'U').charAt(0).toUpperCase()}</span>
                  <span className="max-w-36 truncate">{user.user_metadata?.display_name || user.email}</span>
                </button>
                <button onClick={() => setShowAccountSettings(true)} className="sm:hidden editor-icon-button" aria-label="Account settings"><UserIcon className="w-5 h-5" /></button>
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
                className="primary-button !px-4 !py-2 text-sm"
              >
                <UserIcon className="w-4 h-4" /> Log In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-5 py-7 lg:px-8 lg:py-10 no-print">

        {route === AppRoute.AUTH && (
          <div className="py-12 animate-fade-in">
            <Auth onSuccess={() => {
              checkUser();
              setRoute(AppRoute.HOME);
            }} />
          </div>
        )}

        {route === AppRoute.HOME && (
          <div className="space-y-12 animate-fade-in">
            <section className="hero-panel">
              <div className="hero-copy">
                <div className="eyebrow"><Sparkles className="w-3.5 h-3.5" /> Communication made visual</div>
                <h1>Build a voice,<br /><span>one picture at a time.</span></h1>
                <p>Create clear, personal communication boards with familiar photos, simple symbols, and words that matter.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => createNewBoard()}
                    className="primary-button"
                  >
                    <Plus className="w-5 h-5" />
                    Create a board
                  </button>
                  <button
                    onClick={handleImportBoard}
                    className="secondary-button"
                  >
                    <FileUp className="w-5 h-5" />
                    Import board
                  </button>
                </div>
                <div className="hero-note"><span className="hero-avatars">😊 📷</span> Use emojis, your own photos, or your camera</div>
              </div>
              <div className="hero-visual" aria-hidden="true">
                <div className="sample-board">
                  <div className="sample-board-top"><span>My morning</span><MoreHorizontal className="w-5 h-5" /></div>
                  <div className="sample-grid">
                    {[['☀️','Wake up','#f8d7a3'],['🪥','Brush teeth','#b9dcd5'],['👕','Get dressed','#d8c8e7'],['🥣','Breakfast','#f4c5b8'],['🎒','Pack bag','#b9cdec'],['🚌','Go to school','#f3dfa2']].map(([emoji,label,color]) => (
                      <div className="sample-card" key={label} style={{'--card-color': color} as React.CSSProperties}><span>{emoji}</span><b>{label}</b></div>
                    ))}
                  </div>
                </div>
                <div className="floating-badge"><span>✓</span><div><b>Ready to use</b><small>Print or use on screen</small></div></div>
              </div>
            </section>

            <section>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div><p className="section-kicker">Your workspace</p><h2 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-white">{user ? 'Saved boards' : 'Your boards'}</h2></div>
                <div className="flex items-center gap-3">
                  {boards.length > 0 && (
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="board-search"
                        type="text"
                        placeholder="Search your boards"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input pl-10 pr-4 py-2.5 text-sm w-full sm:w-64"
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
                <div className="empty-state">
                  <span className="empty-icon"><LayoutGrid className="w-7 h-7" /></span>
                  <h3>Your first board starts here</h3>
                  <p>Choose a template or begin with a blank canvas. You can change everything later.</p>
                  <button onClick={() => createNewBoard()} className="primary-button mt-5"><Plus className="w-4 h-4" /> Create a board</button>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredBoards.map(board => (
                        <div
                          key={board.id}
                          onClick={() => openBoard(board.id)}
                          className="board-tile group"
                        >
                          <div
                            className="board-preview"
                            style={{ backgroundColor: board.backgroundColor || '#f9fafb' }}
                          >
                            {board.cards.length > 0 ? (
                              <div
                                className="grid w-28 h-28 opacity-95 gap-1"
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
                          <div className="flex items-start justify-between gap-3"><h3 className="font-bold text-lg text-stone-900 dark:text-white truncate">{board.title}</h3><ArrowUpRight className="w-5 h-5 text-stone-400 group-hover:text-teal-700 transition-colors" /></div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-stone-500 dark:text-stone-400 flex items-center gap-1.5"><Clock3 className="w-3.5 h-3.5" /> Edited {new Date(board.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} · {board.cards.length} cards</p>
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
            </section>
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

      {user && (
        <AccountSettings
          isOpen={showAccountSettings}
          user={user}
          onClose={() => setShowAccountSettings(false)}
          onUserUpdated={setUser}
        />
      )}

      {/* Footer */}
      <footer className="app-footer no-print">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-semibold"><span className="brand-mark !w-8 !h-8"><LayoutGrid className="w-4 h-4" /></span> Pictoboard</div>
          <p>Thoughtfully made for visual communicators and the people who support them.</p>
        </div>
      </footer>


    </div>
  );
}
