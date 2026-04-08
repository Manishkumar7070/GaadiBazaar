import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Rotate3d, MoveHorizontal } from 'lucide-react';

interface ThreeSixtyViewerProps {
  images: string[];
}

const ThreeSixtyViewer: React.FC<ThreeSixtyViewerProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    startX.current = clientX;
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    
    const diff = startX.current - clientX;
    const sensitivity = 15; // pixels per image change
    
    if (Math.abs(diff) > sensitivity) {
      const direction = diff > 0 ? 1 : -1;
      const newIndex = (currentIndex + direction + images.length) % images.length;
      setCurrentIndex(newIndex);
      startX.current = clientX;
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-slate-100 rounded-[2rem] overflow-hidden cursor-grab active:cursor-grabbing select-none"
      onMouseDown={(e) => handleStart(e.clientX)}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
    >
      <img 
        src={images[currentIndex]} 
        alt={`360 view frame ${currentIndex}`}
        className="w-full h-full object-cover pointer-events-none"
        referrerPolicy="no-referrer"
      />
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="bg-black/20 backdrop-blur-sm p-4 rounded-full text-white flex flex-col items-center gap-1">
          <Rotate3d size={32} />
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
            <MoveHorizontal size={12} /> Drag to Rotate
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 px-3 py-2 bg-black/20 backdrop-blur-md rounded-full">
        {images.map((_, i) => (
          <div 
            key={i} 
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-primary scale-125' : 'bg-white/40'}`} 
          />
        ))}
      </div>
    </div>
  );
};

export default ThreeSixtyViewer;
