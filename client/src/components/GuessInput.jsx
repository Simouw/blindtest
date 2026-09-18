import React, { useState, useEffect, useRef } from 'react';
import { Send, CheckCircle2, Lock, Flame } from 'lucide-react';

export default function GuessInput({
  onSubmitGuess,
  disabled = false,
  foundArtist = false,
  foundTitle = false,
  lastFeedback = null,
  roundActive = true
}) {
  const [guess, setGuess] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  const bothComplete = foundArtist && foundTitle;

  useEffect(() => {
    if (roundActive && !bothComplete && inputRef.current) {
      inputRef.current.focus();
    }
  }, [roundActive, bothComplete]);

  useEffect(() => {
    if (lastFeedback && !lastFeedback.correct) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [lastFeedback]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!guess.trim() || disabled || bothComplete || !roundActive) return;

    onSubmitGuess(guess);
    setGuess('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      {/* Answer Detection Status Badges */}
      <div className="flex items-center justify-center gap-3 text-xs">
        <div className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full border transition-all ${
          foundArtist
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold'
            : 'bg-[#151520] border-[#262638] text-slate-500'
        }`}>
          {foundArtist ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />}
          <span>Artist</span>
        </div>

        <div className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full border transition-all ${
          foundTitle
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold'
            : 'bg-[#151520] border-[#262638] text-slate-500'
        }`}>
          {foundTitle ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />}
          <span>Title</span>
        </div>

        {bothComplete && (
          <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Combo Bonus!</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className={`relative flex items-center rounded-2xl transition-all shadow-lg ${
          shake ? 'translate-x-[-3px]' : ''
        } ${
          bothComplete
            ? 'bg-emerald-950/20 border border-emerald-500/50'
            : 'bg-[#151520] border border-[#2a2a3c] focus-within:border-violet-500'
        }`}>
          <input
            ref={inputRef}
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            disabled={disabled || bothComplete || !roundActive}
            placeholder={
              bothComplete
                ? 'Everything found! Waiting for the timer...'
                : foundArtist
                ? 'Artist found! Now guess the Title...'
                : foundTitle
                ? 'Title found! Now guess the Artist...'
                : 'Track name / Artist...'
            }
            className="w-full py-3.5 pl-5 pr-14 bg-transparent text-slate-100 placeholder-slate-500 text-base rounded-2xl focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
          />

          <button
            type="submit"
            disabled={disabled || bothComplete || !guess.trim() || !roundActive}
            className={`absolute right-2 p-2 rounded-xl transition-all ${
              bothComplete
                ? 'bg-emerald-600/20 text-emerald-400'
                : guess.trim() && roundActive
                ? 'btn-primary text-white cursor-pointer active:scale-95 shadow'
                : 'bg-[#1e1e2d] text-slate-600 cursor-not-allowed border border-[#272738]'
            }`}
            title="Submit guess"
          >
            {bothComplete ? <Lock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>

      {/* Live Feedback Message */}
      {lastFeedback && (
        <div className={`text-center text-xs font-semibold ${
          lastFeedback.correct ? 'text-emerald-400' : 'text-slate-400'
        }`}>
          {lastFeedback.message}
        </div>
      )}
    </div>
  );
}
