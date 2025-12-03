export enum AppRoute {
  HOME = 'home',
  EDITOR = 'editor',
  PRINT = 'print',
  FAMILY = 'family',
  ANALYTICS = 'analytics',
  SETTINGS = 'settings'
}

export interface PecsCard {
  id: string;
  label: string;
  imageUrl: string;
  backgroundColor: string;
  category?: 'noun' | 'verb' | 'adjective' | 'social';
  audioUrl?: string; // For custom voice recordings
  usageCount?: number; // Track how many times clicked
  lastUsed?: number; // Timestamp of last use
}

export interface PecsBoard {
  id: string;
  userId?: string;
  familyGroupId?: string | null;
  title: string;
  gridColumns: number;
  gridGap: number;
  backgroundColor: string;
  cards: PecsCard[];
  updatedAt: number;
  theme?: string; // Theme name
  schedule?: BoardSchedule; // Scheduling settings
}

export interface BoardSchedule {
  enabled: boolean;
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  days?: number[]; // 0-6 (Sunday-Saturday)
}

export interface Theme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  background: string;
  text: string;
  cardBorder: string;
}

export interface CardUsageStats {
  cardId: string;
  label: string;
  usageCount: number;
  lastUsed: number;
  category?: string;
}

export interface BoardAnalytics {
  boardId: string;
  totalClicks: number;
  uniqueCards: number;
  mostUsedCards: CardUsageStats[];
  usageByCategory: Record<string, number>;
  usageByDay: Record<string, number>;
  averageSessionLength: number;
}

export const CARD_COLORS = {
  noun: '#FFD700',
  verb: '#90EE90',
  adjective: '#87CEEB',
  social: '#FFB6C1',
  default: '#FFFFFF'
};

export const THEMES: Theme[] = [
  {
    id: 'default',
    name: 'Default Blue',
    primary: '#2563eb',
    secondary: '#3b82f6',
    background: '#ffffff',
    text: '#1f2937',
    cardBorder: '#e5e7eb'
  },
  {
    id: 'ocean',
    name: 'Ocean',
    primary: '#0891b2',
    secondary: '#06b6d4',
    background: '#ecfeff',
    text: '#164e63',
    cardBorder: '#a5f3fc'
  },
  {
    id: 'forest',
    name: 'Forest',
    primary: '#059669',
    secondary: '#10b981',
    background: '#f0fdf4',
    text: '#064e3b',
    cardBorder: '#bbf7d0'
  },
  {
    id: 'sunset',
    name: 'Sunset',
    primary: '#ea580c',
    secondary: '#f97316',
    background: '#fff7ed',
    text: '#7c2d12',
    cardBorder: '#fed7aa'
  },
  {
    id: 'lavender',
    name: 'Lavender',
    primary: '#7c3aed',
    secondary: '#8b5cf6',
    background: '#faf5ff',
    text: '#4c1d95',
    cardBorder: '#ddd6fe'
  },
  {
    id: 'rose',
    name: 'Rose',
    primary: '#e11d48',
    secondary: '#f43f5e',
    background: '#fff1f2',
    text: '#881337',
    cardBorder: '#fecdd3'
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    primary: '#3b82f6',
    secondary: '#60a5fa',
    background: '#1f2937',
    text: '#f9fafb',
    cardBorder: '#374151'
  }
];

export interface FamilyGroup {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMember {
  id: string;
  familyGroupId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyGroupWithMembers extends FamilyGroup {
  members: (FamilyMember & { profile?: Profile })[];
}

export interface UserSettings {
  userId: string;
  language: string;
  ttsVoice?: string;
  ttsRate: number;
  animationsEnabled: boolean;
  theme: string;
  autoSave: boolean;
}
