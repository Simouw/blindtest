# 🎵 Blindtest Live — Multijoueur en Temps Réel

Application de Blindtest musical multijoueur en temps réel avec synchronisation WebSocket, algorithme de tolérance aux fautes de frappe (Levenshtein), thématique dark mode élégante charcoal (`#0d0d10`) et accents mauve/violet.

---

## ⚡ Fonctionnalités Clés

1. **Multijoueur en Temps Réel (Socket.io) :**
   - Salons prêts à jouer (**RAP US** et **POP 2000-2010**) et création de salons personnalisés.
   - Synchronisation instantanée des joueurs, des scores et du leaderboard.
   - Fil d'activité en direct signalant les trouvailles sans spoiler le titre ou l'artiste aux autres joueurs.

2. **Game Loop Complet & Automatisé :**
   - **Compte à rebours de 5 secondes** avec décompte animé.
   - **Manche d'écoute de 30 secondes** avec extraits audio réels (liens fiables vérifiés).
   - **Validation Floue (Fuzzy Matching Levenshtein) :**
     - Accepte les fautes légères de frappe (ex: *"Brithney Spears"* ➔ *Britney Spears*, *"Kendrik Lamar"* ➔ *Kendrick Lamar*, *"Tupac"* ➔ *2Pac*).
     - Détection indépendante de l'Artiste, du Titre, ou des deux en une seule saisie (*"Artiste - Titre"*).
     - Bonus combo si l'Artiste et le Titre sont tous les deux trouvés.
     - Attribution de points dégressifs selon la rapidité de réponse.
   - **Révélation visuelle (7 secondes) :** Pochette officielle HD, titre, artiste, année de sortie.
   - **Fin de partie & Podium :** Célébration confettis et tableau des scores final.

3. **Audio Robuste & Autoplay Unblocker :**
   - Gestion transparente de la politique de blocage autoplay des navigateurs avec invite interactive immédiate si bloqué.
   - Contrôle du volume et bouton Mute.
   - Égaliseur visuel animé.

---

## 🚀 Démarrage Rapide

### 1. Installation de toutes les dépendances
À la racine du projet :
```bash
npm run install:all
```
*(Ou installez manuellement dans la racine, `server/` et `client/`)*

### 2. Lancement en Développement (Client + Serveur en une seule commande)
```bash
npm run dev
```
- **Frontend :** [http://localhost:5173](http://localhost:5173)
- **Backend WebSocket :** [http://localhost:3001](http://localhost:3001)

### 3. Lancer séparément si désiré
- Serveur seul :
  ```bash
  npm run server
  ```
- Client seul :
  ```bash
  npm run client
  ```

---

## 🧪 Tests Automatisés

Le projet inclut des suites de tests pour valider le moteur :
- **Test de l'algorithme Levenshtein & Fuzzy Matching :**
  ```bash
  node server/test/testFuzzy.js
  ```
- **Test d'intégration du cycle multijoueur (2 joueurs simulés) :**
  ```bash
  node server/test/testServerGame.js
  ```
- **Build de production du Frontend :**
  ```bash
  npm run build
  ```

---

## 📁 Structure du Projet

```
bt/
├── package.json              # Script racine pour orchestrer dev / build
├── README.md
├── server/                   # Backend Node.js
│   ├── package.json
│   ├── src/
│   │   ├── index.js          # Serveur Express & passerelle Socket.io
│   │   ├── gameEngine.js     # Moteur des rooms, manches, timers et scores
│   │   ├── fuzzyMatch.js     # Algorithme Levenshtein et normalisation
│   │   └── data/
│   │       └── playlists.js  # Playlists RAP US & POP 2000 avec extraits audio réels
│   └── test/                 # Tests unitaires et d'intégration
└── client/                   # Frontend React (Vite + Tailwind CSS)
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── src/
        ├── App.jsx           # Composant racine
        ├── index.css         # Thème charcoal & mauve
        ├── context/
        │   └── SocketContext.jsx # Gestion de la communication WebSocket
        └── components/
            ├── Lobby.jsx             # Sélection des salons, pseudo & avatar
            ├── GameRoom.jsx          # Plateau de jeu principal
            ├── AudioPlayer.jsx       # Lecteur audio invisible & gestion autoplay
            ├── GuessInput.jsx        # Saisie de réponse en direct
            ├── CountdownOverlay.jsx  # Compte à rebours 5s
            ├── RevealCard.jsx        # Affichage pochette et morceau
            ├── Leaderboard.jsx       # Classement des joueurs
            ├── ChatFeed.jsx          # Fil d'événements sans spoiler
            └── VolumeControl.jsx     # Contrôle de volume & mute
```

---

## 🌐 Déploiement en Production

1. **Option 1 : Render / Railway / Fly.io**
   - Le serveur Node.js peut servir les fichiers statiques construits du client (`client/dist`) :
     ```bash
     npm run build
     ```
   - Spécifier la variable `PORT` (ex: 3001 ou 8080).
2. **Option 2 : Vercel / Netlify (Client) + Node.js (Serveur)**
   - Déployer `client/` sur Vercel avec variable `VITE_SERVER_URL` pointant vers l'URL de votre serveur WebSocket.
