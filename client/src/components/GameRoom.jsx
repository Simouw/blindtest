import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, 
  Play, 
  Clock, 
  Music2, 
  Trophy, 
  Crown,
  ShieldCheck,
  Disc3,
  Flame,
  Volume2
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import AudioPlayer from './AudioPlayer';
import VolumeControl from './VolumeControl';
import GuessInput from './GuessInput';
import CountdownOverlay from './CountdownOverlay';
import RevealCard from './RevealCard';
import Leaderboard from './Leaderboard';
import RoomChat from './RoomChat';
import AvatarIcon from './AvatarIcon';

export default function GameRoom() {
  const {
    currentRoom,
    gameStatus,
    countdown,
    remainingTime,
    roundData,
    revealedTrack,
    leaderboard,
    myPlayerState,
    chatMessages,
    lastFeedback,
    gameEndedData,
    leaveRoom,
    startGame,
    submitGuess,
    sendChatMessage,
    socket
  } = useSocket();

  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (gameStatus === 'ENDED') {
      confetti({
        particleCount: 80,
        spread: 65,
        origin: { y: 0.6 }
      });
    }
  }, [gameStatus]);

  if (!currentRoom) return null;

  const timerPercentage = Math.max(0, Math.min(100, (remainingTime / 30) * 100));
  const timerColor = remainingTime > 15 
    ? 'bg-emerald-500' 
    : remainingTime > 7 
    ? 'bg-amber-500' 
    : 'bg-red-500';

  const isHost = currentRoom.hostId === socket?.id || currentRoom.isHost;
  const currentRoundNum = roundData?.roundIndex || (revealedTrack?.roundIndex) || (currentRoom.currentTrackIndex + 1);
  const totalRoundsNum = roundData?.totalRounds || (revealedTrack?.totalRounds) || currentRoom.totalTracks || 10;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#0d0d10] text-slate-100">
      {/* Invisible Audio Player with autoplay unblocker */}
      <AudioPlayer
        previewUrl={roundData?.previewUrl}
        isPlaying={gameStatus === 'PLAYING'}
        volume={volume}
        isMuted={isMuted}
      />

      {/* 5s Countdown Overlay */}
      <CountdownOverlay
        countdown={countdown}
        currentRound={currentRoundNum}
        totalRounds={totalRoundsNum}
      />

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-[#13131c] border-b border-[#232332] px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={leaveRoom}
              className="p-2 rounded-xl bg-[#1c1c28] hover:bg-[#252536] text-slate-400 hover:text-white transition cursor-pointer"
              title="Leave Room"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  {currentRoom.name}
                </h2>
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
                  {currentRoom.playlistName}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 flex items-center gap-2 font-mono mt-0.5">
                <span>{leaderboard.length} player(s)</span>
                {gameStatus === 'PLAYING' && (
                  <>
                    <span>•</span>
                    <span className="text-violet-300 font-semibold">Round {currentRoundNum} / {totalRoundsNum}</span>
                  </>
                )}
                {currentRoom.availableTracks !== undefined && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="text-slate-500 hidden sm:inline">{currentRoom.availableTracks} in rotation</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <VolumeControl
              volume={volume}
              isMuted={isMuted}
              onVolumeChange={setVolume}
              onToggleMute={() => setIsMuted(prev => !prev)}
            />
          </div>
        </div>

        {/* 30s Animated Round Progress Bar */}
        {gameStatus === 'PLAYING' && (
          <div className="w-full bg-[#101017] h-1.5 absolute bottom-0 left-0 overflow-hidden">
            <div
              className={`h-full ${timerColor} transition-all duration-1000 ease-linear shadow-sm`}
              style={{ width: `${timerPercentage}%` }}
            />
          </div>
        )}
      </header>

      {/* Main Grid: Game Area (left) + Leaderboard & Chat (right) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left / Center: Game Stage */}
        <div className="lg:col-span-8 flex flex-col justify-center min-h-[460px] space-y-6">

          {/* State 1: LOBBY (Waiting Room) */}
          {gameStatus === 'LOBBY' && (
            <div className="card-panel p-8 md:p-12 rounded-3xl text-center space-y-6 shadow-xl animate-scale-in">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#1b1b28] border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-md">
                <Music2 className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-2xl font-bold text-white">Waiting Room</h3>
                <p className="text-slate-400 text-xs md:text-sm max-w-md mx-auto">
                  Invite your friends or get ready. Once everyone is in, launch the game!
                </p>
              </div>

              {/* Ready Players List */}
              <div className="flex flex-wrap justify-center gap-2 py-2">
                {leaderboard.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1a1a27] border border-[#27273a]">
                    <AvatarIcon id={p.avatar} className="w-3.5 h-3.5" containerClassName="p-1 rounded-lg" />
                    <span className="text-xs font-semibold text-slate-200">{p.nickname}</span>
                    {p.isHost && (
                      <span className="text-[10px] text-violet-400 font-bold flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> Host
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={startGame}
                  className="px-7 py-3.5 rounded-2xl btn-primary font-bold text-sm flex items-center justify-center gap-2 mx-auto cursor-pointer shadow-lg shadow-violet-900/30"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Blindtest (10 Tracks)</span>
                </button>
              </div>
            </div>
          )}

          {/* State 2: PLAYING */}
          {gameStatus === 'PLAYING' && (
            <div className="space-y-6 animate-scale-in">
              {/* Disc & Equalizer Stage */}
              <div className="card-panel p-8 rounded-3xl text-center relative overflow-hidden shadow-xl">
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1a1a27] border border-[#27273a] text-xs font-mono font-bold">
                  <Clock className="w-3.5 h-3.5 text-violet-400" />
                  <span className={remainingTime <= 7 ? 'text-red-400 font-black' : 'text-slate-200'}>
                    00:{remainingTime < 10 ? `0${remainingTime}` : remainingTime}
                  </span>
                </div>

                {/* Spinning Vinyl Record */}
                <div className="relative w-32 h-32 mx-auto mb-5 flex items-center justify-center">
                  <div className="relative w-28 h-28 rounded-full bg-[#0a0a0f] border-2 border-[#2c2c3e] flex items-center justify-center shadow-inner animate-spin-slow">
                    <div className="absolute inset-2 rounded-full border border-slate-800/60" />
                    <div className="absolute inset-4 rounded-full border border-slate-800/40" />
                    <div className="w-9 h-9 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center">
                      <Music2 className="w-4 h-4 text-violet-300" />
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-1">
                  What is this track?
                </h3>
                <p className="text-xs text-slate-400">
                  Type track name or artist below. Minor typos are accepted!
                </p>

                {/* Equalizer Waveform Bars */}
                <div className="flex items-end justify-center gap-1.5 h-8 mt-5">
                  {[40, 75, 55, 90, 65, 80, 45, 95, 70, 85, 60, 90, 50, 75, 40].map((h, i) => (
                    <div
                      key={i}
                      className="w-1.5 rounded-full bg-violet-500/80 animate-pulse"
                      style={{
                        height: `${h}%`,
                        animationDelay: `${i * 0.08}s`,
                        animationDuration: '0.8s'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Answer Input */}
              <GuessInput
                onSubmitGuess={submitGuess}
                foundArtist={myPlayerState?.foundArtist}
                foundTitle={myPlayerState?.foundTitle}
                lastFeedback={lastFeedback}
                roundActive={true}
              />
            </div>
          )}

          {/* State 3: REVEALING */}
          {gameStatus === 'REVEALING' && (
            <RevealCard revealedData={revealedTrack} />
          )}

          {/* State 4: GAME ENDED */}
          {gameStatus === 'ENDED' && (
            <div className="card-panel p-8 md:p-12 rounded-3xl text-center space-y-6 shadow-2xl animate-scale-in">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#1b1b28] border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
                <Trophy className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl md:text-3xl font-extrabold text-white">Game Over!</h2>
                <p className="text-slate-400 text-xs">
                  Final standings after 10 rounds.
                </p>
              </div>

              {/* Podium Top 3 */}
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-3 items-end">
                {/* 2nd Place */}
                {leaderboard[1] && (
                  <div className="bg-[#171724] border border-[#27273c] rounded-2xl p-4 flex flex-col items-center shadow">
                    <AvatarIcon id={leaderboard[1].avatar} className="w-5 h-5" containerClassName="w-12 h-12 rounded-xl mb-2" />
                    <span className="text-xs font-bold text-slate-300 truncate w-full">{leaderboard[1].nickname}</span>
                    <span className="text-xs font-bold text-slate-200 mt-1 font-mono">{leaderboard[1].score} pts</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 mt-2 px-2.5 py-0.5 rounded bg-[#202030]">2nd</span>
                  </div>
                )}

                {/* 1st Place */}
                {leaderboard[0] && (
                  <div className="bg-[#1c1c2e] border-2 border-amber-500/70 rounded-2xl p-5 flex flex-col items-center transform -translate-y-2 shadow-xl shadow-amber-950/20">
                    <AvatarIcon id={leaderboard[0].avatar} className="w-6 h-6" containerClassName="w-14 h-14 rounded-2xl mb-2" />
                    <span className="text-xs font-bold text-white truncate w-full">{leaderboard[0].nickname}</span>
                    <span className="text-sm font-bold text-amber-400 mt-1 font-mono">{leaderboard[0].score} pts</span>
                    <span className="text-[10px] uppercase font-bold text-amber-300 mt-2 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center gap-1">
                      <Crown className="w-3 h-3 fill-amber-400" /> 1st
                    </span>
                  </div>
                )}

                {/* 3rd Place */}
                {leaderboard[2] && (
                  <div className="bg-[#171724] border border-[#27273c] rounded-2xl p-4 flex flex-col items-center shadow">
                    <AvatarIcon id={leaderboard[2].avatar} className="w-5 h-5" containerClassName="w-12 h-12 rounded-xl mb-2" />
                    <span className="text-xs font-bold text-slate-300 truncate w-full">{leaderboard[2].nickname}</span>
                    <span className="text-xs font-bold text-amber-600 mt-1 font-mono">{leaderboard[2].score} pts</span>
                    <span className="text-[10px] uppercase font-bold text-amber-700 mt-2 px-2.5 py-0.5 rounded bg-[#202030]">3rd</span>
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-center gap-3">
                <button
                  onClick={startGame}
                  className="px-6 py-2.5 rounded-xl btn-primary text-xs font-bold cursor-pointer"
                >
                  Play Again
                </button>
                <button
                  onClick={leaveRoom}
                  className="px-6 py-2.5 rounded-xl btn-secondary text-xs font-bold cursor-pointer"
                >
                  Back to Lobby
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Leaderboard (top) & Room Chat (bottom) */}
        <div className="lg:col-span-4 space-y-4">
          <Leaderboard players={leaderboard} currentUserId={socket?.id} />
          <RoomChat messages={chatMessages} onSendMessage={sendChatMessage} />
        </div>
      </main>
    </div>
  );
}
