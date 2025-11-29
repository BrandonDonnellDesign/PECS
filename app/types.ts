
export interface PecsCard {
  id: string;
  label: string;
  imageUrl: string;
  backgroundColor: string; // Hex code
  category?: 'noun' | 'verb' | 'adjective' | 'social';
}

export interface PecsBoard {
  id: string;
  userId?: string; // For auth
  title: string;
  gridColumns: number;
  gridGap: number; // New: Spacing between cards
  backgroundColor: string; // New: Board background
  cards: PecsCard[];
  updatedAt: number;
}

export interface GenerationConfig {
  prompt: string;
  style: 'cartoon' | 'realistic' | 'symbol';
}

export enum AppRoute {
  HOME = 'home',
  EDITOR = 'editor',
  PRINT = 'print',
  AUTH = 'auth'
}

export const CARD_COLORS = {
  noun: '#FDE047', // Yellow
  verb: '#4ADE80', // Green
  adjective: '#60A5FA', // Blue
  social: '#F472B6', // Pink
  default: '#FFFFFF' // White
};
