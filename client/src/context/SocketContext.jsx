import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [gameStatus, setGameStatus] = useState('LOBBY'); // 'LOBBY' | 'COUNTDOWN' | 'PLAYING' | 'REVEALING' | 'ENDED'
  const [countdown, setCountdown] = useState(null);
  const [remainingTime, setRemainingTime] = useState(30);
  const [roundData, setRoundData] = useState(null);
  const [revealedTrack, setRevealedTrack] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myPlayerState, setMyPlayerState] = useState({
    foundArtist: false,
    foundTitle: false,
    score: 0,
    streak: 0,
    streakWeakened: false,
    roundScore: 0
  });
  const [chatMessages, setChatMessages] = useState([]);
  const [lastFeedback, setLastFeedback] = useState(null);
  const [gameEndedData, setGameEndedData] = useState(null);

  useEffect(() => {
    const serverUrl = window.location.port === '5173' ? 'http://localhost:3001' : '/';
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('[WebSocket] Connected', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
      setConnected(false);
    });

    newSocket.on('rooms_list', (roomsList) => {
      setRooms(roomsList);
    });

    newSocket.on('room_joined', (roomState) => {
      console.log('[Room] Joined:', roomState);
      setCurrentRoom(roomState);
      setGameStatus(roomState.status || 'LOBBY');
      setLeaderboard(roomState.leaderboard || []);
      if (roomState.myState) {
        setMyPlayerState(roomState.myState);
      }
      setChatMessages([]);
      setRevealedTrack(null);
      setGameEndedData(null);
    });

    newSocket.on('room_update', (roomState) => {
      setCurrentRoom(roomState);
      setGameStatus(roomState.status);
      setLeaderboard(roomState.leaderboard || []);
      if (roomState.myState) {
        setMyPlayerState(roomState.myState);
      }
    });

    newSocket.on('leaderboard_update', ({ leaderboard: lb }) => {
      if (lb) setLeaderboard(lb);
    });

    // In-game chat messages (both player chat & system events)
    newSocket.on('chat_message', (msg) => {
      setChatMessages(prev => [...prev.slice(-60), msg]);
    });

    newSocket.on('countdown_started', ({ countdown: cd, currentRound, totalRounds, roomState }) => {
      setGameStatus('COUNTDOWN');
      setCountdown(cd);
      setRevealedTrack(null);
      setLastFeedback(null);
      setMyPlayerState(prev => ({ ...prev, foundArtist: false, foundTitle: false, roundScore: 0 }));
      if (roomState) {
        setCurrentRoom(roomState);
        setLeaderboard(roomState.leaderboard || []);
      }
    });

    newSocket.on('countdown_tick', ({ countdown: cd }) => {
      setCountdown(cd);
    });

    newSocket.on('round_started', (data) => {
      console.log('[Round] Started:', data);
      setGameStatus('PLAYING');
      setCountdown(null);
      setRoundData(data);
      setRemainingTime(data.duration || 30);
      setRevealedTrack(null);
      setLastFeedback(null);
      setMyPlayerState(prev => ({ ...prev, foundArtist: false, foundTitle: false, roundScore: 0 }));
    });

    newSocket.on('timer_tick', ({ remaining }) => {
      setRemainingTime(remaining);
    });

    newSocket.on('guess_feedback', (feedback) => {
      setLastFeedback(feedback);
      if (feedback.correct) {
        setMyPlayerState(prev => ({
          ...prev,
          foundArtist: feedback.foundArtist ?? prev.foundArtist,
          foundTitle: feedback.foundTitle ?? prev.foundTitle,
          score: feedback.totalScore ?? prev.score,
          roundScore: (prev.roundScore || 0) + (feedback.pointsAwarded || 0)
        }));
      }
    });

    newSocket.on('round_ended', (data) => {
      console.log('[Round] Ended, reveal:', data);
      setGameStatus('REVEALING');
      setRevealedTrack(data);
      setLeaderboard(data.leaderboard || []);
      setRoundData(null);
    });

    newSocket.on('game_ended', (data) => {
      console.log('[Game] Ended:', data);
      setGameStatus('ENDED');
      setGameEndedData(data);
      setLeaderboard(data.leaderboard || []);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinRoom = useCallback((roomId, nickname, avatar) => {
    if (!socket) return;
    socket.emit('join_room', { roomId, nickname, avatar });
  }, [socket]);

  const leaveRoom = useCallback(() => {
    if (!socket) return;
    socket.emit('leave_room');
    setCurrentRoom(null);
    setGameStatus('LOBBY');
    setRoundData(null);
    setRevealedTrack(null);
    setGameEndedData(null);
  }, [socket]);

  const startGame = useCallback(() => {
    if (!socket) return;
    socket.emit('start_game');
  }, [socket]);

  const submitGuess = useCallback((guess) => {
    if (!socket || !guess.trim()) return;
    socket.emit('submit_guess', { guess: guess.trim() });
  }, [socket]);

  const sendChatMessage = useCallback((text) => {
    if (!socket || !text.trim()) return;
    socket.emit('send_chat_message', { text: text.trim() });
  }, [socket]);

  const createRoom = useCallback((name, playlistId) => {
    if (!socket) return;
    socket.emit('create_room', { name, playlistId });
  }, [socket]);

  return (
    <SocketContext.Provider value={{
      socket,
      connected,
      rooms,
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
      joinRoom,
      leaveRoom,
      startGame,
      submitGuess,
      sendChatMessage,
      createRoom
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
