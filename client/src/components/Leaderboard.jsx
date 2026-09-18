import React from 'react';
import { Crown } from 'lucide-react';
import AvatarIcon from './AvatarIcon';
export default function Leaderboard({ players = [], currentUserId, playing = false }) {
  return <section className="leaderboard" aria-label="Scoreboard">
    <div className="section-heading"><div><span className="eyebrow">SCOREBOARD</span><h2>In the room</h2></div><span>{players.length}</span></div>
    <ol>{players.map((player, index) => {
      const status = playing ? player.passed ? 'Passed' : player.foundArtist && player.foundTitle ? 'Both' : player.foundArtist ? 'Artist' : player.foundTitle ? 'Title' : 'Listening' : player.isHost ? 'Host' : 'Ready';
      return <li key={player.id} className={(player.id === currentUserId ? 'current-player ' : '') + (player.foundArtist && player.foundTitle ? 'solved' : '')}>
      <span className="rank">{String(index + 1).padStart(2, '0')}</span><AvatarIcon id={player.avatar} containerClassName="small-avatar" />
      <div className="player-name"><strong>{player.nickname} {player.isHost && <Crown size={11} aria-label="Host" />} {player.id === currentUserId && <small>you</small>}</strong></div>
      <span className="player-status"><i />{status}</span>
      <strong className="player-score">{player.score.toLocaleString()}</strong>
    </li>;})}</ol>
  </section>;
}
