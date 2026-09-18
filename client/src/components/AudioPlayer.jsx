import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, AlertTriangle, Play, Music } from 'lucide-react';

export default function AudioPlayer({ previewUrl, isPlaying, volume = 0.8, isMuted = false }) {
  const audioRef = useRef(null);
  const retryCountRef = useRef(0);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);

  // Synchronisation volume & mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Chargement et lecture
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    retryCountRef.current = 0;

    if (previewUrl && isPlaying) {
      setLoadError(false);
      setAutoplayBlocked(false);
      setAudioLoaded(false);

      audio.src = previewUrl;
      audio.load();

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setAutoplayBlocked(false);
            setLoadError(false);
          })
          .catch((err) => {
            if (err.name === 'NotAllowedError') {
              setAutoplayBlocked(true);
            }
          });
      }
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [previewUrl, isPlaying]);

  const handleManualPlay = () => {
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => {
          setAutoplayBlocked(false);
          setLoadError(false);
        })
        .catch(e => console.error('Audio playback failed:', e));
    }
  };

  const handleAudioError = () => {
    if (retryCountRef.current < 2 && audioRef.current && previewUrl) {
      retryCountRef.current += 1;
      setTimeout(() => {
        if (audioRef.current && isPlaying) {
          audioRef.current.load();
          audioRef.current.play().catch(() => {});
        }
      }, 500);
    } else {
      setLoadError(true);
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        preload="auto"
        onCanPlay={() => {
          setAudioLoaded(true);
          setLoadError(false);
        }}
        onError={handleAudioError}
      />

      {/* Autoplay Unblock Trigger */}
      {autoplayBlocked && isPlaying && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-fadeIn">
          <button
            onClick={handleManualPlay}
            className="flex items-center gap-2.5 px-6 py-3.5 btn-primary rounded-2xl font-bold text-sm cursor-pointer shadow-2xl shadow-mauve-500/20"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Click to enable sound</span>
          </button>
        </div>
      )}

      {/* Floating Load error toast (does not push down page layout) */}
      {loadError && isPlaying && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fadeIn">
          <div className="flex items-center gap-2.5 px-4 py-2 bg-red-950/90 border border-red-500/40 text-red-300 text-xs font-semibold rounded-2xl shadow-2xl backdrop-blur-md">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>Audio stream delayed</span>
            <button
              onClick={handleManualPlay}
              className="ml-1 underline hover:text-white cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </>
  );
}
