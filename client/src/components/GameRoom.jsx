import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Link, Music2, Play, SkipForward, Trophy, Volume2 } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import AudioPlayer from './AudioPlayer';
import VolumeControl from './VolumeControl';
import GuessInput from './GuessInput';
import Leaderboard from './Leaderboard';
import RoomChat from './RoomChat';
import BrandMark from './BrandMark';
import { SoundToggle } from './ui/sound';

function RoundProgress({ current, total, status }) {
  return <div className="round-progress" aria-label={`Round ${current} of ${total}`}>
    {Array.from({ length: total }, (_, index) => {
      const round = index + 1;
      return <span key={round} className={round < current ? 'done' : round === current && status !== 'ENDED' ? 'current' : ''} />;
    })}
  </div>;
}

export default function GameRoom() {
  const { currentRoom, gameStatus, countdown, remainingTime, revealRemaining, roundData, roundCue, revealedTrack, leaderboard,
    myPlayerState, chatMessages, lastFeedback, gameEndedData, leaveRoom, startGame, submitGuess,
    sendChatMessage, socket, connected, pending, passRound, nextRound } = useSocket();
  const [volume, setVolume] = useState(() => {
    const saved = Number(localStorage.getItem('blindtest_volume') ?? 0.8);
    return Number.isFinite(saved) ? Math.max(0, Math.min(1, saved)) : 0.8;
  });
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('blindtest_muted') === 'true');
  const [audioStatus, setAudioStatus] = useState('idle');
  const [inviteStatus, setInviteStatus] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [soundChecked, setSoundChecked] = useState(false);
  const audio = useRef(null);

  useEffect(() => { localStorage.setItem('blindtest_volume', volume); }, [volume]);
  useEffect(() => { localStorage.setItem('blindtest_muted', isMuted); }, [isMuted]);

  const isHost = currentRoom.hostId === socket?.id;
  const host = leaderboard.find(player => player.id === currentRoom.hostId);
  const roundNumber = roundData?.roundIndex || revealedTrack?.roundIndex || currentRoom.currentTrackIndex + 1;
  const totalRounds = roundData?.totalRounds || currentRoom.totalTracks || 10;
  const playing = gameStatus === 'PLAYING';
  const revealing = gameStatus === 'REVEALING';
  const waiting = gameStatus === 'LOBBY';
  const ended = gameStatus === 'ENDED';
  const me = leaderboard.find(player => player.id === socket?.id);
  const allFound = myPlayerState.foundArtist && myPlayerState.foundTitle;
  const shareUrl = new URL(window.location.href);
  shareUrl.searchParams.set('room', currentRoom.id);

  const copyInvite = async () => {
    try { await navigator.clipboard.writeText(shareUrl.toString()); setInviteStatus('Copied'); }
    catch { setShowInvite(true); setInviteStatus('Copy below'); }
  };
  const begin = () => { audio.current?.checkSound(true); startGame(); };
  const playbackLabel = isMuted || volume === 0 ? 'Sound is muted' : audioStatus === 'playing' ? 'Clip playing' : audioStatus === 'blocked' ? 'Enable sound below' : audioStatus === 'error' ? 'Audio unavailable' : audioStatus === 'ended' ? 'Clip finished' : 'Loading clip';
  const cueUnlocked = Boolean(roundCue && remainingTime <= 3);

  return <div className="page game-page">
    <header className="game-header">
      <div className="game-heading">
        <button className="icon-button" data-slot="button" data-variant="ghost" onClick={leaveRoom} aria-label="Leave room"><ArrowLeft size={20} /></button>
        <div><span className="eyebrow">LIVE ROOM</span><h1>{currentRoom.name}</h1></div>
      </div>
      <div className="game-header-actions">
        <button className="button secondary invite-button" data-sound="copy" data-success={inviteStatus === 'Copied' || undefined} onClick={copyInvite}><Link size={16} /><span>{inviteStatus || 'Invite'}</span></button>
        <SoundToggle className="ui-sound-toggle" title="Toggle interface sounds" />
        <VolumeControl {...{ volume, isMuted }} onVolumeChange={value => { setVolume(value); if (value > 0) setIsMuted(false); }} onToggleMute={() => { if (volume === 0) { setVolume(0.8); setIsMuted(false); } else setIsMuted(value => !value); }} />
      </div>
    </header>

    <span className="sr-only" role="status">{inviteStatus}</span>
    {showInvite && <input className="share-fallback" aria-label="Room invitation link" readOnly value={shareUrl.toString()} onFocus={event => event.target.select()} />}

    <main className="game-layout">
      <div className="game-main">
        <section className={'play-stage stage-' + gameStatus.toLowerCase()} data-warning={playing && remainingTime === 3 ? 'true' : undefined} aria-label="Music quiz">
          <div className="stage-topline">
            <div className="stage-meta"><span>{waiting ? 'Ready to play' : ended ? 'Session complete' : `Round ${roundNumber} of ${totalRounds}`}</span><strong>{(me?.score || 0).toLocaleString()} <small>pts</small></strong></div>
            <RoundProgress current={roundNumber} total={totalRounds} status={gameStatus} />
          </div>

          <div className="stage-content">
            {waiting && <div className="waiting-content">
              <div className="stage-symbol"><BrandMark /></div>
              <p className="eyebrow">{leaderboard.length} {leaderboard.length === 1 ? 'PLAYER' : 'PLAYERS'} IN</p>
              <h2>{leaderboard.length === 1 ? 'Your listening room is ready.' : 'Everyone in? Let’s play.'}</h2>
              <p>{leaderboard.length === 1 ? 'Start solo now, or invite someone before the first song.' : 'Same clip, same clock. Fast answers earn more.'}</p>
              <div className="start-actions">
                {isHost ? <button className="button primary large" data-slot="button" disabled={!connected || pending} onClick={begin}><Play size={17} fill="currentColor" />{pending ? 'Starting…' : 'Start the game'}</button> : <p className="host-note">Waiting for {host?.nickname || 'the host'} to start.</p>}
                <button className="text-button" data-slot="button" data-variant="ghost" onClick={() => { audio.current?.checkSound(); setSoundChecked(true); }}><Volume2 size={16} />{soundChecked ? 'Test again' : 'Test music sound'}</button>
              </div>
            </div>}

            {gameStatus === 'COUNTDOWN' && <div className="ready-content" role="status">
              <span className="ready-kicker">FIRST CLIP IN</span>
              <span className="ready-number" key={countdown}>{countdown}</span>
              <h2>Listen closely.</h2>
            </div>}

            {playing && <div className="listening-content">
              <div className="round-prompt">
                <h2>{allFound ? 'That’s both.' : myPlayerState.passed ? 'Round passed.' : 'What are you hearing?'}</h2>
                {(allFound || myPlayerState.passed) && <p>{allFound ? `+${myPlayerState.roundScore} points` : 'Points saved.'}</p>}
              </div>
              <div className={'vinyl-cue ' + (cueUnlocked ? 'unlocked' : 'locked')} aria-label={cueUnlocked ? 'Last chance clue unlocked' : 'Last chance clue unlocks with three seconds left'}>
                <div className={'vinyl-disc ' + (audioStatus === 'playing' ? 'spinning' : '')} aria-hidden="true">
                  {roundData?.artworkUrl && <img className="vinyl-artwork" src={roundData.artworkUrl} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} />}
                  <i className="vinyl-ring ring-one" /><i className="vinyl-ring ring-two" /><i className="vinyl-ring ring-three" />
                  <span className="vinyl-label"><strong key={remainingTime}>{remainingTime}</strong></span>
                </div>
                {cueUnlocked && <div className="cue-reveal" role="status">
                  <span><small>Artist</small><strong>{roundCue.artistInitial}</strong></span>
                  <span><small>Title</small><strong>{roundCue.titleWords} {roundCue.titleWords === 1 ? 'word' : 'words'}</strong></span>
                  {roundCue.year && <span><small>Year</small><strong>{roundCue.year}</strong></span>}
                </div>}
              </div>
            </div>}

            {revealing && revealedTrack && <div className="reveal-content" key={revealedTrack.track.id || revealedTrack.track.previewUrl}>
              <div className="artwork-slot"><Music2 size={40} aria-hidden="true" />{revealedTrack.track.artworkUrl && <img src={revealedTrack.track.artworkUrl} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} />}</div>
              <h2>{revealedTrack.track.title}</h2>
              <p className="reveal-artist">{revealedTrack.track.artist}<span>{revealedTrack.track.year ? ` · ${revealedTrack.track.year}` : ''}</span></p>
              {myPlayerState.roundScore > 0 && <p className="round-result">+{myPlayerState.roundScore} pts</p>}
              <div className="reveal-countdown" role="timer" aria-label={`${roundNumber === totalRounds ? 'Results' : 'Next song'} in ${revealRemaining} seconds`}><strong key={revealRemaining}>{revealRemaining}</strong></div>
            </div>}

            {ended && <div className="results-content">
              <Trophy size={38} className="result-trophy" />
              <p className="eyebrow">{leaderboard.length === 1 ? 'SOLO SESSION COMPLETE' : 'FINAL SCORES'}</p>
              <h2>{leaderboard.length === 1 ? 'Good ears.' : leaderboard[0]?.score === 0 ? 'A tough playlist.' : leaderboard.filter(player => player.score === leaderboard[0]?.score).length > 1 ? 'It’s a tie.' : `${leaderboard[0]?.nickname} takes it.`}</h2>
              <p><strong className="final-score">{(me?.score || 0).toLocaleString()}</strong> points</p>
              <div className="start-actions">{isHost ? <button className="button primary large" data-slot="button" onClick={begin} disabled={!connected || pending}>Play again <ArrowRight size={18} /></button> : <p>Waiting for {host?.nickname || 'the host'} to start a rematch.</p>}<button className="text-button" data-slot="button" data-variant="ghost" onClick={leaveRoom}>Choose another playlist</button></div>
            </div>}
          </div>

          <AudioPlayer ref={audio} round={roundData} active={playing || revealing} volume={volume} isMuted={isMuted} onStatus={setAudioStatus} />

          {playing && <div className="answer-area">
            <GuessInput onSubmitGuess={submitGuess} disabled={!connected} foundArtist={myPlayerState.foundArtist} foundTitle={myPlayerState.foundTitle} passed={myPlayerState.passed} lastFeedback={lastFeedback} roundActive={playing} roundKey={roundData?.startedAt} />
            <div className="round-actions">{!allFound && !myPlayerState.passed && <button className="text-button" data-slot="button" data-variant="ghost" onClick={passRound}><SkipForward size={15} />I don’t know</button>}</div>
          </div>}

          {playing && <div className="playback-dock">
            <div className="dock-track"><span className="dock-art"><Music2 size={18} /></span><div><strong>{playbackLabel}</strong></div></div>
            <div className={'dock-wave ' + (audioStatus === 'playing' && !isMuted && volume > 0 ? 'is-playing' : '')} aria-hidden="true">{[12,22,34,18,42,28,50,34,20,38,17,29,46,25,36,16,43,31,19,40,27,48,23,35,14,30,44,21,37].map((height, index) => <span key={index} style={{ height, animationDelay: index * -0.09 + 's' }} />)}</div>
          </div>}
        </section>

        {ended && gameEndedData?.history?.length > 0 && <section className="played-tracks"><div className="section-heading"><h2>The songs you heard</h2><span>{gameEndedData.history.length} tracks</span></div><ol>{gameEndedData.history.map((item, index) => <li key={index}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{item.track.title}</strong><p>{item.track.artist}</p></div></li>)}</ol></section>}
      </div>

      <aside className="game-sidebar">
        <Leaderboard players={leaderboard} currentUserId={socket?.id} playing={playing} />
        <RoomChat messages={chatMessages} onSendMessage={sendChatMessage} disabled={!connected} />
      </aside>
    </main>
  </div>;
}
