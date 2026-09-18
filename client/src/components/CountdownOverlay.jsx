import React from 'react';
import { Sparkles } from 'lucide-react';

export default function CountdownOverlay({ countdown, currentRound, totalRounds }) {
  if (countdown === null || countdown <= 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="card-panel max-w-sm w-full mx-4 p-8 rounded-3xl text-center space-y-5 border border-mauve-500/30 shadow-2xl shadow-black/60">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-mauve-500/15 border border-mauve-500/30 text-xs font-bold text-mauve-300 uppercase tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-mauve-400" />
          <span>Round {currentRound} of {totalRounds}</span>
        </div>

        <div className="py-2">
          <div className="w-28 h-28 mx-auto rounded-full bg-[#181824] border-2 border-mauve-500/60 flex items-center justify-center shadow-xl shadow-mauve-500/10">
            <span 
              key={countdown} 
              className="text-6xl font-black text-white tabular-nums tracking-tighter animate-pulse"
            >
              {countdown}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-white tracking-tight">
            Get Ready to Listen!
          </h3>
          <p className="text-neutral-400 text-xs font-medium">
            Type the artist and track title as fast as you can.
          </p>
        </div>
      </div>
    </div>
  );
}
