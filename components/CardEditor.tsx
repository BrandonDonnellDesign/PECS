
import React, { useState, useRef } from 'react';
import { PecsCard, CARD_COLORS } from '../types';
import { generatePecsImage, suggestLabel } from '../services/gemini';
import { storageService } from '../services/supabase';
import ImageEditor from './ImageEditor';
import { Camera, Upload, Wand2, X, Loader2, Edit, Scissors } from 'lucide-react';

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
  const [mode, setMode] = useState<'upload' | 'generate' | 'camera'>('generate');
  const [showImageEditor, setShowImageEditor] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const generatedUrl = await generatePecsImage(prompt);
      if (generatedUrl) {
        setImageUrl(generatedUrl);
        if (!label) setLabel(prompt);
      }
    } catch (e) {
      alert("Failed to generate image. Please check your API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await storageService.uploadImage(file, userId);
      setImageUrl(url);
      
      // Auto-label feature
      if (!label && url.startsWith('data:')) {
         const suggested = await suggestLabel(url);
         setLabel(suggested);
      }
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
    setMode('generate');
  };

  const handleSave = () => {
    onSave({
      id: card?.id || crypto.randomUUID(),
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">{card ? 'Edit Card' : 'New PECS Card'}</h2>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Image Source */}
          <div className="space-y-6">
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button 
                onClick={() => { stopCamera(); setMode('generate'); }}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${mode === 'generate' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
              >
                <Wand2 className="w-4 h-4 inline mr-2" />
                AI
              </button>
              <button 
                onClick={() => { stopCamera(); setMode('upload'); }}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${mode === 'upload' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Upload
              </button>
              <button 
                onClick={startCamera}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${mode === 'camera' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
              >
                <Camera className="w-4 h-4 inline mr-2" />
                Cam
              </button>
            </div>

            <div className="min-h-[250px] bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-4 relative overflow-hidden">
              {imageUrl && mode !== 'camera' && (
                  <div className="absolute inset-0 z-10 bg-white flex items-center justify-center">
                      <img src={imageUrl} alt="selected" className="max-w-full max-h-full object-contain" />
                      <button 
                        onClick={() => setImageUrl('')}
                        className="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:bg-red-50 text-red-500"
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

              {mode === 'generate' && !imageUrl && (
                <div className="w-full space-y-3 z-0">
                  <label className="block text-sm font-medium text-gray-700">Describe the symbol</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g. eating apple"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                    <button 
                      onClick={handleGenerate}
                      disabled={isGenerating || !prompt}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                    >
                      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'upload' && !imageUrl && (
                <div className="text-center z-0">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                  <p className="mt-2 text-xs text-gray-400">Supports JPG, PNG</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Card Preview</label>
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
               <label className="block text-sm font-medium text-gray-700 mb-1">Label Text</label>
               <input 
                 type="text" 
                 value={label}
                 onChange={(e) => setLabel(e.target.value)}
                 className="w-full p-2 border rounded-lg"
                 placeholder="Enter card text..."
               />
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Color</label>
                <div className="flex gap-3">
                  {Object.entries(CARD_COLORS).map(([key, color]) => (
                    <button
                      key={key}
                      onClick={() => setBackgroundColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${backgroundColor === color ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                      title={key}
                    />
                  ))}
                </div>
             </div>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={!imageUrl || !label}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Card
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardEditor;
