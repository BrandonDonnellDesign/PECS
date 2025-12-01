import React, { useState, useRef } from 'react';
import { PecsCard, CARD_COLORS } from '../types';
import { storageService } from '../services/supabase';
import { generateUUID } from '../utils';
import ImageEditor from './ImageEditor';
import { Camera, Upload, Wand2, X, Loader2, Edit, Scissors, Smile } from 'lucide-react';

// Helper function to convert emoji to SVG data URL
function emojiToDataUrl(emoji: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><text x="50%" y="50%" font-size="120" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif">${emoji}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

interface CardEditorProps {
  card?: PecsCard;
  userId?: string;
  onSave: (card: PecsCard) => void;
  onCancel: () => void;
}

const CardEditor: React.FC<CardEditorProps> = ({ card, userId, onSave, onCancel }) => {
  const [label, setLabel] = useState(card?.label || '');
  const [imageUrl, setImageUrl] = useState(card?.imageUrl || '');
  const [backgroundColor, setBackgroundColor] = useState(card?.backgroundColor || CARD_COLORS.default);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'upload' | 'generate' | 'camera' | 'emoji'>('upload');
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Common emojis organized by category
  const emojiCategories = {
    'Smileys': ['😀', '😃', '😄', '😁', '😊', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓'],
    'Gestures': ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
    'People': ['👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👩‍🦱', '🧑‍🦱', '👨‍🦱', '👩‍🦰', '🧑‍🦰', '👨‍🦰', '👱‍♀️', '👱', '👱‍♂️', '👩‍🦳', '🧑‍🦳', '👨‍🦳', '👩‍🦲', '🧑‍🦲', '👨‍🦲', '🧔', '👵', '🧓', '👴', '👲', '👳‍♀️', '👳', '👳‍♂️', '🧕'],
    'Activities': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺', '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏊', '🤽', '🚣', '🧗', '🚴', '🚵', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🪘', '🎷', '🎺', '🪗', '🎸', '🪕', '🎻', '🎲', '♟', '🎯', '🎳', '🎮', '🎰', '🧩'],
    'Food': ['🍎', '🍏', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯'],
    'Drinks': ['🥛', '🍼', '☕', '🫖', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊', '💧'],
    'Nature': ['🌸', '💮', '🏵', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🪴', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🪹', '🪺', '🍄'],
    'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷', '🕸', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🪶', '🐓', '🦃', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊', '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🐿', '🦔'],
    'Transport': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵', '🏍', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩', '💺', '🛰', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥', '🛳', '⛴', '🚢', '⚓', '🪝', '⛽', '🚧', '🚦', '🚥', '🚏', '🗺', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟', '🎡', '🎢', '🎠', '⛲', '⛱', '🏖', '🏝'],
    'Objects': ['⌚', '📱', '📲', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙', '🎚', '🎛', '🧭', '⏱', '⏲', '⏰', '🕰', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯', '🪔', '🧯', '🛢', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '🪪', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧', '🔨', '⚒', '🛠', '⛏', '🪚', '🔩', '⚙️', '🪤', '🧱', '⛓', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡', '⚔️', '🛡', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡', '🧹', '🪠', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🪥', '🪒', '🧽', '🪣', '🧴', '🛎', '🔑', '🗝', '🚪', '🪑', '🛋', '🛏', '🛌', '🧸', '🪆', '🖼', '🪞', '🪟', '🛍', '🛒', '🎁', '🎈', '🎏', '🎀', '🪄', '🪅', '🎊', '🎉', '🎎', '🏮', '🎐', '🧧', '✉️', '📩', '📨', '📧', '💌', '📥', '📤', '📦', '🏷', '🪧', '📪', '📫', '📬', '📭', '📮', '📯', '📜', '📃', '📄', '📑', '🧾', '📊', '📈', '📉', '🗒', '🗓', '📆', '📅', '🗑', '📇', '🗃', '🗳', '🗄', '📋', '📁', '📂', '🗂', '🗞', '📰', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚', '📖', '🔖', '🧷', '🔗', '📎', '🖇', '📐', '📏', '🧮', '📌', '📍', '✂️', '🖊', '🖋', '✒️', '🖌', '🖍', '📝', '✏️', '🔍', '🔎', '🔏', '🔐', '🔒', '🔓'],
    'Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🛗', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '⚧', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸', '⏯', '⏹', '⏺', '⏭', '⏮', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '🟰', '♾', '💲', '💱', '™️', '©️', '®️', '〰️', '➰', '➿', '🔚', '🔙', '🔛', '🔝', '🔜', '✔️', '☑️', '🔘', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫', '🔈', '🔇', '🔉', '🔊', '🔔', '🔕', '📣', '📢', '👁‍🗨', '💬', '💭', '🗯', '♠️', '♣️', '♥️', '♦️', '🃏', '🎴', '🀄', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦', '🕧']
  };

  const handleEmojiSelect = (emoji: string) => {
    setImageUrl(emojiToDataUrl(emoji));
    if (!label) {
      setLabel(emoji);
    }
  };

  const filteredEmojis = emojiSearch
    ? Object.entries(emojiCategories).reduce((acc, [category, emojis]) => {
        const filtered = emojis.filter(e => e.includes(emojiSearch));
        if (filtered.length > 0) {
          acc[category] = filtered;
        }
        return acc;
      }, {} as Record<string, string[]>)
    : emojiCategories;

  // AI Generation disabled
  const handleGenerate = async () => { };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await storageService.uploadImage(file, userId);
      setImageUrl(url);

      // Auto-label feature (Disabled temporarily)
      /*
      if (!label && url.startsWith('data:')) {
         const suggested = await suggestLabel(url);
         setLabel(suggested);
      }
      */
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setMode('camera');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Could not access camera");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      const url = canvas.toDataURL('image/jpeg');
      setImageUrl(url);
      stopCamera();
    }
  };

  const stopCamera = () => {
    cameraStream?.getTracks().forEach(track => track.stop());
    setCameraStream(null);
    setMode('upload');
  };

  const handleSave = () => {
    onSave({
      id: card?.id || generateUUID(),
      label,
      imageUrl,
      backgroundColor,
    });
  };

  if (showImageEditor && imageUrl) {
    return (
      <ImageEditor
        imageUrl={imageUrl}
        onSave={(newUrl) => {
          setImageUrl(newUrl);
          setShowImageEditor(false);
        }}
        onCancel={() => setShowImageEditor(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-none sm:rounded-xl shadow-2xl w-full max-w-2xl h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto transition-colors duration-300 flex flex-col">
        <div className="flex justify-between items-center p-3 sm:p-6 border-b dark:border-gray-700 shrink-0">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">{card ? 'Edit Card' : 'New PECS Card'}</h2>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-3 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 overflow-y-auto flex-1">
          {/* Left Column: Image Source */}
          <div className="space-y-6">
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <button
                onClick={() => { stopCamera(); setMode('emoji'); }}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${mode === 'emoji' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
              >
                <Smile className="w-4 h-4 inline mr-2" />
                Emoji
              </button>
              <button
                onClick={() => { stopCamera(); setMode('upload'); }}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${mode === 'upload' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Upload
              </button>
              <button
                onClick={startCamera}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${mode === 'camera' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
              >
                <Camera className="w-4 h-4 inline mr-2" />
                Cam
              </button>
            </div>

            <div className="min-h-[250px] bg-gray-50 dark:bg-gray-900/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center p-4 relative overflow-hidden">
              {imageUrl && mode !== 'camera' && (
                <div className="absolute inset-0 z-10 bg-white dark:bg-gray-800 flex items-center justify-center">
                  <img src={imageUrl} alt="selected" className="max-w-full max-h-full object-contain" />
                  <button
                    onClick={() => setImageUrl('')}
                    className="absolute top-2 right-2 p-1 bg-white dark:bg-gray-700 rounded-full shadow hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                    title="Remove Image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowImageEditor(true)}
                    className="absolute bottom-2 right-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 flex items-center gap-1 text-sm font-medium"
                  >
                    <Scissors className="w-4 h-4" /> Edit
                  </button>
                </div>
              )}

              {mode === 'emoji' && !imageUrl && (
                <div className="w-full h-full overflow-y-auto z-0 p-2">
                  <input
                    type="text"
                    placeholder="Search emojis..."
                    value={emojiSearch}
                    onChange={(e) => setEmojiSearch(e.target.value)}
                    className="w-full p-2 mb-3 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                  <div className="space-y-3">
                    {Object.entries(filteredEmojis).map(([category, emojis]) => (
                      <div key={category}>
                        <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{category}</h3>
                        <div className="grid grid-cols-8 gap-1">
                          {emojis.map((emoji, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleEmojiSelect(emoji)}
                              className="text-2xl hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded p-1 transition-colors"
                              title={emoji}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mode === 'upload' && !imageUrl && (
                <div className="text-center z-0">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 dark:text-gray-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      dark:file:bg-blue-900/30 dark:file:text-blue-400
                      hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50"
                  />
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Supports JPG, PNG</p>
                </div>
              )}

              {mode === 'upload' && !imageUrl && (
                <div className="text-center z-0">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 dark:text-gray-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      dark:file:bg-blue-900/30 dark:file:text-blue-400
                      hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50"
                  />
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Supports JPG, PNG</p>
                </div>
              )}

              {mode === 'camera' && cameraStream && (
                <div className="absolute inset-0 z-20 bg-black flex flex-col items-center justify-center">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <button onClick={capturePhoto} className="absolute bottom-4 bg-white border-4 border-gray-300 rounded-full w-14 h-14 hover:scale-105 transition-transform"></button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Preview & Details */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Card Preview</label>
              <div
                className="w-40 h-40 mx-auto border-4 rounded-xl flex flex-col overflow-hidden shadow-sm"
                style={{ borderColor: backgroundColor, backgroundColor: 'white' }}
              >
                <div className="h-[75%] w-full flex items-center justify-center p-2 bg-white">
                  {imageUrl ? (
                    <img src={imageUrl} alt="preview" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-gray-300 text-xs text-center">No Image</span>
                  )}
                </div>
                <div
                  className="h-[25%] w-full flex items-center justify-center text-center font-bold text-sm uppercase px-1 leading-tight"
                  style={{ backgroundColor: backgroundColor, color: backgroundColor === '#FFFFFF' ? 'black' : 'black' }}
                >
                  {label || 'Label'}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Label Text</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter card text..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category Color</label>
              <div className="flex gap-3">
                {Object.entries(CARD_COLORS).map(([key, color]) => (
                  <button
                    key={key}
                    onClick={() => setBackgroundColor(color)}
                    className={`w-8 h-8 rounded-full border-2 ${backgroundColor === color ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    title={key}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 sm:rounded-b-xl flex justify-end gap-3 shrink-0">
          <button onClick={onCancel} className="px-3 py-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!imageUrl || !label}
            className="px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Card
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardEditor;
