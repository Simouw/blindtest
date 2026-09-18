import { normalizeString, levenshteinDistance, checkMatch, evaluateSubmission } from '../src/fuzzyMatch.js';

console.log('--- Test Fuzzy Matching ---');

const testCases = [
  { guess: 'Brithney Spears', target: 'Britney Spears', aliases: ['britney'], shouldMatch: true },
  { guess: 'Britney', target: 'Britney Spears', aliases: ['britney'], shouldMatch: true },
  { guess: 'Kendrik Lamar', target: 'Kendrick Lamar', aliases: ['kendrick'], shouldMatch: true },
  { guess: 'Tupac', target: '2Pac', aliases: ['2pac', 'tupac'], shouldMatch: true },
  { guess: 'lose youself', target: 'Lose Yourself', aliases: [], shouldMatch: true },
  { guess: 'random stuff', target: 'Lose Yourself', aliases: [], shouldMatch: false },
  { guess: 'BEP', target: 'Black Eyed Peas', aliases: ['black eyed peas', 'bep'], shouldMatch: true }
];

let failed = 0;
for (const tc of testCases) {
  const res = checkMatch(tc.guess, tc.target, tc.aliases);
  const pass = res.match === tc.shouldMatch;
  console.log(`${pass ? '✓' : '✗'} Guess: "${tc.guess}" vs "${tc.target}" -> match=${res.match} (similarity: ${res.similarity.toFixed(2)})`);
  if (!pass) failed++;
}

console.log('\n--- Test Evaluate Submission ---');
const sampleTrack = {
  artist: 'Britney Spears',
  title: 'Toxic',
  aliasesArtist: ['britney'],
  aliasesTitle: ['toxic']
};

const sub1 = evaluateSubmission('brithney spears', sampleTrack, { artist: false, title: false });
console.log('Submission "brithney spears":', sub1);

const sub2 = evaluateSubmission('toxic', sampleTrack, { artist: true, title: false });
console.log('Submission "toxic" (artist already found):', sub2);

const sub3 = evaluateSubmission('Britney Spears - Toxic', sampleTrack, { artist: false, title: false });
console.log('Submission "Britney Spears - Toxic":', sub3);

if (failed === 0 && sub1.foundArtist && sub2.foundTitle && sub3.foundBoth) {
  console.log('\nALL TESTS PASSED! 🎉');
} else {
  console.error('\nSOME TESTS FAILED!');
  process.exit(1);
}
