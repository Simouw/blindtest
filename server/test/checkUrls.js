import { PLAYLISTS } from '../src/data/playlists.js';
import https from 'https';
import http from 'http';

async function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const req = (parsed.protocol === 'https:' ? https : http).request(
        parsed,
        { method: 'GET', headers: { Range: 'bytes=0-100', 'User-Agent': 'Mozilla/5.0' }, timeout: 6000 },
        (res) => {
          resolve({ status: res.statusCode, contentType: res.headers['content-type'] });
        }
      );
      req.on('error', (e) => resolve({ error: e.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ error: 'timeout' });
      });
      req.end();
    } catch (e) {
      resolve({ error: e.message });
    }
  });
}

async function run() {
  for (const plKey of Object.keys(PLAYLISTS)) {
    const pl = PLAYLISTS[plKey];
    console.log('Checking playlist:', pl.name, 'Tracks:', pl.tracks.length);
    let failures = [];
    for (let i = 0; i < pl.tracks.length; i++) {
      const t = pl.tracks[i];
      const res = await checkUrl(t.previewUrl);
      const ok = res.status === 200 || res.status === 206 || res.status === 302 || res.status === 301;
      if (!ok) {
        console.log('\nFAIL [' + t.id + '] ' + t.artist + ' - ' + t.title + ': status=' + res.status + ' err=' + res.error + ' url=' + t.previewUrl);
        failures.push({ id: t.id, artist: t.artist, title: t.title, status: res.status, url: t.previewUrl });
      } else {
        process.stdout.write('.');
      }
    }
    console.log('\nResult for ' + pl.name + ': ' + failures.length + ' failures out of ' + pl.tracks.length);
  }
}

run();
