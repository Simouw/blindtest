import React from 'react';
import { Calendar, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export default function RevealCard({ revealedData }) {
  if (!revealedData || !revealedData.track) return null;

  const { track, roundIndex, totalRounds, reason } = revealedData;

  return (
    <div className="w-full max-w-lg mx-auto card-panel p-6 md:p-8 rounded-3xl text-center space-y-5 shadow-2xl shadow-black/50 border border-mauve-500/20 animate-fadeIn">
      {/* Eyebrow Pill */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-mauve-500/15 border border-mauve-500/30 text-xs font-bold text-mauve-300 uppercase tracking-wide">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Round {roundIndex} of {totalRounds} • Track Reveal</span>
      </div>

      {/* Album Artwork */}
      <div className="relative w-48 h-48 md:w-56 md:h-56 mx-auto">
        <img
          src={track.artworkUrl}
          alt={`${track.artist} - ${track.title}`}
          className="w-full h-full object-cover rounded-2xl border border-white/10 shadow-2xl"
        />
        {track.year && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-xs font-bold text-white shadow-md flex items-center gap-1">
            <Calendar className="w-3 h-3 text-neutral-400" />
            <span>{track.year}</span>
          </div>
        )}
      </div>

      {/* Track & Artist */}
      <div className="space-y-1">
        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-snug">
          {track.title}
        </h2>
        <p className="text-base md:text-xl font-bold text-mauve-400">
          {track.artist}
        </p>
      </div>

      {/* Round End Reason */}
      <div className="pt-2 border-t border-[#232332] flex items-center justify-center">
        {reason === 'all_found' ? (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>All players found it!</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#191925] text-neutral-400 border border-[#252536] text-xs font-medium">
            <Clock className="w-4 h-4" />
            <span>Time expired</span>
          </div>
        )}
      </div>

      <div className="text-xs text-neutral-500 font-medium">
        Next track starting soon...
      </div>
    </div>
  );
}
