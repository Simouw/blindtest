import React, { useState } from 'react';
import { Play, Users, Plus, Radio, Flame, Sparkles, Mic, Check, Music2 } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import AvatarIcon, { AVATAR_OPTIONS } from './AvatarIcon';

export default function Lobby({ nickname, setNickname, avatar, setAvatar }) {
  const { rooms, joinRoom, createRoom } = useSocket();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newPlaylistId, setNewPlaylistId] = useState('rap_us');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const rapRoom = rooms.find(r => r.id === 'rap-us-room');
  const popRoom = rooms.find(r => r.id === 'pop-2000-room');
  const customRooms = rooms.filter(r => r.id !== 'rap-us-room' && r.id !== 'pop-2000-room');

  const handleJoin = (roomId) => {
    if (!nickname.trim()) return;
    joinRoom(roomId, nickname.trim(), avatar);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newRoomName.trim() || !nickname.trim()) return;
    createRoom(newRoomName.trim(), newPlaylistId);
    setShowCreateModal(false);
    setNewRoomName('');
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-8 md:py-12 space-y-10">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1b1b28] border border-violet-500/30 text-violet-300 text-xs font-semibold tracking-wide shadow-sm">
          <Radio className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
          <span>Real-time Multiplayer Music Quiz</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
          BLINDTEST <span className="text-violet-400">LIVE</span>
        </h1>

        <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
          Listen, recognize, and guess faster than your friends. Sub-second live scoring with full typo tolerance and streak bonuses!
        </p>
      </div>

      {/* Player Profile Setup */}
      <div className="card-panel max-w-lg mx-auto p-5 md:p-6 rounded-3xl shadow-xl">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#232332]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span>Your Player Profile</span>
          </h2>
          <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Ready to play
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Avatar Selector */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowAvatarPicker(prev => !prev)}
              className="group relative focus:outline-none cursor-pointer transition transform hover:scale-105"
              title="Change your avatar"
            >
              <AvatarIcon
                id={avatar}
                className="w-7 h-7"
                containerClassName="w-16 h-16 rounded-2xl border-2 border-[#2c2c3e] hover:border-violet-500 transition shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-[#181824] border border-[#2c2c3e] text-[9px] font-bold text-slate-300">
                Edit
              </span>
            </button>

            {/* Avatar Dropdown Grid */}
            {showAvatarPicker && (
              <div className="absolute top-full left-0 mt-3 p-3 bg-[#181824] border border-[#2e2e42] rounded-2xl shadow-2xl z-30 w-72">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 pb-1 border-b border-[#2e2e42]">
                  Choose Avatar Icon
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        setAvatar(av.id);
                        setShowAvatarPicker(false);
                      }}
                      className={`relative p-2 rounded-xl flex items-center justify-center transition border ${
                        avatar === av.id
                          ? 'bg-[#262638] border-violet-500'
                          : 'bg-[#1b1b26] border-[#29293a] hover:border-slate-500'
                      }`}
                      title={av.label}
                    >
                      <av.icon className={`w-5 h-5 ${av.color}`} />
                      {avatar === av.id && (
                        <Check className="w-3 h-3 text-violet-400 absolute top-0.5 right-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Nickname Input */}
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Player Nickname
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. BeatMaster"
              maxLength={20}
              className="w-full px-4 py-2.5 bg-[#171722] border border-[#2a2a3c] rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Featured Playlists Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Featured Playlists</span>
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create custom room</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: RAP US */}
          <div className="card-panel card-panel-hover p-6 md:p-7 rounded-3xl flex flex-col justify-between shadow-lg">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold tracking-wide">
                  <Mic className="w-3.5 h-3.5" />
                  <span>RAP US CLASSICS & ANTHEMS</span>
                </span>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>{rapRoom?.playerCount || 0} active</span>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white">RAP US Legends</h3>
                <p className="mt-1 text-slate-400 text-xs md:text-sm leading-relaxed">
                  Tupac, Biggie, Eminem, Kendrick Lamar, Travis Scott, Drake, 50 Cent, Dr. Dre, Future, J. Cole, Nas, Wu-Tang Clan...
                </p>
              </div>

              {/* Rotation Counter */}
              <div className="p-3 rounded-2xl bg-[#161622] border border-[#242436] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2 text-violet-300 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{rapRoom?.availableTracks || 80} in active rotation</span>
                </div>
                <span className="text-slate-500 text-[11px]">• {rapRoom?.totalCatalogTracks || 100} in catalog</span>
              </div>
            </div>

            <div className="pt-5 mt-4 border-t border-[#232332]">
              <button
                onClick={() => handleJoin('rap-us-room')}
                disabled={!nickname.trim()}
                className="w-full py-3.5 px-5 rounded-2xl btn-primary text-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-violet-900/20"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Play RAP US Room</span>
              </button>
            </div>
          </div>

          {/* Card 2: POP 2000 */}
          <div className="card-panel card-panel-hover p-6 md:p-7 rounded-3xl flex flex-col justify-between shadow-lg">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-bold tracking-wide">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>POP 2000-2010 HITS</span>
                </span>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>{popRoom?.playerCount || 0} active</span>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white">2000s Pop Anthems</h3>
                <p className="mt-1 text-slate-400 text-xs md:text-sm leading-relaxed">
                  Lady Gaga, Black Eyed Peas, Rihanna, Britney Spears, Katy Perry, Beyoncé, Ke$ha, Shakira, Justin Timberlake, Usher, Akon...
                </p>
              </div>

              {/* Rotation Counter */}
              <div className="p-3 rounded-2xl bg-[#161622] border border-[#242436] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2 text-violet-300 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{popRoom?.availableTracks || 80} in active rotation</span>
                </div>
                <span className="text-slate-500 text-[11px]">• {popRoom?.totalCatalogTracks || 100} in catalog</span>
              </div>
            </div>

            <div className="pt-5 mt-4 border-t border-[#232332]">
              <button
                onClick={() => handleJoin('pop-2000-room')}
                disabled={!nickname.trim()}
                className="w-full py-3.5 px-5 rounded-2xl btn-primary text-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-violet-900/20"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Play POP 2000 Room</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Community Custom Rooms */}
      {customRooms.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Active Community Rooms
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {customRooms.map((r) => (
              <div key={r.id} className="card-panel p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white text-sm">{r.name}</h4>
                  <p className="text-xs text-slate-400">{r.playlistName} • {r.playerCount} player(s)</p>
                </div>
                <button
                  onClick={() => handleJoin(r.id)}
                  disabled={!nickname.trim()}
                  className="px-3.5 py-1.5 rounded-xl btn-primary text-xs cursor-pointer disabled:opacity-40"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="card-panel max-w-md w-full p-6 md:p-7 rounded-3xl space-y-5 shadow-2xl animate-scale-in border border-[#2d2d42]">
            <h3 className="text-xl font-bold text-white">Create Custom Room</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Room Name
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Friday Night Chill"
                  required
                  className="w-full px-4 py-2.5 bg-[#171722] border border-[#2a2a3c] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Select Playlist
                </label>
                <select
                  value={newPlaylistId}
                  onChange={(e) => setNewPlaylistId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#171722] border border-[#2a2a3c] rounded-xl text-white focus:outline-none focus:border-violet-500 text-sm"
                >
                  <option value="rap_us">RAP US (Classics & Current — 100 tracks)</option>
                  <option value="pop_2000">POP 2000-2010 Hits (100 tracks)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl btn-secondary text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newRoomName.trim()}
                  className="px-5 py-2 rounded-xl btn-primary text-sm cursor-pointer disabled:opacity-40"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

