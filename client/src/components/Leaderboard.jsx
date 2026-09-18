import React from 'react';
import { Crown, Medal, Flame, CheckCheck, Mic, Music2, Trophy, Users } from 'lucide-react';
import AvatarIcon from './AvatarIcon';

export default function Leaderboard({ players = [], currentUserId }) {
  const getRankBadge = (index) => {
    switch (index) {
      case 0:
        return (
          <div className="w-6 h-6 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center">
            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          </div>
        );
      case 1:
        return (
          <div className="w-6 h-6 rounded-full bg-slate-300/15 border border-slate-300/30 flex items-center justify-center">
            <Medal className="w-3.5 h-3.5 text-slate-300 fill-slate-300/30" />
          </div>
        );
      case 2:
        return (
          <div className="w-6 h-6 rounded-full bg-amber-600/15 border border-amber-600/30 flex items-center justify-center">
            <Medal className="w-3.5 h-3.5 text-amber-600 fill-amber-600/30" />
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-[#191925] border border-[#252536] flex items-center justify-center font-bold text-xs text-neutral-400 tabular-nums">
            {index + 1}
          </div>
        );
    }
  };

  return (
    <div className="card-panel rounded-2xl p-4 flex flex-col h-[320px] shadow-lg shadow-black/20">
      {/* Standings Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#232332] mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Standings
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#191925] border border-[#252536] text-[11px] font-semibold text-neutral-400">
          <Users className="w-3 h-3 text-mauve-400" />
          <span>{players.length} {players.length === 1 ? 'Player' : 'Players'}</span>
        </div>
      </div>

      {/* Players List */}
      <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
        {players.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6 text-neutral-500">
            <Users className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs font-medium">Waiting for players to join...</p>
          </div>
        ) : (
          players.map((player, index) => {
            const isMe = player.id === currentUserId;
            const hasBoth = player.foundArtist && player.foundTitle;
            const hasStreak = (player.streak || 0) >= 2;

            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  isMe
                    ? 'bg-mauve-500/10 border-mauve-500/40 ring-1 ring-mauve-500/20'
                    : 'bg-[#181824]/70 border-[#232332] hover:border-[#383850]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="shrink-0">
                    {getRankBadge(index)}
                  </div>

                  <AvatarIcon id={player.avatar} className="w-4 h-4" containerClassName="p-1.5 rounded-lg" />

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold truncate ${isMe ? 'text-mauve-300' : 'text-neutral-100'}`}>
                        {player.nickname}
                      </span>
                      {isMe && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-mauve-500/20 text-mauve-300 border border-mauve-500/30 shrink-0">
                          YOU
                        </span>
                      )}
                      {player.isHost && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-charcoal-800 text-neutral-400 border border-charcoal-700 shrink-0">
                          HOST
                        </span>
                      )}
                    </div>

                    {/* Solve Status & Streak Indicators */}
                    <div className="flex items-center gap-2 text-[11px] mt-0.5">
                      {hasBoth ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/25">
                          <CheckCheck className="w-3 h-3" />
                          <span>Both</span>
                        </span>
                      ) : player.foundArtist ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/25">
                          <Mic className="w-3 h-3" />
                          <span>Artist</span>
                        </span>
                      ) : player.foundTitle ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/25">
                          <Music2 className="w-3 h-3" />
                          <span>Title</span>
                        </span>
                      ) : (
                        <span className="text-neutral-500 italic text-[11px]">listening...</span>
                      )}

                      {/* Streak Flame Badge */}
                      {hasStreak && (
                        <div className="flex items-center">
                          {player.streakWeakened ? (
                            <span className="inline-flex items-center gap-1 text-amber-500/60 bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/15 text-[10px]">
                              <Flame className="w-3 h-3 text-amber-500/50" />
                              <span>{player.streak}x (weak)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-400 font-bold bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30 text-[11px]">
                              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-pulse" />
                              <span>{player.streak}x</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Score Column */}
                <div className="text-right shrink-0 pl-2">
                  <div className="text-xs font-extrabold text-white tabular-nums">
                    {player.score.toLocaleString()} <span className="text-[10px] text-neutral-400 font-normal">pts</span>
                  </div>
                  {player.roundScore > 0 && (
                    <span className="text-[10px] font-bold text-emerald-400 tabular-nums">
                      +{player.roundScore}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
