# New Features Added to PECS Creator

## 🎉 Major Improvements

### 1. **Undo/Redo Functionality** ⏪⏩
- **Keyboard Shortcuts**: 
  - `Ctrl+Z` (or `Cmd+Z` on Mac) to undo
  - `Ctrl+Y` or `Ctrl+Shift+Z` to redo
- **Visual Buttons**: Undo/Redo buttons in the board toolbar
- **History Tracking**: Tracks up to 50 changes per board
- **What's Tracked**:
  - Adding/editing/deleting cards
  - Reordering cards (drag & drop)
  - Changing board settings (colors, grid layout)

### 2. **Export/Import Boards** 📥📤
- **Export**: Download any board as a JSON file for backup or sharing
  - Click the download icon on any board card
  - File includes all cards, images, and settings
- **Import**: Load boards from JSON files
  - Click "Import Board" button on home screen
  - Automatically generates new IDs to avoid conflicts
  - Preserves all card data and settings

### 3. **Text-to-Speech (TTS)** 🔊
- **Click to Speak**: Click on any card image to hear the label spoken aloud
- **Natural Voices**: Automatically selects the best quality voice available
  - Prioritizes: Google > Microsoft Natural > Apple > Default
  - Optimized speech rate (0.85x) for clarity
- **Visual Feedback**: 
  - Volume icon appears on hover
  - Blue pulse animation when speaking
- **Accessibility**: Helps with learning and pronunciation
- **Browser-based**: Uses built-in Web Speech API (no internet required)
- **Smart Voice Selection**: Automatically picks the most natural-sounding voice

### 4. **Emoji Support** 😊
- **Emoji Picker**: New "Emoji" tab in card editor
- **10+ Categories**: 
  - Smileys & Emotions
  - Gestures & Hands
  - People
  - Activities & Sports
  - Food & Drinks
  - Nature & Plants
  - Animals
  - Transport & Places
  - Objects
  - Symbols
- **Search**: Quickly find emojis with search bar
- **Auto-convert**: Emojis converted to SVG for consistent display
- **No Upload Needed**: Create cards instantly without photos

### 5. **Improved Print Layout** 🖨️
- **Optimized for A4 Landscape**: Better use of paper space
- **Color Preservation**: Ensures card colors print correctly
- **No Page Breaks**: Cards won't split across pages
- **Better Spacing**: Improved margins and gaps for cutting
- **Print Settings Tip**: Enable "Background Graphics" in printer settings

## 🎨 Existing Features (Reminder)

- **Family Groups**: Share boards with family members
- **Real-time Sync**: Changes sync across devices
- **5 Templates**: Pre-made boards (Daily Routine, Emotions, Food, Social, Activities)
- **Dark Mode**: Easy on the eyes
- **PWA Support**: Install as mobile app
- **Drag & Drop**: Reorder cards easily
- **Custom Colors**: Category-based color coding
- **Camera Support**: Take photos directly in the app
- **Image Editing**: Crop and adjust images
- **Duplicate Boards**: Quick copy for variations
- **Search**: Find boards quickly
- **Keyboard Shortcuts**: 
  - `Ctrl+N`: New board
  - `Ctrl+K`: Focus search
  - `Escape`: Close modals

## 🚀 How to Use New Features

### Undo/Redo
1. Make changes to your board
2. Press `Ctrl+Z` to undo or click the undo button
3. Press `Ctrl+Y` to redo or click the redo button

### Export a Board
1. Hover over any board card on the home screen
2. Click the download icon (green)
3. File saves to your Downloads folder

### Import a Board
1. Click "Import Board" on the home screen
2. Select a `.json` file
3. Board appears in your list

### Use Text-to-Speech
1. Open any board in editor mode
2. Click on a card's image area
3. Hear the label spoken aloud with natural voice
4. Watch for blue pulse animation while speaking
5. Click again to repeat

### Add Emoji Cards
1. Click "Add Card" in board editor
2. Select "Emoji" tab
3. Browse or search for an emoji
4. Click to select
5. Add label and save

### Print Boards
1. Open a board
2. Click the print icon
3. In print dialog, enable "Background Graphics"
4. Print or save as PDF

## 💡 Tips

- **Backup Important Boards**: Export them regularly
- **Share with Others**: Export and send JSON files via email
- **Quick Card Creation**: Use emojis for instant cards
- **Learn Pronunciation**: Use TTS to help with learning
- **Undo Mistakes**: Don't worry about errors, just undo!
- **Print Multiple Copies**: Great for classroom or therapy settings

## 🔧 Technical Details

### Export Format
Boards are exported as JSON with this structure:
```json
{
  "id": "unique-id",
  "title": "Board Name",
  "cards": [...],
  "gridColumns": 4,
  "backgroundColor": "#ffffff",
  "updatedAt": 1234567890
}
```

### Browser Compatibility
- **Undo/Redo**: All modern browsers
- **Export/Import**: All modern browsers
- **TTS**: All modern browsers with varying quality:
  - **Chrome/Edge**: Excellent (Google voices)
  - **Safari**: Very good (Apple voices)
  - **Firefox**: Good (eSpeak voices)
  - Best experience on Chrome/Edge
- **Emoji**: All modern browsers

### Performance
- History limited to 50 changes to prevent memory issues
- Export/Import handles boards of any size
- TTS uses browser's native voices (no API calls)

## 🐛 Known Limitations

- **TTS Voices**: Quality varies by browser and OS (best on Chrome/Edge)
- **TTS Languages**: Currently optimized for English
- **TTS Initialization**: May take 1-2 seconds on first page load
- **History**: Cleared when switching boards or refreshing page
- **Export**: Images embedded as data URLs (large file sizes possible)

## 📝 Future Enhancements (Potential)

- Board folders/tags for organization
- Bulk card operations (select multiple)
- Card categories filter
- Shareable read-only links
- More TTS language options
- Export to PDF with print layout
- Import from other PECS formats

---

**Enjoy the new features!** 🎊
