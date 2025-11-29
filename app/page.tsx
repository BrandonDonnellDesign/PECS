
'use client';

import React, { useState, useEffect } from 'react';
import { PecsBoard, AppRoute } from './types';
import Board from './components/Board';
import Auth from './components/Auth';
import ThemeToggle from './components/ThemeToggle';
import { authService, storageService } from './services/supabase';
import { generateUUID } from './utils';
import { LayoutGrid, Printer, Plus, Home as HomeIcon, Sparkles, LogOut, User as UserIcon, Loader2, Trash2, ArrowLeft, Upload } from 'lucide-react';
import { User } from '@supabase/supabase-js';

export default function Home() {
  const [route, setRoute] = useState<AppRoute>(AppRoute.HOME);
  const [boards, setBoards] = useState<PecsBoard[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (!loading) {
      // This useEffect is now redundant if loadBoards is called directly in checkUser
      // and handles its own loading state.
      // Keeping it for now, but it might be removed in a future refactor.
      // loadBoards(); // This call might be problematic if user is null initially
    }
  }, [user, loading]);

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
    const currentUser = await authService.getUser();
    setUser(currentUser);
    loadBoards(currentUser?.id); // Call loadBoards with the user ID
  };

  const loadBoards = async (userId?: string) => {
    setLoading(true);
    const data = await storageService.getBoards(userId);
    setBoards(data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await authService.signOut();
    setUser(null);
    setRoute(AppRoute.HOME);
    setBoards([]); // Clear sensitive data
    loadBoards(); // Reload local/guest boards if any
  };

  const createNewBoard = async () => {
    const newBoard: PecsBoard = {
      id: generateUUID(),
      userId: user?.id,
      title: "New Board",
      gridColumns: 4,
      gridGap: 16,
      backgroundColor: '#ffffff',
      cards: [],
      updatedAt: Date.now()
    };
    await storageService.saveBoard(newBoard, user?.id);
    await loadBoards();
    setActiveBoardId(newBoard.id);
    setRoute(AppRoute.EDITOR);
  };

  const openBoard = (id: string) => {
    setActiveBoardId(id);
    setRoute(AppRoute.EDITOR);
  };

  const handleBoardUpdate = async (updatedBoard: PecsBoard) => {
    setBoards(prev => prev.map(b => b.id === updatedBoard.id ? updatedBoard : b));
    // The Board component calls storageService, but we update local state for responsiveness
  };

  const handleDeleteBoard = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this board?")) {
      await storageService.deleteBoard(id);
      loadBoards();
    }
  };

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
                    onClick={createNewBoard}
                    className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-blue-50 transition-all hover:scale-105 shadow-lg flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Create New Board
                  </button>
                  <label className="bg-blue-800/30 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-blue-800/50 transition-all hover:scale-105 shadow-lg flex items-center gap-2 cursor-pointer backdrop-blur-sm border border-white/20">
                    <Upload className="w-5 h-5" />
                    Import Board
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        try {
                          const text = await file.text();
                          const data = JSON.parse(text);
                          const { validateBoard, generateUUID } = await import('./utils');

                          if (validateBoard(data)) {
                            // Ensure ID is unique to avoid collisions
                            data.id = generateUUID();
                            data.title = `${data.title} (Imported)`;
                            data.updatedAt = Date.now();

                            await storageService.saveBoard(data, user?.id);
                            await loadBoards(user?.id);
                            alert('Board imported successfully!');
                          } else {
                            alert('Invalid board file.');
                          }
                        } catch (err) {
                          console.error(err);
                          alert('Failed to import board.');
                        }
                        e.target.value = ''; // Reset input
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <HomeIcon className="w-6 h-6 text-blue-500" />
                {user ? 'Your Saved Boards' : 'Local Boards'}
              </h2>

              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                  <p className="mt-2 text-gray-400 dark:text-gray-500">Loading your boards...</p>
                </div>
              ) : boards.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500">
                  <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-lg">No boards yet.</p>
                  <button onClick={createNewBoard} className="text-blue-600 dark:text-blue-400 hover:underline mt-2">Start creating now</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {boards.map(board => (
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
                              <div key={i} className="bg-white w-full h-full rounded-[2px] border border-gray-100" style={{ backgroundColor: c.backgroundColor }}></div>
                            ))}
                          </div>
                        ) : (
                          <LayoutGrid className="w-10 h-10 text-gray-300" />
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-gray-800 dark:text-white truncate pr-6">{board.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{board.cards.length} cards • {board.gridColumns} cols</p>

                      <button
                        onClick={(e) => handleDeleteBoard(e, board.id)}
                        className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm text-gray-300 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110"
                        title="Delete Board"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
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

      </main>

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
