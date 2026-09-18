import React from 'react';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';

export default function VolumeControl({ volume, isMuted, onVolumeChange, onToggleMute }) {
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl card-panel shadow-sm">
      <button
        onClick={onToggleMute}
        className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
        title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
      >
        <VolumeIcon className="w-4 h-4 text-mauve-400" />
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={isMuted ? 0 : volume}
        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        className="w-20 h-1.5 bg-[#191925] rounded-full appearance-none cursor-pointer accent-[#8b5cf6] focus:outline-none"
        title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
      />
      <span className="text-xs font-semibold text-neutral-300 w-8 text-right tabular-nums">
        {Math.round((isMuted ? 0 : volume) * 100)}%
      </span>
    </div>
  );
}
