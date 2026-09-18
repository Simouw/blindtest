import { GameManager } from '../src/gameEngine.js';

console.log('--- Testing Non-Repeating Track Selection Across 5 Games ---');

const mockIo = {
  to: () => ({ emit: () => {} }),
  emit: () => {}
};

const gm = new GameManager(mockIo);
const room = gm.rooms.get('rap-us-room');

let prevTracks = room.trackList.map(t => t.id);
console.log('Game 1 tracks (' + prevTracks.length + '):', prevTracks);

for (let g = 2; g <= 5; g++) {
  // Set room to ENDED so startGame can run
  room.status = 'ENDED';
  gm.clearRoomTimers(room);

  gm.startGame('rap-us-room', 'host');
  const currentTracks = room.trackList.map(t => t.id);
  console.log(`Game ${g} tracks (${currentTracks.length}):`, currentTracks);

  const overlap = prevTracks.filter(id => currentTracks.includes(id));
  console.log(`Overlap between Game ${g - 1} and Game ${g}:`, overlap.length, 'tracks');

  if (overlap.length > 0) {
    console.error(`FAIL: Game ${g} repeated tracks from Game ${g - 1}:`, overlap);
    process.exit(1);
  } else {
    console.log(`✓ PASS: 0 tracks repeated between Game ${g - 1} and Game ${g}!`);
  }

  prevTracks = currentTracks;
}

// Clean up
gm.clearRoomTimers(room);
console.log('\nALL NON-REPETITION TESTS PASSED SUCCESSFULLY! 0 repeated tracks between consecutive games.');
