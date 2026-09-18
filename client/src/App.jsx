import React, { useState, useEffect } from 'react';
import { useSocket, SocketProvider } from './context/SocketContext';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import { WifiOff, Music } from 'lucide-react';

function MainApp() {
  const { currentRoom, connected } = useSocket();
  const [nickname, setNickname] = useState(() => {
    return localStorage.getItem('blindtest_nickname') || `Player${Math.floor(Math.random() * 900 + 100)}`;
  });
  const [avatar, setAvatar] = useState(() => {
    const saved = localStorage.getItem('blindtest_avatar');
    return saved && !saved.match(/[\u{1F300}-\u{1F9FF}]/u) ? saved : 'headphones';
  });

  useEffect(() => {
    if (nickname) localStorage.setItem('blindtest_nickname', nickname);
  }, [nickname]);

  useEffect(() => {
    if (avatar) localStorage.setItem('blindtest_avatar', avatar);
  }, [avatar]);

  return (
    <div className="min-h-screen bg-[#0d0d10] text-[#f8fafc] flex flex-col justify-between selection:bg-mauve-500/30 selection:text-white">
      {/* Offline Alert */}
      {!connected && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-300 text-xs font-semibold px-4 py-2 text-center flex items-center justify-center gap-2 sticky top-0 z-50 backdrop-blur-md">
          <WifiOff className="w-4 h-4 text-amber-400" />
          <span>Connecting to server on port 3001... Please ensure backend is running.</span>
        </div>
      )}

      {/* Main View: Lobby or GameRoom */}
      <div className="flex-1 flex flex-col">
        {!currentRoom ? (
          <Lobby
            nickname={nickname}
            setNickname={setNickname}
            avatar={avatar}
            setAvatar={setAvatar}
          />
        ) : (
          <GameRoom />
        )}
      </div>

      {/* Clean Modern Footer */}
      <footer className="py-6 border-t border-[#1d1d28] text-center text-xs text-neutral-500 font-medium">
        <div className="flex items-center justify-center gap-2">
          <Music className="w-3.5 h-3.5 text-mauve-400" />
          <span>Blindtest Live • Real-Time Music Trivia • 200 Tracks Across Rap US & 2000s Pop</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <MainApp />
    </SocketProvider>
  );
}
