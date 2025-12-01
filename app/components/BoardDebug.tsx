'use client';

import { useState, useEffect } from 'react';
import { authService, storageService } from '../services/supabase';

export default function BoardDebug() {
  const [info, setInfo] = useState<any>({});

  useEffect(() => {
    checkEverything();
  }, []);

  const checkEverything = async () => {
    const user = await authService.getUser();
    const boards = await storageService.getBoards(user?.id);
    const localBoards = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem('pecs_creator_boards') || '[]')
      : [];

    setInfo({
      user: user ? { id: user.id, email: user.email } : null,
      supabaseBoards: boards,
      localBoards: localBoards,
      boardCount: boards.length,
      localBoardCount: localBoards.length
    });
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-md max-h-96 overflow-auto text-xs border">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <button 
        onClick={checkEverything}
        className="mb-2 px-2 py-1 bg-blue-500 text-white rounded text-xs"
      >
        Refresh
      </button>
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(info, null, 2)}
      </pre>
    </div>
  );
}
