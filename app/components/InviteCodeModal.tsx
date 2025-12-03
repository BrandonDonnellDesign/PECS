'use client';

import { useState } from 'react';
import { X, Copy, Check, RefreshCw } from 'lucide-react';

interface InviteCodeModalProps {
  isOpen: boolean;
  groupName: string;
  inviteCode: string;
  expiresAt: string;
  onClose: () => void;
  onRefresh: () => void;
}

export default function InviteCodeModal({
  isOpen,
  groupName,
  inviteCode,
  expiresAt,
  onClose,
  onRefresh
}: InviteCodeModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Invite Code
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Share this code to invite others to <strong>{groupName}</strong>
          </p>

          <div className="bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <div className="text-4xl font-mono font-bold text-blue-600 dark:text-blue-400 tracking-widest mb-2">
              {inviteCode}
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Code
                </>
              )}
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            <p>Expires: {formatExpiryDate(expiresAt)}</p>
            <p className="mt-1">Valid for 24 hours • Unlimited uses</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onRefresh}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            <RefreshCw className="w-4 h-4" />
            Generate New
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Done
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            <strong>How to share:</strong> Send this code via text, email, or any messaging app. 
            Recipients can join by clicking "Join Group" and entering the code.
          </p>
        </div>
      </div>
    </div>
  );
}
