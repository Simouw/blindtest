/**
 * Module de Fuzzy Matching (Levenshtein) et normalisation pour le Blindtest
 */

/**
 * Normalise une chaîne :
 * - Minuscule
 * - Suppression des accents (diacritiques)
 * - Suppression des caractères spéciaux / ponctuation
 * - Suppression des espaces superflus
 * - Nettoyage des suffixes fréquents (feat, ft, remaster, etc.)
 */
export function normalizeString(str) {
  if (!str || typeof str !== 'string') return '';

  let normalized = str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Enlève les accents

  // Supprime le contenu entre parenthèses ou crochets comme (feat. xxx) ou [Remix]
  normalized = normalized.replace(/\([^\)]*\)/g, ' ').replace(/\[[^\]]*\]/g, ' ');

  // Supprime "feat.", "ft.", "featuring" et ce qui suit si présent
  normalized = normalized.replace(/\b(feat\.?|ft\.?|featuring)\b.*$/i, ' ');

  // Supprime les caractères non alphanumériques (garde lettres et chiffres)
  normalized = normalized.replace(/[^a-z0-9\s]/g, ' ');

  // Supprime les articles initiaux courants pour faciliter la détection
  normalized = normalized.replace(/^(the|a|an|le|la|les|l)\s+/i, '');

  // Réduit les espaces multiples
  return normalized.trim().replace(/\s+/g, ' ');
}

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 */
export function levenshteinDistance(a, b) {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const matrix = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) matrix[i][0] = i;
  for (let j = 0; j <= n; j++) matrix[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // Suppression
        matrix[i][j - 1] + 1,      // Insertion
        matrix[i - 1][j - 1] + cost // Substitution
      );
    }
  }

  return matrix[m][n];
}

/**
 * Calcule un ratio de similarité entre 0 et 1
 */
export function similarityRatio(s1, s2) {
  if (s1 === s2) return 1.0;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(s1, s2);
  return 1 - dist / maxLen;
}

/**
 * Vérifie si la tentative correspond à la cible ou à un des alias
 * avec tolérance aux fautes d'orthographe (Levenshtein)
 * 
 * @param {string} guess - Ce qu'a tapé l'utilisateur
 * @param {string} target - Le nom ou titre officiel
 * @param {string[]} aliases - Liste d'alias acceptés
 * @returns {{ match: boolean, similarity: number, target: string }}
 */
export function checkMatch(guess, target, aliases = []) {
  const normGuess = normalizeString(guess);
  if (!normGuess || normGuess.length < 2) {
    return { match: false, similarity: 0, target };
  }

  const targets = [target, ...aliases];

  let bestSim = 0;
  let isMatch = false;

  for (const t of targets) {
    const normTarget = normalizeString(t);
    if (!normTarget) continue;

    // Correspondance exacte après normalisation
    if (normGuess === normTarget) {
      return { match: true, similarity: 1.0, target: t };
    }

    const dist = levenshteinDistance(normGuess, normTarget);
    const maxLen = Math.max(normGuess.length, normTarget.length);
    const sim = 1 - dist / maxLen;

    if (sim > bestSim) bestSim = sim;

    // Critères d'acceptation adaptatifs selon la longueur :
    // - Longueur 2 à 4 : exact ou distance <= 1 si longueur 4
    // - Longueur 5 à 8 : tolérance 1 faute (ex: "brithney" vs "britney", dist 1)
    // - Longueur > 8 : tolérance 2 fautes ou similarité >= 0.82
    if (normTarget.length <= 4) {
      if (dist === 0 || (dist === 1 && normTarget.length >= 4)) {
        isMatch = true;
        break;
      }
    } else if (normTarget.length <= 8) {
      if (dist <= 1 || sim >= 0.85) {
        isMatch = true;
        break;
      }
    } else {
      if (dist <= 2 || sim >= 0.80) {
        isMatch = true;
        break;
      }
    }

    // Gestion du cas où le joueur tape le mot principal (ex: "toxic" dans un titre plus long)
    if (normTarget.split(' ').includes(normGuess) && normGuess.length >= 4) {
      isMatch = true;
      break;
    }
  }

  return {
    match: isMatch,
    similarity: bestSim,
    target
  };
}

/**
 * Évalue la soumission d'un joueur par rapport au morceau actuel
 * Détecte si le joueur a trouvé l'artiste, le titre, ou les deux.
 */
export function evaluateSubmission(guess, track, alreadyFound = { artist: false, title: false }) {
  const result = {
    foundArtist: false,
    foundTitle: false,
    foundBoth: false,
    matched: false,
    feedback: ''
  };

  if (!guess || typeof guess !== 'string') return result;

  // Si l'artiste n'est pas encore trouvé par ce joueur, tester
  if (!alreadyFound.artist) {
    const artistMatch = checkMatch(guess, track.artist, track.aliasesArtist || []);
    if (artistMatch.match) {
      result.foundArtist = true;
      result.matched = true;
    }
  }

  // Si le titre n'est pas encore trouvé par ce joueur, tester
  if (!alreadyFound.title) {
    const titleMatch = checkMatch(guess, track.title, track.aliasesTitle || []);
    if (titleMatch.match) {
      result.foundTitle = true;
      result.matched = true;
    }
  }

  // Si le joueur a tapé "Artiste - Titre" ou "Titre - Artiste" d'un seul coup
  if (!result.matched && (!alreadyFound.artist || !alreadyFound.title)) {
    // Sépare uniquement sur un tiret entouré d'espaces ou une virgule (pour ne pas couper "Jay-Z")
    const parts = guess.includes(' - ') 
      ? guess.split(/\s+[-–—]\s+/) 
      : (guess.includes(',') ? guess.split(/\s*,\s*/) : guess.split(/\s+[-–—/:]+\s+/));

    if (parts.length >= 2) {
      const part1Artist = checkMatch(parts[0], track.artist, track.aliasesArtist || []);
      const part2Title = checkMatch(parts.slice(1).join(' - '), track.title, track.aliasesTitle || []);
      const part1Title = checkMatch(parts[0], track.title, track.aliasesTitle || []);
      const part2Artist = checkMatch(parts.slice(1).join(' - '), track.artist, track.aliasesArtist || []);

      if (part1Artist.match && part2Title.match) {
        if (!alreadyFound.artist) result.foundArtist = true;
        if (!alreadyFound.title) result.foundTitle = true;
        result.matched = true;
      } else if (part1Title.match && part2Artist.match) {
        if (!alreadyFound.artist) result.foundArtist = true;
        if (!alreadyFound.title) result.foundTitle = true;
        result.matched = true;
      }
    }
  }

  // Vérifie si le joueur a maintenant les deux
  const willHaveArtist = alreadyFound.artist || result.foundArtist;
  const willHaveTitle = alreadyFound.title || result.foundTitle;
  result.foundBoth = willHaveArtist && willHaveTitle;

  return result;
}
