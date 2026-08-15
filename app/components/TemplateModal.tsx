'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';
import { BOARD_TEMPLATES, BoardTemplate } from '../templates';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: BoardTemplate) => void;
}

export default function TemplateModal({ isOpen, onClose, onSelectTemplate }: TemplateModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/50 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="template-title">
      <div className="bg-[#fffdf9] dark:bg-stone-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div>
            <p className="section-kicker">A helpful head start</p>
            <h2 id="template-title" className="text-2xl font-bold text-stone-900 dark:text-white">Choose a template</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Start with a pre-made board or create from scratch</p>
          </div>
          <button
            onClick={onClose}
            className="editor-icon-button"
            aria-label="Close template picker"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Blank Board Option */}
            <button
              onClick={() => onSelectTemplate(null as any)}
              className="p-6 border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-2xl hover:border-teal-600 hover:bg-teal-50/50 dark:hover:bg-teal-900/20 transition-all text-left group"
            >
              <div className="text-4xl mb-3">➕</div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Blank Board</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Start with an empty board and add your own cards</p>
            </button>

            {/* Template Options */}
            {BOARD_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                className="p-6 border border-stone-200 dark:border-stone-700 rounded-2xl hover:border-teal-600 hover:-translate-y-1 hover:shadow-lg transition-all text-left group"
              >
                <div className="text-4xl mb-3">{template.icon}</div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{template.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                    {template.cards.length} cards
                  </span>
                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded capitalize">
                    {template.category}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
