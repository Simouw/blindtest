import React, { useEffect, useState } from 'react';
import { WifiOff, X } from 'lucide-react';
import { SocketProvider, useSocket } from './context/SocketContext';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import { SoundEffects } from './components/ui/sound';

function MainApp() {
  const { currentRoom, connected, error, clearError } = useSocket();
  const [nickname, setNickname] = useState(() => localStorage.getItem('blindtest_nickname') || 'Player' + Math.floor(Math.random() * 900 + 100));
  const [avatar, setAvatar] = useState(() => localStorage.getItem('blindtest_avatar') || 'headphones');
  useEffect(() => { localStorage.setItem('blindtest_nickname', nickname); }, [nickname]);
  useEffect(() => { localStorage.setItem('blindtest_avatar', avatar); }, [avatar]);
  return <div className="app-shell">
    {!connected && <div className="connection-banner" role="status"><WifiOff size={16} /> Connecting… Play will be available when you’re online.</div>}
    {error && <div className="error-banner" role="alert"><span>{error}</span><button className="icon-button" onClick={clearError} aria-label="Dismiss error"><X size={18} /></button></div>}
    {currentRoom ? <GameRoom /> : <Lobby {...{ nickname, setNickname, avatar, setAvatar }} />}
  </div>;
}

export default function App() { return <SoundEffects><SocketProvider><MainApp /></SocketProvider></SoundEffects>; }
