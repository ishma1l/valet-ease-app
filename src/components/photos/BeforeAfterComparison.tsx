import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Camera, ArrowLeftRight } from "lucide-react";

interface BeforeAfterComparisonProps {
  beforeUrl: string;
  afterUrl: string;
}

const BeforeAfterComparison = ({ beforeUrl, afterUrl }: BeforeAfterComparisonProps) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  }, [updatePosition]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    updatePosition(e.clientX);
  }, [updatePosition]);

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden select-none touch-none cursor-ew-resize"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* After (background) */}
      <img src={afterUrl} alt="After" className="absolute inset-0 w-full h-full object-cover" draggable={false} />

      {/* Before (clipped) */}
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
        <img src={beforeUrl} alt="Before" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      </div>

      {/* Slider line */}
      <div className="absolute top-0 bottom-0" style={{ left: `${sliderPos}%` }}>
        <div className="absolute top-0 bottom-0 -translate-x-1/2 w-0.5 bg-white shadow-lg" />
        <motion.div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center z-10"
          whileTap={{ scale: 0.9 }}
        >
          <ArrowLeftRight size={16} className="text-foreground" />
        </motion.div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 bg-foreground/80 backdrop-blur-sm text-background text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
        Before
      </div>
      <div className="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
        After
      </div>
    </div>
  );
};

interface PhotoUploadButtonProps {
  label: string;
  photoUrl?: string;
  onUpload: (file: File) => void;
  uploading?: boolean;
}

export const PhotoUploadButton = ({ label, photoUrl, onUpload, uploading }: PhotoUploadButtonProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full rounded-xl overflow-hidden border border-border bg-card transition-all disabled:opacity-50"
      >
        {photoUrl ? (
          <div className="relative">
            <img src={photoUrl} alt={label} className="w-full aspect-[4/3] object-cover" />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">{label}</span>
            </div>
          </div>
        ) : (
          <div className="aspect-[4/3] flex flex-col items-center justify-center gap-2 text-muted-foreground">
            {uploading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 rounded-full border-2 border-muted border-t-foreground" />
            ) : (
              <Camera size={24} />
            )}
            <span className="text-xs font-bold">{uploading ? "Uploading…" : label}</span>
          </div>
        )}
      </motion.button>
    </div>
  );
};

export default BeforeAfterComparison;
