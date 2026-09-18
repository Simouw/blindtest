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
  socket.on('create_room', ({ name, playlistId }) => {
    const room = gameManager.createRoom({
      name,
      playlistId,
      creatorSocketId: socket.id
    });
    gameManager.broadcastRoomsList();
    socket.emit('room_created', { roomId: room.id });
  });

  // Rejoindre une room
  socket.on('join_room', ({ roomId, nickname, avatar }) => {
    try {
      gameManager.joinRoom(roomId, socket, { nickname, avatar });
    } catch (err) {
      console.error('Erreur join_room:', err);
      socket.emit('error', { message: 'Impossible de rejoindre la room' });
    }
  });

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
  socket.on('submit_guess', ({ guess }) => {
    if (!socket.roomId || !guess) return;
    gameManager.handleGuess(socket.roomId, socket.id, guess.trim());
  });

  // Envoyer un message de tchat
  socket.on('send_chat_message', ({ text }) => {
    if (!socket.roomId || !text) return;
    gameManager.handlePlayerChat(socket.roomId, socket.id, text);
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
