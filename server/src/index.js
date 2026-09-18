import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameManager } from './gameEngine.js';
import { PLAYLISTS } from './data/playlists.js';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Initialisation du gestionnaire de jeu
const gameManager = new GameManager(io);

// Endpoints REST
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/playlists', (req, res) => {
  const summary = Object.values(PLAYLISTS).map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    badge: p.badge,
    tracksCount: p.tracks.length
  }));
  res.json(summary);
});

app.get('/api/rooms', (req, res) => {
  res.json(gameManager.getPublicRooms());
});

// Événements WebSocket
io.on('connection', (socket) => {
  console.log(`[Connexion] Joueur connecté : ${socket.id}`);

  // Envoi initial des salons disponibles
  socket.emit('rooms_list', gameManager.getPublicRooms());

  // Créer une room personnalisée
  socket.on('create_room', (payload) => {
    const { name, playlistId, nickname, avatar } = payload || {};
    if (typeof name !== 'string' || !name.trim() || !PLAYLISTS[playlistId]) {
      socket.emit('game_error', { message: 'Enter a room name and choose a playlist.' });
      return;
    }
    if (socket.roomId) gameManager.leaveRoom(socket);
    const room = gameManager.createRoom({
      name: name.trim().slice(0, 40),
      playlistId,
      creatorSocketId: socket.id
    });
    gameManager.broadcastRoomsList();
    socket.emit('room_created', { roomId: room.id });
    gameManager.joinRoom(room.id, socket, { nickname, avatar });
  });

  // Rejoindre une room
  socket.on('join_room', (payload) => {
    const { roomId, nickname, avatar } = payload || {};
    try {
      if (!gameManager.rooms.has(roomId)) {
        socket.emit('game_error', { message: 'This room has closed. Choose another room or create one.' });
        return;
      }
      gameManager.joinRoom(roomId, socket, { nickname, avatar });
    } catch (err) {
      console.error('Erreur join_room:', err);
      socket.emit('error', { message: 'Impossible de rejoindre la room' });
    }
  });

  socket.on('pass_round', () => gameManager.passRound(socket.roomId, socket.id));
  socket.on('next_round', () => gameManager.nextRound(socket.roomId, socket.id));

  // Quitter une room
  socket.on('leave_room', () => {
    gameManager.leaveRoom(socket);
  });

  // Lancer la partie
  socket.on('start_game', () => {
    if (!socket.roomId) return;
    const result = gameManager.startGame(socket.roomId, socket.id);
    if (result && result.error) {
      socket.emit('game_error', { message: result.error });
    }
  });

  // Soumettre une réponse
  socket.on('submit_guess', (payload) => {
    const { guess } = payload || {};
    if (!socket.roomId || typeof guess !== 'string') return;
    gameManager.handleGuess(socket.roomId, socket.id, guess.trim().slice(0, 200));
  });

  // Envoyer un message de tchat
  socket.on('send_chat_message', (payload) => {
    const { text } = payload || {};
    if (!socket.roomId || typeof text !== 'string') return;
    gameManager.handlePlayerChat(socket.roomId, socket.id, text.slice(0, 120));
  });

  // Déconnexion
  socket.on('disconnect', () => {
    console.log(`[Déconnexion] Joueur déconnecté : ${socket.id}`);
    gameManager.leaveRoom(socket);
  });
});

httpServer.listen(port, () => {
  console.log(`[Serveur] Blindtest démarré sur http://localhost:${port}`);
  console.log(`[Playlists] Chargées : RAP US (${PLAYLISTS.rap_us?.tracks?.length || 0} titres) & POP 2000 (${PLAYLISTS.pop_2000?.tracks?.length || 0} titres)`);
});
