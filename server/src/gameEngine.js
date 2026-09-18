/**
 * Multiplayer Blindtest Game Engine
 * Manages rooms, rounds, synchronized timers, scores, streaks, and in-game chat.
 */

import { PLAYLISTS } from './data/playlists.js';
import { evaluateSubmission } from './fuzzyMatch.js';

// Phase durations in seconds
export const COUNTDOWN_DURATION = 5;
export const ROUND_DURATION = 30;
export const REVEAL_DURATION = 7;
export const TRACKS_PER_GAME = 10;

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class GameManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomId -> Room
    // Tracks played per playlist across the LAST 2 GAMES (history of array of Sets)
    this.playlistHistories = new Map(); // playlistId -> Array<Set<trackId>>
    this.initDefaultRooms();
  }

  initDefaultRooms() {
    // Pre-configured room 1: RAP US
    this.createRoom({
      id: 'rap-us-room',
      name: 'RAP US Classics & Current',
      playlistId: 'rap_us',
      isDefault: true
    });

    // Pre-configured room 2: POP 2000
    this.createRoom({
      id: 'pop-2000-room',
      name: 'POP 2000-2010 Hits',
      playlistId: 'pop_2000',
      isDefault: true
    });
  }

  /**
   * Get set of track IDs excluded for a playlist (played in the last 2 games)
   */
  getExcludedTrackIds(playlistId) {
    const history = this.playlistHistories.get(playlistId) || [];
    const excluded = new Set();
    for (const gameSet of history) {
      for (const id of gameSet) {
        excluded.add(id);
      }
    }
    return excluded;
  }

  /**
   * Get count of tracks that CAN be picked for the next game in this playlist
   */
  getAvailableTracksCount(playlistId) {
    const playlist = PLAYLISTS[playlistId] || PLAYLISTS.rap_us;
    if (!playlist || !playlist.tracks) return 0;
    const excluded = this.getExcludedTrackIds(playlistId);
    const available = playlist.tracks.filter(t => !excluded.has(t.id));
    return available.length;
  }

  /**
   * Selects 10 tracks randomly for a playlist, strictly guaranteeing
   * that NO track from the last 2 games of this playlist is repeated.
   */
  selectTracksForGame(playlistId, count = TRACKS_PER_GAME) {
    const playlist = PLAYLISTS[playlistId] || PLAYLISTS.rap_us;
    const allTracks = playlist?.tracks || [];
    if (allTracks.length === 0) return [];

    const excluded = this.getExcludedTrackIds(playlistId);
    let available = allTracks.filter(t => !excluded.has(t.id));

    // If available tracks are less than needed (e.g. small catalog),
    // fallback to excluding only the immediate previous game
    if (available.length < count) {
      const history = this.playlistHistories.get(playlistId) || [];
      const lastGameSet = history[history.length - 1] || new Set();
      available = allTracks.filter(t => !lastGameSet.has(t.id));
      if (available.length < count) {
        available = [...allTracks];
      }
    }

    const shuffled = shuffle(available);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    // Update 2-game history for this playlist
    let history = this.playlistHistories.get(playlistId);
    if (!history) {
      history = [];
      this.playlistHistories.set(playlistId, history);
    }
    history.push(new Set(selected.map(t => t.id)));
    if (history.length > 2) {
      history.shift(); // Keep only the last 2 games
    }

    return selected;
  }

  getPublicRooms() {
    const list = [];
    for (const [id, room] of this.rooms.entries()) {
      const totalCatalog = PLAYLISTS[room.playlistId]?.tracks?.length || 0;
      const availableCount = this.getAvailableTracksCount(room.playlistId);

      list.push({
        id: room.id,
        name: room.name,
        playlistId: room.playlistId,
        playlistName: PLAYLISTS[room.playlistId]?.name || 'Mix',
        playerCount: room.players.size,
        status: room.status,
        currentRound: room.currentTrackIndex + 1,
        totalRounds: room.trackList.length,
        totalCatalogTracks: totalCatalog,
        availableTracks: availableCount,
        isDefault: room.isDefault || false
      });
    }
    return list;
  }

  createRoom({ id, name, playlistId = 'rap_us', isDefault = false, creatorSocketId = null }) {
    const playlist = PLAYLISTS[playlistId] || PLAYLISTS.rap_us;
    const selectedTracks = this.selectTracksForGame(playlistId, TRACKS_PER_GAME);

    const room = {
      id: id || `room-${Math.random().toString(36).substring(2, 7)}`,
      name: name || (id ? id.toUpperCase() : 'New Room'),
      playlistId,
      playlistName: playlist.name,
      isDefault,
      hostId: creatorSocketId,
      status: 'LOBBY', // 'LOBBY' | 'COUNTDOWN' | 'PLAYING' | 'REVEALING' | 'ENDED'
      trackList: selectedTracks,
      currentTrackIndex: 0,
      roundStartTime: 0,
      timer: null,
      countdownValue: COUNTDOWN_DURATION,
      roundTimeRemaining: ROUND_DURATION,
      players: new Map(), // socketId -> Player
      history: [] // Round history
    };

    this.rooms.set(room.id, room);
    return room;
  }

  joinRoom(roomId, socket, { nickname, avatar }) {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = this.createRoom({ id: roomId, name: `Room ${roomId}`, creatorSocketId: socket.id });
    }

    if (room.players.size === 0) {
      room.hostId = socket.id;
    }

    const player = {
      id: socket.id,
      nickname: nickname || `Player-${Math.floor(Math.random() * 900 + 100)}`,
      avatar: avatar || 'headphones',
      score: 0,
      streak: 0,
      streakWeakened: false,
      isHost: room.hostId === socket.id,
      currentRound: {
        foundArtist: false,
        foundTitle: false,
        roundScore: 0,
        answeredAt: null
      }
    };

    room.players.set(socket.id, player);
    socket.join(room.id);
    socket.roomId = room.id;

    // Send complete state to joined player
    socket.emit('room_joined', this.serializeRoomState(room, socket.id));

    // Notify others via system chat event
    const joinMsg = {
      id: 'sys-join-' + Date.now(),
      type: 'system',
      systemType: 'join',
      text: `${player.nickname} joined the room.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.io.to(room.id).emit('chat_message', joinMsg);
    this.broadcastRoomUpdate(room);
    this.broadcastRoomsList();

    return room;
  }

  leaveRoom(socket) {
    const roomId = socket.roomId;
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.get(socket.id);
    room.players.delete(socket.id);
    socket.leave(room.id);
    delete socket.roomId;

    if (player) {
      const leaveMsg = {
        id: 'sys-leave-' + Date.now(),
        type: 'system',
        systemType: 'leave',
        text: `${player.nickname} left the room.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      this.io.to(room.id).emit('chat_message', leaveMsg);
    }

    if (room.hostId === socket.id && room.players.size > 0) {
      const nextHostId = room.players.keys().next().value;
      room.hostId = nextHostId;
      const nextHost = room.players.get(nextHostId);
      if (nextHost) nextHost.isHost = true;
      this.io.to(room.id).emit('chat_message', {
        id: 'sys-host-' + Date.now(),
        type: 'system',
        systemType: 'host',
        text: `${nextHost?.nickname} is now the host.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }

    if (room.players.size === 0 && !room.isDefault) {
      this.clearRoomTimers(room);
      this.rooms.delete(room.id);
    } else if (room.players.size === 0 && room.isDefault) {
      this.resetRoom(room);
    } else {
      if (room.status === 'PLAYING') {
        this.checkAllPlayersFinished(room);
      }
      this.broadcastRoomUpdate(room);
    }

    this.broadcastRoomsList();
  }

  startGame(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found' };

    if (room.hostId && room.hostId !== socketId && !room.isDefault) {
      return { error: 'Only the host can start the game.' };
    }

    if (room.status === 'PLAYING' || room.status === 'COUNTDOWN') {
      return { error: 'Game is already in progress.' };
    }

    // Reset scores & pick 10 tracks excluding the last 2 games of this playlist
    room.currentTrackIndex = 0;
    room.trackList = this.selectTracksForGame(room.playlistId, TRACKS_PER_GAME);
    for (const player of room.players.values()) {
      player.score = 0;
      player.streak = 0;
      player.streakWeakened = false;
      player.currentRound = { foundArtist: false, foundTitle: false, roundScore: 0, answeredAt: null };
    }

    this.startCountdown(room);
    return { success: true };
  }

  startCountdown(room) {
    this.clearRoomTimers(room);
    room.status = 'COUNTDOWN';
    room.countdownValue = COUNTDOWN_DURATION;

    for (const player of room.players.values()) {
      player.currentRound = { foundArtist: false, foundTitle: false, roundScore: 0, answeredAt: null };
    }

    this.io.to(room.id).emit('countdown_started', {
      countdown: COUNTDOWN_DURATION,
      currentRound: room.currentTrackIndex + 1,
      totalRounds: room.trackList.length,
      roomState: this.serializeRoomState(room)
    });

    room.timer = setInterval(() => {
      room.countdownValue--;
      if (room.countdownValue > 0) {
        this.io.to(room.id).emit('countdown_tick', { countdown: room.countdownValue });
      } else {
        clearInterval(room.timer);
        this.startPlayingRound(room);
      }
    }, 1000);
  }

  startPlayingRound(room) {
    this.clearRoomTimers(room);
    const track = room.trackList[room.currentTrackIndex];
    if (!track) {
      this.endGame(room);
      return;
    }

    room.status = 'PLAYING';
    room.roundStartTime = Date.now();
    room.roundTimeRemaining = ROUND_DURATION;

    // Send only previewUrl & metadata, NO artist/title (anti-cheat)
    this.io.to(room.id).emit('round_started', {
      roundIndex: room.currentTrackIndex + 1,
      totalRounds: room.trackList.length,
      previewUrl: track.previewUrl,
      duration: ROUND_DURATION,
      playlistName: room.playlistName
    });

    room.timer = setInterval(() => {
      room.roundTimeRemaining--;
      this.io.to(room.id).emit('timer_tick', { remaining: room.roundTimeRemaining });

      if (room.roundTimeRemaining <= 0) {
        clearInterval(room.timer);
        this.endRound(room, 'timeout');
      }
    }, 1000);
  }

  handleGuess(roomId, socketId, guessText) {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'PLAYING') return;

    const player = room.players.get(socketId);
    if (!player) return;

    const track = room.trackList[room.currentTrackIndex];
    if (!track) return;

    if (player.currentRound.foundArtist && player.currentRound.foundTitle) {
      return;
    }

    const evalResult = evaluateSubmission(guessText, track, {
      artist: player.currentRound.foundArtist,
      title: player.currentRound.foundTitle
    });

    if (!evalResult.matched) {
      this.io.to(socketId).emit('guess_feedback', {
        correct: false,
        message: 'Not quite, keep trying!'
      });
      return;
    }

    const now = Date.now();
    const elapsedSec = Math.min(ROUND_DURATION, (now - room.roundStartTime) / 1000);
    const remainingSec = Math.max(0, ROUND_DURATION - elapsedSec);

    let pointsAwarded = 0;
    const unlockedTypes = [];

    if (evalResult.foundArtist && !player.currentRound.foundArtist) {
      player.currentRound.foundArtist = true;
      const pts = Math.round(300 + remainingSec * 15);
      pointsAwarded += pts;
      unlockedTypes.push('artist');
    }

    if (evalResult.foundTitle && !player.currentRound.foundTitle) {
      player.currentRound.foundTitle = true;
      const pts = Math.round(400 + remainingSec * 20);
      pointsAwarded += pts;
      unlockedTypes.push('title');
    }

    const bothComplete = player.currentRound.foundArtist && player.currentRound.foundTitle;
    if (bothComplete && !player.currentRound.bothBonusGiven) {
      player.currentRound.bothBonusGiven = true;
      pointsAwarded += 250; // Bonus combo
    }

    player.score += pointsAwarded;
    player.currentRound.roundScore += pointsAwarded;
    player.currentRound.answeredAt = now;

    // Private feedback to the guesser
    this.io.to(socketId).emit('guess_feedback', {
      correct: true,
      foundArtist: player.currentRound.foundArtist,
      foundTitle: player.currentRound.foundTitle,
      bothComplete,
      pointsAwarded,
      totalScore: player.score,
      message: bothComplete 
        ? `Perfect! Found both (+${pointsAwarded} pts)` 
        : `${unlockedTypes.join(' & ')} found! (+${pointsAwarded} pts)`
    });

    // Public solve alert injected into chat feed without spoilers
    const solveType = bothComplete && evalResult.foundBoth 
      ? 'both' 
      : (unlockedTypes.includes('artist') ? 'artist' : 'title');

    const solveLabel = solveType === 'both' 
      ? 'both Artist & Title' 
      : (solveType === 'artist' ? 'the Artist' : 'the Title');

    const chatAlert = {
      id: 'sys-solve-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      type: 'system',
      systemType: 'solve',
      playerId: socketId,
      nickname: player.nickname,
      avatar: player.avatar,
      solveType,
      text: `${player.nickname} found ${solveLabel}!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.io.to(room.id).emit('chat_message', chatAlert);
    this.io.to(room.id).emit('player_solved', {
      playerId: socketId,
      nickname: player.nickname,
      avatar: player.avatar,
      solveType,
      bothComplete,
      leaderboard: this.getLeaderboard(room)
    });

    // Update leaderboard in real time
    this.io.to(room.id).emit('leaderboard_update', {
      leaderboard: this.getLeaderboard(room)
    });

    this.checkAllPlayersFinished(room);
  }

  handlePlayerChat(roomId, socketId, messageText) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.get(socketId);
    if (!player) return;

    const trimmed = (messageText || '').trim();
    if (!trimmed) return;

    const chatMsg = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      type: 'user',
      playerId: socketId,
      nickname: player.nickname,
      avatar: player.avatar,
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.io.to(room.id).emit('chat_message', chatMsg);
  }

  checkAllPlayersFinished(room) {
    if (room.players.size === 0) return;

    let allFinished = true;
    for (const player of room.players.values()) {
      if (!player.currentRound.foundArtist || !player.currentRound.foundTitle) {
        allFinished = false;
        break;
      }
    }

    if (allFinished) {
      this.clearRoomTimers(room);
      this.endRound(room, 'all_found');
    }
  }

  endRound(room, reason = 'timeout') {
    this.clearRoomTimers(room);
    room.status = 'REVEALING';

    const track = room.trackList[room.currentTrackIndex];

    // Evaluate streaks for each player at the end of the round
    for (const player of room.players.values()) {
      const foundArtist = player.currentRound.foundArtist;
      const foundTitle = player.currentRound.foundTitle;

      if (foundArtist && foundTitle) {
        // Player got BOTH answers: streak increases, flame is restored/strengthened
        player.streak = (player.streak || 0) + 1;
        player.streakWeakened = false;

        // Announce milestone streaks (e.g. 2, 3, 5, etc.) in chat
        if (player.streak >= 2) {
          this.io.to(room.id).emit('chat_message', {
            id: 'sys-streak-' + Date.now() + '-' + player.id,
            type: 'system',
            systemType: 'streak',
            nickname: player.nickname,
            streak: player.streak,
            text: `${player.nickname} is on a ${player.streak}x streak!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }
      } else if (foundArtist || foundTitle) {
        // Player only found ONE of the two
        if (player.streakWeakened) {
          // Flame was already weakened -> extinguished! Streak lost
          player.streak = 0;
          player.streakWeakened = false;
        } else if (player.streak > 0) {
          // First round with partial answer -> flame weakens for one round
          player.streakWeakened = true;
        } else {
          player.streak = 0;
          player.streakWeakened = false;
        }
      } else {
        // Player didn't answer or found nothing -> immediately extinguished, direct loss
        player.streak = 0;
        player.streakWeakened = false;
      }
    }

    const revealData = {
      roundIndex: room.currentTrackIndex + 1,
      totalRounds: room.trackList.length,
      track: {
        id: track.id,
        title: track.title,
        artist: track.artist,
        artworkUrl: track.artworkUrl,
        year: track.year
      },
      reason, // 'timeout' or 'all_found'
      leaderboard: this.getLeaderboard(room),
      duration: REVEAL_DURATION
    };

    room.history.push({
      round: room.currentTrackIndex + 1,
      track: { title: track.title, artist: track.artist, artworkUrl: track.artworkUrl }
    });

    this.io.to(room.id).emit('round_ended', revealData);

    let revealRemaining = REVEAL_DURATION;
    room.timer = setInterval(() => {
      revealRemaining--;
      if (revealRemaining <= 0) {
        clearInterval(room.timer);

        if (room.currentTrackIndex + 1 < room.trackList.length) {
          room.currentTrackIndex++;
          this.startCountdown(room);
        } else {
          this.endGame(room);
        }
      }
    }, 1000);
  }

  endGame(room) {
    this.clearRoomTimers(room);
    room.status = 'ENDED';

    const finalLeaderboard = this.getLeaderboard(room);

    this.io.to(room.id).emit('game_ended', {
      leaderboard: finalLeaderboard,
      totalRounds: room.trackList.length,
      history: room.history
    });

    this.broadcastRoomsList();
  }

  resetRoom(room) {
    this.clearRoomTimers(room);
    room.status = 'LOBBY';
    room.currentTrackIndex = 0;
    room.trackList = this.selectTracksForGame(room.playlistId, TRACKS_PER_GAME);
    room.history = [];
    for (const player of room.players.values()) {
      player.score = 0;
      player.streak = 0;
      player.streakWeakened = false;
      player.currentRound = { foundArtist: false, foundTitle: false, roundScore: 0, answeredAt: null };
    }
    this.broadcastRoomUpdate(room);
  }

  getLeaderboard(room) {
    const list = Array.from(room.players.values()).map(p => ({
      id: p.id,
      nickname: p.nickname,
      avatar: p.avatar,
      score: p.score,
      streak: p.streak || 0,
      streakWeakened: p.streakWeakened || false,
      isHost: p.isHost,
      foundArtist: p.currentRound.foundArtist,
      foundTitle: p.currentRound.foundTitle,
      roundScore: p.currentRound.roundScore
    }));

    return list.sort((a, b) => b.score - a.score);
  }

  serializeRoomState(room, requestSocketId = null) {
    const myPlayer = requestSocketId ? room.players.get(requestSocketId) : null;
    const totalCatalog = PLAYLISTS[room.playlistId]?.tracks?.length || 0;
    const availableCount = this.getAvailableTracksCount(room.playlistId);

    return {
      id: room.id,
      name: room.name,
      playlistId: room.playlistId,
      playlistName: room.playlistName,
      status: room.status,
      hostId: room.hostId,
      isHost: room.hostId === requestSocketId,
      currentTrackIndex: room.currentTrackIndex,
      totalTracks: room.trackList.length,
      totalCatalogTracks: totalCatalog,
      availableTracks: availableCount,
      countdownValue: room.countdownValue,
      roundTimeRemaining: room.roundTimeRemaining,
      players: Array.from(room.players.values()).map(p => ({
        id: p.id,
        nickname: p.nickname,
        avatar: p.avatar,
        score: p.score,
        streak: p.streak || 0,
        streakWeakened: p.streakWeakened || false,
        isHost: p.id === room.hostId,
        foundArtist: p.currentRound.foundArtist,
        foundTitle: p.currentRound.foundTitle
      })),
      leaderboard: this.getLeaderboard(room),
      myState: myPlayer ? {
        foundArtist: myPlayer.currentRound.foundArtist,
        foundTitle: myPlayer.currentRound.foundTitle,
        score: myPlayer.score,
        streak: myPlayer.streak || 0,
        streakWeakened: myPlayer.streakWeakened || false,
        roundScore: myPlayer.currentRound.roundScore
      } : null
    };
  }

  clearRoomTimers(room) {
    if (room.timer) {
      clearInterval(room.timer);
      room.timer = null;
    }
  }

  broadcastRoomUpdate(room) {
    for (const [socketId] of room.players.entries()) {
      this.io.to(socketId).emit('room_update', this.serializeRoomState(room, socketId));
    }
  }

  broadcastRoomsList() {
    this.io.emit('rooms_list', this.getPublicRooms());
  }
}
