import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
export default function VolumeControl({ volume, isMuted, onVolumeChange, onToggleMute }) {
  const Icon = isMuted || volume === 0 ? VolumeX : Volume2;
  return <div className="volume-control">
    <button className="icon-button" data-slot="toggle" onClick={onToggleMute} aria-label={isMuted || volume === 0 ? 'Unmute music' : 'Mute music'} aria-pressed={isMuted || volume === 0}><Icon size={19} /></button>
    <input aria-label="Music volume" data-slot="slider-track" aria-valuenow={isMuted ? 0 : volume} type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={e => onVolumeChange(Number(e.target.value))} />
  </div>;
}
