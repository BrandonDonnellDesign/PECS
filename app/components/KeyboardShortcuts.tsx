'use client';

import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { keys: ['Ctrl', 'N'], description: 'Create new board', context: 'Home' },
    { keys: ['Ctrl', 'Z'], description: 'Undo last change', context: 'Editor' },
    { keys: ['Ctrl', 'Y'], description: 'Redo change', context: 'Editor' },
    { keys: ['Ctrl', 'K'], description: 'Focus search', context: 'Home' },
    { keys: ['Escape'], description: 'Close modals', context: 'Anywhere' },
    { keys: ['Click'], description: 'Speak card label (TTS)', context: 'Editor' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Keyboard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Keyboard Shortcuts</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Work faster with these shortcuts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  {shortcut.keys.map((key, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <span className="text-gray-400">+</span>}
                      <kbd className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono font-semibold text-gray-700 dark:text-gray-300 shadow-sm">
                        {key}
                      </kbd>
                    </React.Fragment>
                  ))}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{shortcut.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{shortcut.context}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Tip:</strong> Press <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono">?</kbd> anytime to see this help
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
