'use client';

import React, { useState, useEffect } from 'react';
import { UserSettings } from '../types';
import ThemeSelector from './ThemeSelector';
import { Settings as SettingsIcon, Volume2, Zap, Globe, Save } from 'lucide-react';
import { getAvailableVoices } from '../utils';

interface SettingsProps {
  userId?: string;
  onSave: (settings: UserSettings) => void;
}

export default function Settings({ userId, onSave }: SettingsProps) {
  const [settings, setSettings] = useState<UserSettings>({
    userId: userId || '',
    language: 'en',
    ttsRate: 0.85,
    animationsEnabled: true,
    theme: 'default',
    autoSave: true
  });

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load saved settings
    const savedSettings = localStorage.getItem(`settings_${userId}`);
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Load available voices
    const loadVoices = () => {
      const availableVoices = getAvailableVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [userId]);

  const handleSave = () => {
    localStorage.setItem(`settings_${userId}`, JSON.stringify(settings));
    onSave(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <SettingsIcon className="w-8 h-8" />
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Customize your PECS Creator experience</p>
      </div>

      {/* Theme Selection */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm">
        <ThemeSelector 
          currentTheme={settings.theme}
          onThemeChange={(theme) => updateSetting('theme', theme)}
        />
      </div>

      {/* Text-to-Speech Settings */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Text-to-Speech</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Voice
            </label>
            <select
              value={settings.ttsVoice || ''}
              onChange={(e) => updateSetting('ttsVoice', e.target.value)}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Auto (Best Available)</option>
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Speech Rate: {settings.ttsRate.toFixed(2)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.05"
              value={settings.ttsRate}
              onChange={(e) => updateSetting('ttsRate', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Slower</span>
              <span>Normal</span>
              <span>Faster</span>
            </div>
          </div>
        </div>
      </div>

      {/* Language Settings */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Language</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Interface Language
          </label>
          <select
            value={settings.language}
            onChange={(e) => updateSetting('language', e.target.value)}
            className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="it">Italiano</option>
            <option value="pt">Português</option>
            <option value="zh">中文</option>
            <option value="ja">日本語</option>
          </select>
        </div>
      </div>

      {/* Performance Settings */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance</h3>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Enable Animations</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Card animations and transitions</p>
            </div>
            <input
              type="checkbox"
              checked={settings.animationsEnabled}
              onChange={(e) => updateSetting('animationsEnabled', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Auto-Save</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Automatically save changes</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoSave}
              onChange={(e) => updateSetting('autoSave', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Save className="w-5 h-5" />
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
