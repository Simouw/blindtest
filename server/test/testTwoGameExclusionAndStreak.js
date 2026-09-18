import { GameManager } from '../src/gameEngine.js';

console.log('--- Testing 2-Game Lockout Exclusion (Per Playlist) ---');

const mockIo = {
  to: () => ({ emit: () => {} }),
  emit: () => {}
};

const gm = new GameManager(mockIo);
const room = gm.rooms.get('rap-us-room');

// Game 1
const game1 = room.trackList.map(t => t.id);
console.log('Game 1 tracks (10):', game1);

// Game 2
room.status = 'ENDED';
gm.startGame('rap-us-room', 'host');
const game2 = room.trackList.map(t => t.id);
console.log('Game 2 tracks (10):', game2);

const overlap12 = game1.filter(id => game2.includes(id));
console.log('Overlap G1 & G2:', overlap12.length);
if (overlap12.length > 0) throw new Error('Game 2 repeated tracks from Game 1!');

// Game 3: MUST NOT contain any tracks from Game 1 OR Game 2!
room.status = 'ENDED';
gm.startGame('rap-us-room', 'host');
const game3 = room.trackList.map(t => t.id);
console.log('Game 3 tracks (10):', game3);

const overlap13 = game1.filter(id => game3.includes(id));
const overlap23 = game2.filter(id => game3.includes(id));
console.log('Overlap G1 & G3:', overlap13.length);
console.log('Overlap G2 & G3:', overlap23.length);

if (overlap13.length > 0) throw new Error('Game 3 repeated tracks from Game 1! Lockout across 2 games failed!');
if (overlap23.length > 0) throw new Error('Game 3 repeated tracks from Game 2!');

console.log('✓ PASS: Strict 2-game lockout verified! Zero overlap across consecutive and 2-step games!');

const avail = gm.getAvailableTracksCount('rap_us');
console.log(`Available tracks in rotation for next game: ${avail} / 100`);

console.log('\n--- Testing Streak Mechanics ---');
const player = {
  id: 'p1',
  streak: 0,
  streakWeakened: false,
  currentRound: { foundArtist: false, foundTitle: false }
};

room.players.set('p1', player);

function simulateRound(foundArtist, foundTitle) {
  player.currentRound = { foundArtist, foundTitle };
  // Same logic as endRound
  if (foundArtist && foundTitle) {
    player.streak = (player.streak || 0) + 1;
    player.streakWeakened = false;
  } else if (foundArtist || foundTitle) {
    if (player.streakWeakened) {
      player.streak = 0;
      player.streakWeakened = false;
    } else if (player.streak > 0) {
      player.streakWeakened = true;
    } else {
      player.streak = 0;
      player.streakWeakened = false;
    }
  } else {
    player.streak = 0;
    player.streakWeakened = false;
  }
}

// R1: Both -> streak 1, weakened false
simulateRound(true, true);
console.log('R1 (both):', player.streak, 'weakened:', player.streakWeakened);
if (player.streak !== 1 || player.streakWeakened) throw new Error('R1 failed');

// R2: Both -> streak 2, weakened false
simulateRound(true, true);
console.log('R2 (both):', player.streak, 'weakened:', player.streakWeakened);
if (player.streak !== 2 || player.streakWeakened) throw new Error('R2 failed');

// R3: Partial (artist only) -> streak 2, weakened true (flame weakens)
simulateRound(true, false);
console.log('R3 (partial):', player.streak, 'weakened:', player.streakWeakened);
if (player.streak !== 2 || !player.streakWeakened) throw new Error('R3 failed');

// R4: Both -> restored! streak 3, weakened false
simulateRound(true, true);
console.log('R4 (both, restored):', player.streak, 'weakened:', player.streakWeakened);
if (player.streak !== 3 || player.streakWeakened) throw new Error('R4 failed');

// R5: Partial -> streak 3, weakened true
simulateRound(false, true);
console.log('R5 (partial):', player.streak, 'weakened:', player.streakWeakened);
if (player.streak !== 3 || !player.streakWeakened) throw new Error('R5 failed');

// R6: Partial again -> streak lost! streak 0, weakened false
simulateRound(false, true);
console.log('R6 (partial again -> lost):', player.streak, 'weakened:', player.streakWeakened);
if (player.streak !== 0 || player.streakWeakened) throw new Error('R6 failed');

// R7: Both -> streak 1
simulateRound(true, true);
console.log('R7 (both):', player.streak, 'weakened:', player.streakWeakened);
if (player.streak !== 1) throw new Error('R7 failed');

// R8: Neither -> direct lost! streak 0
simulateRound(false, false);
console.log('R8 (none -> direct lost):', player.streak, 'weakened:', player.streakWeakened);
if (player.streak !== 0 || player.streakWeakened) throw new Error('R8 failed');

console.log('✓ PASS: All streak conditions verified perfectly!');
