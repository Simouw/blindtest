import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ClientIO } from 'socket.io-client';
import express from 'express';
import { GameManager } from '../src/gameEngine.js';

async function runTest() {
  console.log('--- Starting Game Server Integration Test ---');
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  const gm = new GameManager(io);

  io.on('connection', (socket) => {
    socket.emit('rooms_list', gm.getPublicRooms());
    socket.on('join_room', ({ roomId, nickname, avatar }) => {
      gm.joinRoom(roomId, socket, { nickname, avatar });
    });
    socket.on('start_game', () => {
      gm.startGame(socket.roomId, socket.id);
    });
    socket.on('submit_guess', ({ guess }) => {
      gm.handleGuess(socket.roomId, socket.id, guess);
    });
  });

  await new Promise((resolve) => httpServer.listen(3099, resolve));
  console.log('✓ Test server listening on 3099');

  const client1 = ClientIO('http://localhost:3099');
  const client2 = ClientIO('http://localhost:3099');

  await new Promise((resolve) => {
    let connected = 0;
    const check = () => { connected++; if (connected === 2) resolve(); };
    client1.on('connect', check);
    client2.on('connect', check);
  });
  console.log('✓ Both test clients connected');

  // Client 1 joins rap-us-room
  client1.emit('join_room', { roomId: 'rap-us-room', nickname: 'Alex', avatar: '😎' });
  await new Promise((r) => client1.once('room_joined', r));
  console.log('✓ Client 1 joined rap-us-room');

  // Client 2 joins rap-us-room
  client2.emit('join_room', { roomId: 'rap-us-room', nickname: 'Sarah', avatar: '🎸' });
  await new Promise((r) => client2.once('room_joined', r));
  console.log('✓ Client 2 joined rap-us-room');

  // Start game
  client1.emit('start_game');

  const roundStartPromise = new Promise((resolve) => {
    client1.once('round_started', (data) => {
      console.log('✓ Round started received by client 1:', {
        roundIndex: data.roundIndex,
        totalRounds: data.totalRounds,
        hasPreviewUrl: !!data.previewUrl
      });
      resolve(data);
    });
  });

  // Since countdown is 5s, let's accelerate countdown for the test or wait
  // Let's wait for round_started
  console.log('⏳ Waiting for countdown to finish (5s)...');
  const roundData = await roundStartPromise;

  // Let's find out what the active track is in the room on server
  const room = gm.rooms.get('rap-us-room');
  const currentTrack = room.trackList[room.currentTrackIndex];
  console.log(`Current secret track: ${currentTrack.artist} - ${currentTrack.title}`);

  // Client 1 submits guess for the artist with a typo!
  const typoArtist = currentTrack.artist + 'x'; // slight typo or lowercase
  console.log(`Client 1 submits artist guess: "${typoArtist}"`);
  
  const feedbackPromise = new Promise((resolve) => {
    client1.once('guess_feedback', (fb) => {
      console.log('✓ Client 1 received guess feedback:', fb);
      resolve(fb);
    });
  });

  const playerSolvedPromise = new Promise((resolve) => {
    client2.once('player_solved', (data) => {
      console.log('✓ Client 2 received solve alert (without spoiler!):', data.nickname, data.solveType);
      resolve(data);
    });
  });

  client1.emit('submit_guess', { guess: typoArtist });

  const [feedback, solveNotification] = await Promise.all([feedbackPromise, playerSolvedPromise]);

  if (!feedback.correct || !feedback.foundArtist) {
    throw new Error('Fuzzy matching failed to recognize artist typo!');
  }

  // Client 1 submits title
  console.log(`Client 1 submits title guess: "${currentTrack.title}"`);
  client1.emit('submit_guess', { guess: currentTrack.title });
  const fb2 = await new Promise((r) => client1.once('guess_feedback', r));
  console.log('✓ Client 1 received title feedback:', fb2);

  if (!fb2.bothComplete) {
    throw new Error('Expected bothComplete to be true for Client 1');
  }

  // Client 2 submits both as "Artist - Title"
  console.log(`Client 2 submits both: "${currentTrack.artist} - ${currentTrack.title}"`);
  client2.emit('submit_guess', { guess: `${currentTrack.artist} - ${currentTrack.title}` });

  // Both finished! Round should trigger 'round_ended' early!
  const roundEndedData = await new Promise((resolve) => {
    client1.once('round_ended', resolve);
  });

  console.log('✓ Round ended triggered (all_found)! Revealed track:', roundEndedData.track.title, 'by', roundEndedData.track.artist);
  console.log('✓ Leaderboard:', roundEndedData.leaderboard.map(p => `${p.nickname}: ${p.score} pts`));

  // Clean up
  client1.disconnect();
  client2.disconnect();
  gm.clearRoomTimers(room);
  httpServer.close();

  console.log('\nINTEGRATION TEST SUCCESSFUL! 🚀');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
