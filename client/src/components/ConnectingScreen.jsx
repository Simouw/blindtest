import React, { useEffect, useState } from 'react';
import { ArrowUpRight, RefreshCw, Volume2 } from 'lucide-react';
import BrandMark from './BrandMark';
import { SoundToggle } from './ui/sound';

export default function ConnectingScreen({ isPreview = false }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const exitPreview = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('preview');
    window.location.href = url.pathname + (url.search ? url.search : '');
  };

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 10-step progress matching the 10-round progress bars in GameRoom
  const progressStep = Math.min(10, Math.floor(seconds / 3) + 1);

  return (
    <div className="page connecting-page">
      <header className="site-header">
        <a className="brand" href="./" aria-label="Blindtest home" data-slot="brand-link">
          <BrandMark />
          <span>blindtest<span className="brand-dot">.</span></span>
        </a>
        <div className="header-tools">
          <span className="connection-state"><i />Connecting</span>
          <SoundToggle />
        </div>
      </header>

      <main>
        <div className="play-stage connecting-stage" aria-label="Server initialization">
          <div className="stage-topline">
            <div className="stage-meta">
              <span>Server wake-up in progress</span>
              <strong>{formatTime(seconds)} <small>elapsed</small></strong>
            </div>
            <div className="round-progress" aria-hidden="true">
              {Array.from({ length: 10 }, (_, i) => (
                <span
                  key={i}
                  className={i < progressStep ? 'done' : i === progressStep ? 'current' : ''}
                />
              ))}
            </div>
          </div>

          <div className="stage-content">
            <div className="waiting-content">
              <div className="stage-symbol">
                <BrandMark />
              </div>
              <p className="eyebrow">LIVE MULTIPLAYER SESSION</p>
              <h2>Starting the listening room.</h2>
              <p>
                {seconds < 8
                  ? "Connecting to the real-time game network. Solo and multiplayer rooms will open automatically."
                  : seconds < 25
                  ? "The game server is waking up and preparing the audio catalogs. Almost ready..."
                  : "Taking a few extra seconds to finalize the connection. You will join the lobby momentarily."}
              </p>

              <div className="hero-rules" aria-label="Catalog summary" style={{ justifyContent: 'center', marginTop: '28px' }}>
                <span><strong>250</strong> Rap US</span>
                <span><strong>250</strong> 2000s Pop</span>
                <span><strong>500</strong> total tracks</span>
              </div>

              <div className="start-actions">
                {seconds > 25 && (
                  <button
                    type="button"
                    className="button secondary"
                    data-slot="button"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw size={15} />
                    Refresh connection
                  </button>
                )}
                {isPreview && (
                  <button
                    type="button"
                    className="button secondary"
                    data-slot="button"
                    onClick={exitPreview}
                  >
                    Exit preview
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <span>Made for the “wait, I know this” moment.</span>
        <BrandMark />
      </footer>
    </div>
  );
}
