'use client';

import { useState } from 'react';
import { X, LogIn, Loader2 } from 'lucide-react';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (code: string) => Promise<{ success: boolean; groupName?: string; error?: string }>;
}

export default function JoinGroupModal({ isOpen, onClose, onJoin }: JoinGroupModalProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError('');

    try {
      const result = await onJoin(code.trim().toUpperCase());
      
      if (result.success) {
        alert(`Successfully joined ${result.groupName}!`);
        setCode('');
        onClose();
      } else {
        setError(result.error || 'Failed to join group');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(value);
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Join Family Group
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Enter Invite Code
            </label>
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="ABC123"
              className="w-full px-4 py-3 text-center text-2xl font-mono font-bold tracking-widest border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
              maxLength={6}
              autoFocus
              disabled={loading}
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
              Enter the 6-character code shared with you
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || code.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Join Group
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            <strong>Need a code?</strong> Ask a family group admin to generate an invite code 
            and share it with you.
          </p>
        </div>
      </div>
    </div>
  );
}
