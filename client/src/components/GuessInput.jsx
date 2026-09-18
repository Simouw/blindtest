import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';

export default function GuessInput({ onSubmitGuess, disabled, foundArtist, foundTitle, lastFeedback, roundActive, roundKey, passed }) {
  const [guess, setGuess] = useState('');
  const input = useRef(null);
  const deck = useRef(null);
  const complete = foundArtist && foundTitle;
  useEffect(() => {
    setGuess('');
    if (roundActive && document.activeElement?.getAttribute('aria-label') !== 'Room message') input.current?.focus({ preventScroll: true });
  }, [roundKey, roundActive]);
  useEffect(() => {
    if (!lastFeedback || !deck.current) return;
    const node = deck.current;
    node.removeAttribute('data-success');
    node.removeAttribute('aria-invalid');
    const frame = requestAnimationFrame(() => node.setAttribute(lastFeedback.correct ? 'data-success' : 'aria-invalid', 'true'));
    const timer = setTimeout(() => {
      node.removeAttribute('data-success');
      node.removeAttribute('aria-invalid');
    }, 700);
    return () => { cancelAnimationFrame(frame); clearTimeout(timer); };
  }, [lastFeedback]);
  const locked = disabled || complete || passed || !roundActive;
  const unlocked = lastFeedback?.unlockedTypes || [];
  const feedbackTitle = lastFeedback?.correct
    ? lastFeedback.bothComplete
      ? 'Artist + title locked'
      : `${unlocked[0] || (lastFeedback.foundArtist ? 'artist' : 'title')} locked`
    : 'Not a match';
  return <div ref={deck} className={'guess-deck ' + (lastFeedback ? lastFeedback.correct ? 'feedback-correct' : 'feedback-wrong' : '')}>
    <div className="answer-progress">
      <span className={foundArtist ? 'found' : ''}><i>{foundArtist && <Check size={12} />}</i>Artist</span>
      <span className={foundTitle ? 'found' : ''}><i>{foundTitle && <Check size={12} />}</i>Title</span>
      {complete && <span className="combo">+250 combo</span>}
    </div>
    <form onSubmit={e => { e.preventDefault(); if (!locked && guess.trim()) { onSubmitGuess(guess.trim()); setGuess(''); input.current?.focus(); } }}>
      <label className="sr-only" htmlFor="guess">Your guess</label>
      <div className={'guess-field ' + (complete ? 'complete' : '')}>
        <input ref={input} id="guess" value={guess} onChange={e => setGuess(e.target.value)} readOnly={locked} aria-disabled={locked}
          data-slot="guess-input"
          autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} maxLength={200}
          placeholder={complete ? 'Both found. Nicely done.' : passed ? 'Passed. Listen for the next one.' : !roundActive ? 'Your next song is coming…' : foundArtist ? 'Now, what’s the title?' : foundTitle ? 'Who’s the artist?' : 'Type the artist or song title…'} />
        <button aria-label="Submit guess" data-slot="button" type="submit" disabled={locked || !guess.trim()}><ArrowRight size={20} /></button>
      </div>
    </form>
    <div className="feedback-row" role="status" aria-live="polite">
      {lastFeedback && <span key={lastFeedback.feedbackId} className={'feedback-burst ' + (lastFeedback.correct ? 'correct' : 'wrong')}>
        <span className="feedback-mark">{lastFeedback.correct ? <Check size={18} /> : <X size={18} />}</span>
        <strong>{feedbackTitle}</strong>
        {lastFeedback.correct && <em>+{lastFeedback.pointsAwarded}</em>}
      </span>}
      {!lastFeedback && <span className="key-hint">Enter <kbd>↵</kbd></span>}
    </div>
  </div>;
}
