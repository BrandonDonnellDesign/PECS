'use client';

import React from 'react';
import { THEMES, Theme } from '../types';
import { Check, Palette } from 'lucide-react';

interface ThemeSelectorProps {
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
}

export default function ThemeSelector({ currentTheme, onThemeChange }: ThemeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Choose Theme</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onThemeChange(theme.id)}
            className={`relative p-4 rounded-xl border-2 transition-all hover:scale-105 ${
              currentTheme === theme.id
                ? 'border-blue-500 shadow-lg'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            style={{ backgroundColor: theme.background }}
          >
            {/* Theme Preview */}
            <div className="space-y-2 mb-3">
              <div 
                className="h-8 rounded-lg"
                style={{ backgroundColor: theme.primary }}
              />
              <div className="flex gap-2">
                <div 
                  className="h-4 flex-1 rounded"
                  style={{ backgroundColor: theme.secondary }}
                />
                <div 
                  className="h-4 flex-1 rounded"
                  style={{ backgroundColor: theme.cardBorder }}
                />
              </div>
            </div>
            
            {/* Theme Name */}
            <p 
              className="text-sm font-medium text-center"
              style={{ color: theme.text }}
            >
              {theme.name}
            </p>
            
            {/* Selected Indicator */}
            {currentTheme === theme.id && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
