
import React, { useState, useRef, useEffect } from 'react';
import { X, Check, RotateCw, ZoomIn, ZoomOut, Sun, Contrast } from 'lucide-react';

interface ImageEditorProps {
  imageUrl: string;
  onSave: (newUrl: string) => void;
  onCancel: () => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ imageUrl, onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => setImageObj(img);
  }, [imageUrl]);

  // Draw to canvas
  useEffect(() => {
    if (!imageObj || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fill white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // Move to center
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // Apply transformations
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(position.x, position.y);
    
    // Apply filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    // Draw image centered
    ctx.drawImage(
      imageObj,
      -imageObj.width / 2,
      -imageObj.height / 2
    );

    ctx.restore();
  }, [imageObj, scale, rotation, brightness, contrast, position]);

  const handleSave = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
    onSave(dataUrl);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x * scale, y: e.clientY - position.y * scale });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    // We adjust position relative to scale so it feels 1:1 with mouse movement
    setPosition({
      x: (e.clientX - dragStart.x) / scale,
      y: (e.clientY - dragStart.y) / scale
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
        
        {/* Canvas Area */}
        <div className="flex-1 bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
          <canvas
            ref={canvasRef}
            width={500}
            height={500}
            className="bg-white shadow-lg cursor-move max-w-full max-h-full object-contain"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          <div className="absolute top-4 left-4 text-white text-xs bg-black/50 px-2 py-1 rounded">
            Drag to pan • Scroll to zoom
          </div>
        </div>

        {/* Controls */}
        <div className="w-full md:w-80 bg-white p-6 flex flex-col gap-6 overflow-y-auto border-l">
          <div className="flex justify-between items-center border-b pb-4">
            <h3 className="font-bold text-lg">Edit Image</h3>
            <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2 mb-2">
                <RotateCw className="w-3 h-3" /> Rotation
              </label>
              <div className="flex gap-2">
                 <button onClick={() => setRotation(r => r - 90)} className="flex-1 bg-gray-100 hover:bg-gray-200 py-2 rounded text-sm">-90°</button>
                 <button onClick={() => setRotation(0)} className="flex-1 bg-gray-100 hover:bg-gray-200 py-2 rounded text-sm">Reset</button>
                 <button onClick={() => setRotation(r => r + 90)} className="flex-1 bg-gray-100 hover:bg-gray-200 py-2 rounded text-sm">+90°</button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2 mb-2">
                <ZoomIn className="w-3 h-3" /> Zoom
              </label>
              <input 
                type="range" 
                min="0.1" 
                max="3" 
                step="0.1" 
                value={scale} 
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2 mb-2">
                <Sun className="w-3 h-3" /> Brightness ({brightness}%)
              </label>
              <input 
                type="range" 
                min="0" 
                max="200" 
                value={brightness} 
                onChange={(e) => setBrightness(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2 mb-2">
                <Contrast className="w-3 h-3" /> Contrast ({contrast}%)
              </label>
              <input 
                type="range" 
                min="0" 
                max="200" 
                value={contrast} 
                onChange={(e) => setContrast(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div className="mt-auto pt-4 border-t flex gap-2">
            <button onClick={onCancel} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button onClick={handleSave} className="flex-1 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center justify-center gap-2">
              <Check className="w-4 h-4" /> Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
