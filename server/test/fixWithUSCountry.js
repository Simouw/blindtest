import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { PLAYLISTS } from '../src/data/playlists.js';

async function checkUrl(url) {
  if (!url) return false;
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const req = (parsed.protocol === 'https:' ? https : http).request(
        parsed,
        { method: 'GET', headers: { Range: 'bytes=0-100', 'User-Agent': 'Mozilla/5.0' }, timeout: 6000 },
        (res) => {
          resolve(res.statusCode === 200 || res.statusCode === 206 || res.statusCode === 302 || res.statusCode === 301);
        }
      );
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

async function searchItunes(term, country = 'US') {
  return new Promise((resolve) => {
    const url = 'https://itunes.apple.com/search?term=' + encodeURIComponent(term) + '&entity=song&limit=15&country=' + country;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.results || []);
        } catch {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function pickBestMatch(results, artist, title) {
  if (!results || results.length === 0) return null;
  const withPreview = results.filter(r => r.previewUrl);
  if (withPreview.length === 0) return null;

  const nonKaraoke = withPreview.filter(r => {
    const t = (r.trackName + ' ' + r.artistName).toLowerCase();
    return !t.includes('karaoke') && !t.includes('tribute') && !t.includes('originally performed');
  });

  const pool = nonKaraoke.length > 0 ? nonKaraoke : withPreview;
  const firstWord = artist.toLowerCase().split(' ')[0];
  const artistMatch = pool.find(r => r.artistName.toLowerCase().includes(firstWord));

  return artistMatch || pool[0];
}

async function run() {
  console.log('=== Migrating & Verifying 200 Tracks with US Storefront ===');

  for (const plKey of Object.keys(PLAYLISTS)) {
    const pl = PLAYLISTS[plKey];
    console.log('\nPlaylist: ' + pl.name + ' (' + pl.tracks.length + ' tracks)');

    for (let i = 0; i < pl.tracks.length; i++) {
      const track = pl.tracks[i];
      const isDeezer = track.previewUrl && track.previewUrl.includes('dzcdn.net');
      let works = !isDeezer ? await checkUrl(track.previewUrl) : false;

      if (!works) {
        console.log('[' + (i+1) + '/' + pl.tracks.length + '] Fixing: ' + track.artist + ' - ' + track.title);

        let results = await searchItunes(track.artist + ' ' + track.title, 'US');
        await delay(120);

        let chosen = pickBestMatch(results, track.artist, track.title);

        if (!chosen && track.title.includes('(')) {
          const cleanTitle = track.title.split('(')[0].trim();
          results = await searchItunes(track.artist + ' ' + cleanTitle, 'US');
          await delay(120);
          chosen = pickBestMatch(results, track.artist, track.title);
        }

        if (!chosen) {
          results = await searchItunes(track.title, 'US');
          await delay(120);
          chosen = pickBestMatch(results, track.artist, track.title);
        }

        if (!chosen) {
          results = await searchItunes(track.artist + ' ' + track.title, 'FR');
          await delay(120);
          chosen = pickBestMatch(results, track.artist, track.title);
        }

        if (chosen && chosen.previewUrl) {
          const valid = await checkUrl(chosen.previewUrl);
          if (valid) {
            track.previewUrl = chosen.previewUrl;
            if (chosen.artworkUrl100) {
              track.artworkUrl = chosen.artworkUrl100.replace('100x100bb', '600x600bb');
            }
            if (chosen.releaseDate && !track.year) {
              track.year = chosen.releaseDate.substring(0, 4);
            }
            console.log('  -> SUCCESS: ' + chosen.artistName + ' - ' + chosen.trackName);
          } else {
            console.log('  -> ERROR: URL check failed for ' + track.artist + ' - ' + track.title);
          }
        } else {
          console.log('  -> NOT FOUND: ' + track.artist + ' - ' + track.title);
        }
      } else {
        process.stdout.write('.');
      }
    }
  }
  const outputPath = path.join(__dirname, '../src/data/playlists.js');
  const fileContent = 'export const PLAYLISTS = ' + JSON.stringify(PLAYLISTS, null, 2) + ';\n';
  fs.writeFileSync(outputPath, fileContent, 'utf8');
  console.log('\n\n=== Playlists file updated and saved! ===');
}

run();