import { PecsBoard } from './types';

export function generateUUID(): string {
  return crypto.randomUUID();
}

// Export board to JSON file
export function exportBoard(board: PecsBoard): void {
  const dataStr = JSON.stringify(board, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${board.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Import board from JSON file
export function importBoard(file: File): Promise<PecsBoard> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const board = JSON.parse(e.target?.result as string) as PecsBoard;
        // Validate basic structure
        if (!board.id || !board.title || !Array.isArray(board.cards)) {
          throw new Error('Invalid board format');
        }
        // Generate new IDs to avoid conflicts
        board.id = generateUUID();
        board.cards = board.cards.map(card => ({
          ...card,
          id: generateUUID()
        }));
        board.updatedAt = Date.now();
        resolve(board);
      } catch (error) {
        reject(new Error('Failed to parse board file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// Text-to-Speech for card labels
export function speakText(text: string, lang: string = 'en-US'): void {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    window.speechSynthesis.speak(utterance);
  }
}

// Stop any ongoing speech
export function stopSpeech(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// History management for undo/redo
export class BoardHistory {
  private history: PecsBoard[] = [];
  private currentIndex: number = -1;
  private maxHistory: number = 50;

  push(board: PecsBoard): void {
    // Remove any future history if we're not at the end
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // Add new state
    this.history.push(JSON.parse(JSON.stringify(board))); // Deep clone
    
    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  undo(): PecsBoard | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    return null;
  }

  redo(): PecsBoard | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    return null;
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  initialize(board: PecsBoard): void {
    this.clear();
    this.push(board);
  }
}
