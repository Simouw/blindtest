import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, Play, Plus, Users, X } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { AVATAR_OPTIONS } from './AvatarIcon';
import BrandMark from './BrandMark';
import { SoundToggle } from './ui/sound';

const playlists = [
  { id: 'rap-us-room', title: 'Rap US', subtitle: 'Classics & current', description: 'From Tupac to Kendrick. Know your verses?', theme: 'rap', cover: <>RAP<br />US<span>CLASSICS / CURRENT</span></> },
  { id: 'pop-2000-room', title: '2000s Pop', subtitle: 'The songs you grew up on', description: 'Rihanna, Britney, Gaga. You know the chorus.', theme: 'pop', cover: <>POP<br /><i>00s</i><span>THE THROWBACK COLLECTION</span></> },
  { id: 'emo-alt-room', title: 'Emo & Alt', subtitle: 'From goth to new gen', description: 'Linkin Park, Deftones, MCR, The Cure, Panchiko. Loud guitars, low moods.', theme: 'emo', cover: <>EMO<br />ALT<span>OLD / NEW / LOUD</span></> }
];

export default function Lobby({ nickname, setNickname, avatar, setAvatar }) {
  const { rooms, connected, pending, joinRoom, createRoom } = useSocket();
  const [showAvatars, setShowAvatars] = useState(false);
  const [roomName, setRoomName] = useState('Friday night');
  const [playlistId, setPlaylistId] = useState(() => localStorage.getItem('blindtest_playlist') || 'rap_us');
  const dialog = useRef(null);
  const nameInput = useRef(null);
  const roomInput = useRef(null);
  const inviteId = new URL(window.location.href).searchParams.get('room');
  const invite = rooms.find(room => room.id === inviteId);
  const canPlay = connected && !pending && !!nickname.trim();
  const customRooms = rooms.filter(room => !room.isDefault);
  const selectedAvatar = AVATAR_OPTIONS.find(item => item.id === avatar) || AVATAR_OPTIONS[0];
  const SelectedAvatarIcon = selectedAvatar.icon;

  useEffect(() => { localStorage.setItem('blindtest_playlist', playlistId); }, [playlistId]);

  const join = id => {
    if (!nickname.trim()) { nameInput.current?.focus(); return; }
    joinRoom(id, nickname.trim(), avatar);
  };

  const openRoomDialog = () => {
    dialog.current.showModal();
    requestAnimationFrame(() => { roomInput.current?.focus(); roomInput.current?.select(); });
  };

  return <div className="page lobby-page">
    <header className="site-header">
      <a className="brand" href="./" aria-label="Blindtest home" data-slot="brand-link"><BrandMark /><span>blindtest<span className="brand-dot">.</span></span></a>
      <div className="header-tools">
        <SoundToggle />
        <a className="quiet-link" href="#how-it-works" data-slot="help-link">How it works <ArrowUpRight size={14} /></a>
      </div>
    </header>

    <main>
      <div className="lobby-dashboard">
      <section className="lobby-hero" aria-labelledby="lobby-title">
        <div className="intro-copy">
          <p className="eyebrow">LIVE MUSIC QUIZ</p>
          <h1 id="lobby-title">Hear it.<br />Name it.</h1>
          <p>Ten songs. Thirty seconds each. Play solo now or bring friends into the same room.</p>
          <div className="hero-rules" aria-label="Game details">
            <span><strong>10</strong> songs</span>
            <span><strong>30</strong> seconds</span>
            <span><strong>2</strong> ways to score</span>
          </div>
        </div>

        <div className="scoring-preview" aria-label="How scoring works">
          <div className="scoring-title"><span className="eyebrow">HOW POINTS LAND</span><small>Faster answers score more</small></div>
          <div className="score-row"><span><i />Artist found</span><strong>up to 750</strong></div>
          <div className="score-row"><span><i />Title found</span><strong>up to 1,000</strong></div>
          <div className="score-row bonus"><span><i />Both completed</span><strong>+250</strong></div>
        </div>

        <div className="player-card">
          <div className="player-card-heading">
            <div>
              <span className="eyebrow">YOUR PLAYER</span>
              <h2>Ready when you are.</h2>
            </div>
            <span className={'connection-state ' + (connected ? 'online' : '')}><i />{connected ? 'Online' : 'Connecting'}</span>
          </div>
          <div className="identity">
            <button
              className="avatar-button"
              data-slot="avatar-trigger"
              aria-label={`Choose avatar. Current: ${selectedAvatar.label}`}
              aria-expanded={showAvatars}
              onClick={() => setShowAvatars(value => !value)}
            ><SelectedAvatarIcon size={26} strokeWidth={1.7} /></button>
            <div className="name-field">
              <label htmlFor="nickname">Playing as</label>
              <input ref={nameInput} id="nickname" value={nickname} onChange={event => setNickname(event.target.value)} maxLength={20} placeholder="Your name" autoComplete="nickname" aria-describedby={!nickname.trim() ? 'name-help' : undefined} />
            </div>
            <Check className="identity-check" size={17} aria-hidden="true" />
          </div>
          {!nickname.trim() ? <span id="name-help" className="field-error">Add a name before choosing a playlist.</span> : <p className="setup-note">Saved on this device. No account needed.</p>}
          {showAvatars && <div className="avatar-picker" role="group" aria-label="Choose your avatar" onKeyDown={event => { if (event.key === 'Escape') setShowAvatars(false); }}>
            {AVATAR_OPTIONS.map(item => <button className={'avatar-choice ' + (avatar === item.id ? 'selected' : '')} data-slot="avatar-option" key={item.id} aria-label={item.label} aria-pressed={avatar === item.id} onClick={() => { setAvatar(item.id); setShowAvatars(false); }}><item.icon size={22} /></button>)}
          </div>}
        </div>
      </section>

      <div className="lobby-catalog">
      {inviteId && <section className="invite-banner">
        <div><strong>{invite ? `You’re invited to ${invite.name}` : connected ? 'This room is no longer available' : 'Finding your room…'}</strong><p>{invite ? 'Your friends are waiting. Join when you’re ready.' : 'You can still choose a playlist below.'}</p></div>
        {invite && <button className="button primary" data-slot="button" disabled={!canPlay} onClick={() => join(invite.id)}>Join room <ArrowRight size={16} /></button>}
      </section>}

      <section aria-labelledby="playlist-heading" className="playlist-section">
        <div className="section-heading"><div><span className="eyebrow">CHOOSE YOUR SOUND</span><h2 id="playlist-heading">Pick a playlist</h2></div><span>Start instantly</span></div>
        <div className="playlist-grid">
          {playlists.map(playlist => {
            const room = rooms.find(room => room.id === playlist.id);
            const running = room && !['LOBBY', 'ENDED'].includes(room.status);
            return <article className={'playlist-card ' + playlist.theme} key={playlist.id}>
              <div className="playlist-art" aria-hidden="true"><div className="cover-type">{playlist.cover}</div><span className="cover-disc" /></div>
              <div className="playlist-details">
                <p className="eyebrow">{playlist.subtitle}</p>
                <h3>{playlist.title}</h3>
                <p className="playlist-description">{playlist.description}</p>
                <div className="room-availability">{running ? <><span className="live-dot" /> Round {room.currentRound} of {room.totalRounds}</> : <><Users size={14} />{room?.playerCount ? `${room.playerCount} in the room` : 'Solo or multiplayer'}</>}</div>
                <button className="button primary playlist-play" data-slot="button" disabled={!canPlay || !room} onClick={() => join(playlist.id)}><Play size={15} fill="currentColor" />{pending ? 'Joining…' : running ? 'Join game' : `Play ${playlist.title}`}<ArrowRight size={16} /></button>
              </div>
            </article>;
          })}
        </div>
      </section>

      <section className="friends-section" aria-labelledby="friends-heading">
        <div><span className="eyebrow">MULTIPLAYER</span><h2 id="friends-heading">Make it your room.</h2><p>Choose the playlist, share one link, and settle who knows it best.</p></div>
        <button className="button secondary" data-sound="open" disabled={!connected || pending} onClick={openRoomDialog}><Plus size={17} />Create a private room</button>
      </section>
      </div>
      </div>

      {customRooms.length > 0 && <section className="open-rooms" aria-label="Open rooms"><h2>Open rooms</h2>{customRooms.map(room => <div className="room-row" key={room.id}><div><strong>{room.name}</strong><span>{room.playlistName} · {room.playerCount} {room.playerCount === 1 ? 'player' : 'players'} · {['LOBBY','ENDED'].includes(room.status) ? 'Ready' : 'In progress'}</span></div><button className="button secondary" data-slot="button" disabled={!canPlay} onClick={() => join(room.id)}>Join <ArrowRight size={16} /></button></div>)}</section>}

      <section id="how-it-works" className="how-it-works" aria-label="How to play">
        <div><span>01</span><p><strong>Listen</strong>The clip starts for everyone at once.</p></div>
        <div><span>02</span><p><strong>Type what you know</strong>Artist and title score separately.</p></div>
        <div><span>03</span><p><strong>Be quick</strong>Correct answers are worth more early.</p></div>
      </section>
    </main>

    <footer className="site-footer"><span>Made for the “wait, I know this” moment.</span><BrandMark /></footer>

    <dialog ref={dialog} className="room-dialog" aria-label="Create a room" onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}>
      <form onSubmit={event => { event.preventDefault(); if (!canPlay || !roomName.trim()) return; createRoom(roomName.trim(), playlistId, nickname.trim(), avatar); dialog.current.close(); }}>
        <div className="section-heading"><div><span className="eyebrow">NEW ROOM</span><h2>Make it a music night.</h2></div><button type="button" className="icon-button" data-slot="dialog-close" aria-label="Close create room" onClick={() => dialog.current.close()}><X size={20} /></button></div>
        <p>Invite friends with one link, then start when everyone is in.</p>
        <label htmlFor="room-name">Room name</label><input ref={roomInput} id="room-name" value={roomName} onChange={event => setRoomName(event.target.value)} maxLength={40} required />
        <label htmlFor="room-playlist">Playlist</label><select id="room-playlist" value={playlistId} onChange={event => setPlaylistId(event.target.value)}><option value="rap_us">Rap US</option><option value="pop_2000">2000s Pop</option><option value="emo_alt">Emo &amp; Alt</option></select>
        {!nickname.trim() && <p className="field-error">Close this window and add your player name first.</p>}
        <button className="button primary full-width" data-slot="button" disabled={!canPlay || !roomName.trim()}>Create and enter <ArrowRight size={16} /></button>
      </form>
    </dialog>
  </div>;
}
