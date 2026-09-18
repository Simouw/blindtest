import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);
const emptyPlayer = { foundArtist: false, foundTitle: false, score: 0, roundScore: 0, passed: false };

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const pendingTimer = useRef(null);
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [gameStatus, setGameStatus] = useState('LOBBY');
  const [countdown, setCountdown] = useState(null);
  const [remainingTime, setRemainingTime] = useState(30);
  const [revealRemaining, setRevealRemaining] = useState(0);
  const [roundData, setRoundData] = useState(null);
  const [roundCue, setRoundCue] = useState(null);
  const [revealedTrack, setRevealedTrack] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myPlayerState, setMyPlayerState] = useState(emptyPlayer);
  const [chatMessages, setChatMessages] = useState([]);
  const [lastFeedback, setLastFeedback] = useState(null);
  const [gameEndedData, setGameEndedData] = useState(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const reset = () => {
    setCurrentRoom(null); setGameStatus('LOBBY'); setRoundData(null); setRoundCue(null);
    setRevealedTrack(null); setGameEndedData(null); setCountdown(null);
    setMyPlayerState(emptyPlayer); setLastFeedback(null); setChatMessages([]);
  };
  const finishRequest = () => { clearTimeout(pendingTimer.current); setPending(false); };

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SERVER_URL || window.location.origin, {
      reconnectionDelay: 1000, reconnectionDelayMax: 5000
    });
    socketRef.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => {
      setConnected(false); finishRequest(); reset();
      setError('Connection interrupted. Rejoin a room when you’re back online. Your previous score has been reset.');
    });
    socket.on('rooms_list', setRooms);
    const reportError = ({ message }) => { finishRequest(); setError(message); };
    socket.on('game_error', reportError);
    socket.on('error', reportError);
    socket.on('room_joined', room => {
      reset(); finishRequest(); setError(''); setCurrentRoom(room);
      setGameStatus(room.status); setLeaderboard(room.leaderboard || []);
      setMyPlayerState(room.myState || emptyPlayer);
      const url = new URL(window.location.href); url.searchParams.set('room', room.id);
      window.history.replaceState({}, '', url);
    });
    socket.on('room_update', room => {
      setCurrentRoom(room); setGameStatus(room.status); setLeaderboard(room.leaderboard || []);
      if (room.myState) setMyPlayerState(room.myState);
    });
    socket.on('leaderboard_update', ({ leaderboard }) => setLeaderboard(leaderboard));
    socket.on('chat_message', msg => setChatMessages(prev => [...prev.slice(-59), msg]));
    socket.on('countdown_started', ({ countdown, roomState }) => {
      finishRequest(); setGameStatus('COUNTDOWN'); setCountdown(countdown);
      setGameEndedData(null); setRevealedTrack(null); setRoundData(null); setLastFeedback(null);
      setMyPlayerState(emptyPlayer);
      if (roomState) { setCurrentRoom(roomState); setLeaderboard(roomState.leaderboard || []); }
    });
    socket.on('countdown_tick', ({ countdown }) => setCountdown(countdown));
    socket.on('round_started', data => {
      setGameStatus('PLAYING'); setCountdown(null); setRoundData(data);
      setRoundCue(data.cue || null);
      setRemainingTime(data.remaining ?? data.duration); setRevealedTrack(null); setLastFeedback(null);
      setMyPlayerState(prev => ({ ...prev, foundArtist: false, foundTitle: false, roundScore: 0, passed: false }));
    });
    socket.on('timer_tick', ({ remaining }) => setRemainingTime(remaining));
    socket.on('last_chance_cue', setRoundCue);
    socket.on('reveal_tick', ({ remaining }) => setRevealRemaining(remaining));
    socket.on('guess_feedback', feedback => {
      setLastFeedback({ ...feedback, feedbackId: `${Date.now()}-${Math.random()}` });
      if (feedback.correct) setMyPlayerState(prev => ({ ...prev,
        foundArtist: feedback.foundArtist, foundTitle: feedback.foundTitle,
        score: feedback.totalScore, roundScore: prev.roundScore + feedback.pointsAwarded
      }));
    });
    socket.on('round_ended', data => {
      setGameStatus('REVEALING'); setRevealedTrack(data); setRevealRemaining(data.duration);
      setLeaderboard(data.leaderboard || []);
    });
    socket.on('game_ended', data => {
      setGameStatus('ENDED'); setGameEndedData(data); setLeaderboard(data.leaderboard || []);
      setRoundData(null);
    });
    return () => { clearTimeout(pendingTimer.current); socket.close(); };
  }, []);

  const emit = (event, data) => {
    if (!socketRef.current?.connected) return false;
    socketRef.current.emit(event, data); return true;
  };
  const request = (event, data) => {
    if (pending || !socketRef.current?.connected) return;
    setError(''); setPending(true); emit(event, data);
    clearTimeout(pendingTimer.current);
    pendingTimer.current = setTimeout(() => { setPending(false); setError('That took too long. Please try again.'); }, 8000);
  };
  const leaveRoom = () => {
    emit('leave_room'); finishRequest(); reset(); setError('');
    const url = new URL(window.location.href); url.searchParams.delete('room');
    window.history.replaceState({}, '', url);
  };

  return <SocketContext.Provider value={{
    socket: socketRef.current, connected, rooms, currentRoom, gameStatus, countdown, remainingTime,
    revealRemaining, roundData, roundCue, revealedTrack, leaderboard, myPlayerState, chatMessages,
    lastFeedback, gameEndedData, error, pending, clearError: () => setError(''),
    joinRoom: (roomId, nickname, avatar) => request('join_room', { roomId, nickname, avatar }),
    createRoom: (name, playlistId, nickname, avatar) => request('create_room', { name, playlistId, nickname, avatar }),
    leaveRoom, startGame: () => request('start_game'),
    submitGuess: guess => emit('submit_guess', { guess }),
    sendChatMessage: text => emit('send_chat_message', { text }),
    passRound: () => emit('pass_round'), nextRound: () => emit('next_round')
  }}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);
