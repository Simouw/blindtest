import test from 'node:test';
import assert from 'node:assert/strict';
import { GameManager, COUNTDOWN_DURATION, REVEAL_DURATION, TRACKS_PER_GAME } from '../src/gameEngine.js';

function setup(t) {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 10000 });
  const events = [];
  const io = { to: target => ({ emit: (event, data) => events.push({ target, event, data }) }), emit: (event, data) => events.push({ target: '*', event, data }) };
  const gm = new GameManager(io);
  const join = (id, roomId = 'rap-us-room') => {
    const socket = { id, join() {}, leave() {}, emit: (event, data) => events.push({ target: id, event, data }) };
    gm.joinRoom(roomId, socket, { nickname: id, avatar: 'headphones' });
    return socket;
  };
  const room = gm.rooms.get('rap-us-room');
  const tick = seconds => { for (let i = 0; i < seconds; i++) t.mock.timers.tick(1000); };
  const start = () => { gm.startGame(room.id, 'host'); tick(COUNTDOWN_DURATION); };
  t.after(() => { for (const room of gm.rooms.values()) gm.clearRoomTimers(room); });
  return { gm, room, events, join, tick, start };
}

test('one ready cue; reveal advances directly to the next song', t => {
  const { gm, room, events, join, tick, start } = setup(t);
  join('host'); start(); gm.passRound(room.id, 'host');
  assert.equal(room.status, 'REVEALING');
  tick(REVEAL_DURATION);
  assert.equal(room.status, 'PLAYING');
  assert.equal(room.currentTrackIndex, 1);
  assert.equal(events.filter(e => e.event === 'countdown_started').length, 1);
  assert.equal(room.players.get('host').currentRound.passed, false);
  assert.equal(events.find(e => e.event === 'reveal_tick').data.remaining, REVEAL_DURATION - 1);
});

test('passing preserves partial credit; next round clears flags and round points', t => {
  const { gm, room, join, start } = setup(t);
  join('host'); join('friend'); start();
  const track = room.trackList[0];
  gm.handleGuess(room.id, 'host', track.artist);
  const player = room.players.get('host'), score = player.score;
  assert.ok(score > 0);
  gm.passRound(room.id, 'host');
  assert.equal(room.status, 'PLAYING');
  gm.handleGuess(room.id, 'host', track.title);
  assert.equal(player.score, score);
  gm.passRound(room.id, 'friend');
  assert.equal(room.status, 'REVEALING');
  gm.nextRound(room.id, 'host');
  assert.equal(player.score, score);
  assert.equal(player.currentRound.roundScore, 0);
  assert.equal(player.currentRound.foundArtist, false);
  assert.equal(player.currentRound.foundTitle, false);
  assert.equal(player.currentRound.passed, false);
});

test('late join receives live audio and remaining time without secret answers', t => {
  const { room, events, join, tick, start } = setup(t);
  join('host'); start(); tick(8); join('late');
  const data = events.findLast(e => e.target === 'late' && e.event === 'round_started').data;
  assert.equal(data.remaining, 22);
  assert.equal(data.previewUrl, room.trackList[0].previewUrl);
  assert.equal(data.artworkUrl, room.trackList[0].artworkUrl);
  assert.equal(data.title, undefined);
  assert.equal(data.artist, undefined);
  assert.equal(data.startedAt, room.roundStartTime);
});

test('last three seconds reveal a bounded clue without exposing the answer', t => {
  const { room, events, join, tick, start } = setup(t);
  join('host'); start(); tick(27);
  const track = room.trackList[0];
  const cue = events.findLast(e => e.event === 'last_chance_cue').data;
  assert.deepEqual(cue, {
    artistInitial: track.artist.charAt(0).toUpperCase(),
    titleWords: track.title.trim().split(/\s+/).length,
    year: track.year || null
  });
  assert.equal(cue.artist, undefined);
  assert.equal(cue.title, undefined);
  join('late');
  assert.deepEqual(events.findLast(e => e.target === 'late' && e.event === 'round_started').data.cue, cue);
});

test('late join during reveal and results receives the current screen state', t => {
  const { gm, room, events, join, tick, start } = setup(t);
  join('host'); start(); gm.passRound(room.id, 'host'); tick(1); join('late');
  const reveal = events.findLast(e => e.target === 'late' && e.event === 'round_ended').data;
  assert.equal(reveal.duration, REVEAL_DURATION - 1);
  assert.equal(reveal.track.title, room.trackList[0].title);
  assert.equal(reveal.leaderboard.length, 2);
  gm.endGame(room); join('guest');
  assert.equal(events.findLast(e => e.target === 'guest' && e.event === 'game_ended').data.leaderboard.length, 3);
});

test('host-only start and advance; nobody can restart during a reveal', t => {
  const { gm, room, join, start } = setup(t);
  join('host'); join('friend');
  assert.ok(gm.startGame(room.id, 'friend').error);
  start(); gm.passRound(room.id, 'host'); gm.passRound(room.id, 'friend');
  assert.ok(gm.startGame(room.id, 'host').error);
  gm.nextRound(room.id, 'friend');
  assert.equal(room.status, 'REVEALING');
  gm.nextRound(room.id, 'host');
  assert.equal(room.currentTrackIndex, 1);
});

test('ten rounds end cleanly; replay clears history and score', t => {
  const { gm, room, events, join, start } = setup(t);
  join('host'); start();
  for (let i = 0; i < TRACKS_PER_GAME; i++) {
    assert.equal(room.status, 'PLAYING');
    gm.passRound(room.id, 'host'); gm.nextRound(room.id, 'host');
  }
  assert.equal(room.status, 'ENDED');
  assert.equal(room.history.length, TRACKS_PER_GAME);
  assert.equal(room.timer, null);
  assert.equal(events.filter(e => e.event === 'countdown_started').length, 1);
  gm.startGame(room.id, 'host');
  assert.equal(room.history.length, 0);
  assert.equal(room.currentTrackIndex, 0);
  assert.equal(room.players.get('host').score, 0);
});

test('departing host transfers controls; empty rooms stop timers', t => {
  const { gm, room, join, start } = setup(t);
  const host = join('host'), friend = join('friend');
  start(); gm.leaveRoom(host);
  assert.equal(room.hostId, 'friend');
  assert.equal(gm.serializeRoomState(room, 'friend').isHost, true);
  gm.leaveRoom(friend);
  assert.equal(room.status, 'LOBBY');
  assert.equal(room.timer, null);
});

test('switching rooms leaves no ghost player behind', t => {
  const { gm, room, join } = setup(t);
  const host = join('host');
  gm.joinRoom('pop-2000-room', host, { nickname: 'host' });
  assert.equal(room.players.size, 0);
  assert.equal(host.roomId, 'pop-2000-room');
});

test('timeout reveals answer and broadcasts progress to lobby', t => {
  const { room, events, join, tick, start } = setup(t);
  join('host'); start(); tick(30);
  assert.equal(room.status, 'REVEALING');
  assert.equal(events.findLast(e => e.event === 'round_ended').data.reason, 'timeout');
  assert.equal(events.findLast(e => e.event === 'rooms_list').data.find(r => r.id === room.id).status, 'REVEALING');
});
