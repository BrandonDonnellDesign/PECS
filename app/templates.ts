import { PecsBoard, PecsCard, CARD_COLORS } from './types';

export interface BoardTemplate {
  id: string;
  name: string;
  description: string;
  category: 'daily' | 'emotions' | 'food' | 'activities' | 'social';
  icon: string;
  cards: Omit<PecsCard, 'id'>[];
}

// Helper function to convert emoji to SVG data URL
function emojiToDataUrl(emoji: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><text x="50%" y="50%" font-size="120" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif">${emoji}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: 'daily-routine',
    name: 'Daily Routine',
    description: 'Common daily activities and routines',
    category: 'daily',
    icon: '🏠',
    cards: [
      { label: 'Wake Up', imageUrl: emojiToDataUrl('🌅'), backgroundColor: CARD_COLORS.verb, category: 'verb' },
      { label: 'Breakfast', imageUrl: emojiToDataUrl('🍳'), backgroundColor: CARD_COLORS.noun, category: 'noun' },
      { label: 'Brush Teeth', imageUrl: emojiToDataUrl('🪥'), backgroundColor: CARD_COLORS.verb, category: 'verb' },
      { label: 'Get Dressed', imageUrl: emojiToDataUrl('👕'), backgroundColor: CARD_COLORS.verb, category: 'verb' },
      { label: 'School', imageUrl: emojiToDataUrl('🏫'), backgroundColor: CARD_COLORS.noun, category: 'noun' },
      { label: 'Lunch', imageUrl: emojiToDataUrl('🍱'), backgroundColor: CARD_COLORS.noun, category: 'noun' },
      { label: 'Play', imageUrl: emojiToDataUrl('🎮'), backgroundColor: CARD_COLORS.verb, category: 'verb' },
      { label: 'Dinner', imageUrl: emojiToDataUrl('🍽️'), backgroundColor: CARD_COLORS.noun, category: 'noun' },
      { label: 'Bath', imageUrl: emojiToDataUrl('🛁'), backgroundColor: CARD_COLORS.verb, category: 'verb' },
      { label: 'Bedtime', imageUrl: emojiToDataUrl('🛏️'), backgroundColor: CARD_COLORS.verb, category: 'verb' }
    ]
  },
  {
    id: 'emotions',
    name: 'Feelings & Emotions',
    description: 'Express different emotions and feelings',
    category: 'emotions',
    icon: '😊',
    cards: [
      { label: 'Happy', imageUrl: emojiToDataUrl('😊'), backgroundColor: CARD_COLORS.adjective, category: 'adjective' },
      { label: 'Sad', imageUrl: emojiToDataUrl('😢'), backgroundColor: CARD_COLORS.adjective, category: 'adjective' },
      { label: 'Angry', imageUrl: emojiToDataUrl('😠'), backgroundColor: CARD_COLORS.adjective, category: 'adjective' },
      { label: 'Scared', imageUrl: emojiToDataUrl('😨'), backgroundColor: CARD_COLORS.adjective, category: 'adjective' },
      { label: 'Excited', imageUrl: emojiToDataUrl('🤩'), backgroundColor: CARD_COLORS.adjective, category: 'adjective' },
      { label: 'Tired', imageUrl: emojiToDataUrl('😴'), backgroundColor: CARD_COLORS.adjective, category: 'adjective' },
      { label: 'Hungry', imageUrl: emojiToDataUrl('🤤'), backgroundColor: CARD_COLORS.adjective, category: 'adjective' },
      { label: 'Thirsty', imageUrl: emojiToDataUrl('🥤'), backgroundColor: CARD_COLORS.adjective, category: 'adjective' }
    ]
  },
  {
    id: 'food-drinks',
    name: 'Food & Drinks',
    description: 'Common foods and beverages',
    category: 'food',
    icon: '🍎',
    cards: [
      { label: 'Apple', imageUrl: emojiToDataUrl('🍎'), backgroundColor: CARD_COLORS.noun, category: 'noun' },
      { label: 'Banana', imageUrl: emojiToDataUrl('🍌'), backgroundColor: CARD_COLORS.noun, category: 'noun' },
      { label: 'Bread', imageUrl: emojiToDataUrl('🍞'), backgroundColor: CARD_COLORS.noun, category: 'noun' },
      { label: 'Milk', imageUrl: emojiToDataUrl('🥛'), backgroundColor: CARD_COLORS.noun, category: 'noun' },
      { label: 'Water', imageUrl: emojiToDataUrl('💧'), backgroundColor: CARD_COLORS.noun, category: 'noun' },
      { label: 'Juice', imageUrl: emojiToDataUrl('🧃'), backgroundColor: CARD_COLORS.noun, category: 'noun' },
      { label: 'Pizza', imageUrl: emojiToDataUrl('🍕'), backgroundColor: CARD_COLORS.noun, category: 'noun' },
      { label: 'Cookie', imageUrl: emojiToDataUrl('🍪'), backgroundColor: CARD_COLORS.noun, category: 'noun' }
    ]
  },
  {
    id: 'social-phrases',
    name: 'Social Phrases',
    description: 'Common social interactions and greetings',
    category: 'social',
    icon: '👋',
    cards: [
      { label: 'Hello', imageUrl: emojiToDataUrl('👋'), backgroundColor: CARD_COLORS.social, category: 'social' },
      { label: 'Goodbye', imageUrl: emojiToDataUrl('👋'), backgroundColor: CARD_COLORS.social, category: 'social' },
      { label: 'Please', imageUrl: emojiToDataUrl('🙏'), backgroundColor: CARD_COLORS.social, category: 'social' },
      { label: 'Thank You', imageUrl: emojiToDataUrl('🙏'), backgroundColor: CARD_COLORS.social, category: 'social' },
      { label: 'Yes', imageUrl: emojiToDataUrl('✅'), backgroundColor: CARD_COLORS.social, category: 'social' },
      { label: 'No', imageUrl: emojiToDataUrl('❌'), backgroundColor: CARD_COLORS.social, category: 'social' },
      { label: 'Help', imageUrl: emojiToDataUrl('🆘'), backgroundColor: CARD_COLORS.social, category: 'social' },
      { label: 'Stop', imageUrl: emojiToDataUrl('🛑'), backgroundColor: CARD_COLORS.social, category: 'social' }
    ]
  },
  {
    id: 'activities',
    name: 'Activities & Play',
    description: 'Fun activities and playtime options',
    category: 'activities',
    icon: '⚽',
    cards: [
      { label: 'Read', imageUrl: emojiToDataUrl('📚'), backgroundColor: CARD_COLORS.verb, category: 'verb' },
      { label: 'Draw', imageUrl: emojiToDataUrl('🎨'), backgroundColor: CARD_COLORS.verb, category: 'verb' },
      { label: 'Music', imageUrl: emojiToDataUrl('🎵'), backgroundColor: CARD_COLORS.noun, category: 'noun' },
      { label: 'Outside', imageUrl: emojiToDataUrl('🌳'), backgroundColor: CARD_COLORS.noun, category: 'noun' },
      { label: 'Swing', imageUrl: emojiToDataUrl('🎪'), backgroundColor: CARD_COLORS.verb, category: 'verb' },
      { label: 'Ball', imageUrl: emojiToDataUrl('⚽'), backgroundColor: CARD_COLORS.noun, category: 'noun' },
      { label: 'Bike', imageUrl: emojiToDataUrl('🚲'), backgroundColor: CARD_COLORS.noun, category: 'noun' },
      { label: 'TV', imageUrl: emojiToDataUrl('📺'), backgroundColor: CARD_COLORS.noun, category: 'noun' }
    ]
  }
];

export function createBoardFromTemplate(template: BoardTemplate, userId?: string): PecsBoard {
  return {
    id: crypto.randomUUID(),
    userId,
    title: template.name,
    gridColumns: 4,
    gridGap: 16,
    backgroundColor: '#ffffff',
    cards: template.cards.map(card => ({
      ...card,
      id: crypto.randomUUID()
    })),
    updatedAt: Date.now()
  };
}
