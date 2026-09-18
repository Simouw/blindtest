import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Play, RotateCw } from 'lucide-react';

// A short local tone both checks sound and unlocks this same media element.
function soundCheckUrl() {
  const rate = 22050, samples = Math.round(rate * 0.25);
  const buffer = new ArrayBuffer(44 + samples * 2), view = new DataView(buffer);
  const text = (offset, value) => [...value].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
  text(0, 'RIFF'); view.setUint32(4, 36 + samples * 2, true); text(8, 'WAVE'); text(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); text(36, 'data'); view.setUint32(40, samples * 2, true);
  for (let i = 0; i < samples; i++) view.setInt16(44 + i * 2, Math.sin(i * 2 * Math.PI * 440 / rate) * 5000 * Math.sin(Math.PI * i / samples), true);
  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
}

export default forwardRef(function AudioPlayer({ round, active, volume, isMuted, onStatus }, ref) {
  const audio = useRef(null);
  const generation = useRef(0);
  const sync = useRef({ offset: 0, received: 0 });
  const [status, setStatus] = useState('idle');
  const toneUrl = useRef(null);
  const update = value => { setStatus(value); onStatus(value); };
  useEffect(() => { toneUrl.current = soundCheckUrl(); return () => URL.revokeObjectURL(toneUrl.current); }, []);
  useEffect(() => { audio.current.volume = volume; audio.current.muted = isMuted; }, [volume, isMuted]);
  useEffect(() => {
    if (!active || status !== 'loading') return;
    const timer = setTimeout(() => update('error'), 8000);
    return () => clearTimeout(timer);
  }, [active, status]);
  const play = () => {
    const current = generation.current;
    audio.current.play().catch(error => {
      if (current !== generation.current || error.name === 'AbortError') return;
      update(error.name === 'NotAllowedError' ? 'blocked' : 'error');
    });
  };
  useImperativeHandle(ref, () => ({ checkSound(silent = false) {
    if (!active) {
      audio.current.volume = silent ? 0 : volume;
      audio.current.src = toneUrl.current;
      audio.current.play().catch(() => update('blocked'));
    }
  } }));
  useEffect(() => {
    generation.current++;
    const element = audio.current;
    if (active && round?.previewUrl) {
      element.volume = volume; element.muted = isMuted;
      sync.current = { offset: round.duration - (round.remaining ?? round.duration), received: Date.now() };
      update('loading'); element.src = round.previewUrl; element.load(); play();
    } else { element.pause(); element.removeAttribute('src'); element.load(); update('idle'); }
    return () => { generation.current++; element.pause(); };
  }, [round?.previewUrl, round?.startedAt, active]);
  const seekToLive = () => {
    if (!active || !round) return;
    const position = sync.current.offset + (Date.now() - sync.current.received) / 1000;
    if (Number.isFinite(audio.current.duration)) audio.current.currentTime = Math.max(0, Math.min(position, audio.current.duration - 0.1));
  };
  return <div className="audio-status">
    <audio ref={audio} preload="auto" onLoadedMetadata={seekToLive} onPlaying={() => active && update('playing')} onWaiting={() => active && update('loading')} onEnded={() => active && update('ended')} onError={() => active && update('error')} />
    {active && status === 'blocked' && <button className="button primary" onClick={() => { seekToLive(); play(); }}><Play size={16} />Enable sound</button>}
    {active && status === 'error' && <div role="alert"><span>This clip couldn’t load.</span><button className="text-button" onClick={() => { update('loading'); audio.current.load(); play(); }}><RotateCw size={14} />Retry audio</button></div>}
  </div>;
});
