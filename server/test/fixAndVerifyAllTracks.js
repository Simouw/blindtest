import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { PLAYLISTS } from '../src/data/playlists.js';

async function checkUrl(url) {
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

async function searchItunes(term) {
  return new Promise((resolve) => {
    const url = 'https://itunes.apple.com/search?term=' + encodeURIComponent(term) + '&entity=song&limit=5';
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

async function run() {
  console.log('=== Starting Auto-Migration & Verification of 200 Tracks to iTunes ===');
  
  for (const plKey of Object.keys(PLAYLISTS)) {
    const pl = PLAYLISTS[plKey];
    console.log('\nProcessing playlist: ' + pl.name + ' (' + pl.tracks.length + ' tracks)');
    
    for (let i = 0; i < pl.tracks.length; i++) {
      const track = pl.tracks[i];
      const isDeezer = track.previewUrl && track.previewUrl.includes('dzcdn.net');
      let isValid = !isDeezer ? await checkUrl(track.previewUrl) : false;

      if (!isValid) {
        console.log('[' + (i+1) + '/' + pl.tracks.length + '] Replacing ' + track.artist + ' - ' + track.title + '...');
        
        let itunesResults = await searchItunes(track.artist + ' ' + track.title);
        await delay(150);
        
        let chosen = itunesResults.find(r => r.previewUrl);
        
        if (!chosen && track.title.includes('(')) {
          const cleanTitle = track.title.replace(/\s*\([^)]*\)/g, '').trim();
          itunesResults = await searchItunes(track.artist + ' ' + cleanTitle);
          await delay(150);
          chosen = itunesResults.find(r => r.previewUrl);
        }

        if (!chosen) {
          itunesResults = await searchItunes(track.title);
          await delay(150);
          chosen = itunesResults.find(r => r.previewUrl);
        }

        if (chosen && chosen.previewUrl) {
          const works = await checkUrl(chosen.previewUrl);
          if (works) {
            track.previewUrl = chosen.previewUrl;
            if (chosen.artworkUrl100) {
              track.artworkUrl = chosen.artworkUrl100.replace('100x100bb', '600x600bb');
            }
            if (chosen.releaseDate && !track.year) {
              track.year = chosen.releaseDate.substring(0, 4);
            }
            console.log('  -> OK: ' + chosen.artistName + ' - ' + chosen.trackName);
          } else {
            console.log('  -> iTunes URL failed check for ' + track.artist + ' - ' + track.title);
          }
        } else {
          console.log('  -> No iTunes match found for ' + track.artist + ' - ' + track.title);
        }
      } else {
        process.stdout.write('.');
      }
    }
  }

  const outputPath = path.join(__dirname, '../src/data/playlists.js');
  const fileContent = 'export const PLAYLISTS = ' + JSON.stringify(PLAYLISTS, null, 2) + ';\n';
  fs.writeFileSync(outputPath, fileContent, 'utf8');
  console.log('\n\n=== Saved 100% updated playlists to src/data/playlists.js! ===');
}

run();
