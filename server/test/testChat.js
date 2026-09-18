import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ClientIO } from 'socket.io-client';
import express from 'express';
import { GameManager } from '../src/gameEngine.js';

async function testChat() {
  console.log('--- Testing In-Game Chat System ---');
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  const gm = new GameManager(io);

  io.on('connection', (socket) => {
    socket.on('join_room', ({ roomId, nickname, avatar }) => {
      gm.joinRoom(roomId, socket, { nickname, avatar });
    });
    socket.on('send_chat_message', ({ text }) => {
      gm.handlePlayerChat(socket.roomId, socket.id, text);
    });
  });

  await new Promise(r => httpServer.listen(3098, r));

  const c1 = ClientIO('http://localhost:3098');
  const c2 = ClientIO('http://localhost:3098');

  await Promise.all([
    new Promise(r => c1.on('connect', r)),
    new Promise(r => c2.on('connect', r))
  ]);

  c1.emit('join_room', { roomId: 'chat-test-room', nickname: 'Alice', avatar: 'mic' });
  c2.emit('join_room', { roomId: 'chat-test-room', nickname: 'Bob', avatar: 'flame' });

  await new Promise(r => setTimeout(r, 100));

  const receivedPromise = new Promise((resolve) => {
    c2.on('chat_message', (msg) => {
      if (msg.type === 'user' && msg.text === 'Hey Bob, ready for the blindtest?') {
        console.log('✓ Bob received message from Alice:', msg);
        resolve(msg);
      }
    });
  });

  c1.emit('send_chat_message', { text: 'Hey Bob, ready for the blindtest?' });

  await receivedPromise;

  c1.disconnect();
  c2.disconnect();
  httpServer.close();

  console.log('✓ In-Game Chat test passed successfully!');
}

testChat().catch(e => { console.error(e); process.exit(1); });
