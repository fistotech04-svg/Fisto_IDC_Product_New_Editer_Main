/**
 * spellGrammarChecker.js
 * Advanced, offline-capable Hunspell-based spell and grammar checker for the Flipbook editor.
 * Uses Hunspell English dictionary files (en_US.aff & en_US.dic) powered by nspell,
 * complete with word verification, typo suggestions, comprehensive grammar rules, and domain-term whitelist.
 */

import nspell from 'nspell';

let spellCheckerInstance = null;
let dictionaryLoadPromise = null;

// User session ignored words
const userIgnoredWords = new Set();

export function addIgnoredWord(word) {
  if (word) {
    userIgnoredWords.add(word.toLowerCase());
  }
}

export function isIgnoredWord(word) {
  if (!word) return true;
  return userIgnoredWords.has(word.toLowerCase());
}

// In-memory word verification cache for instant lookups
const wordCache = new Map();

// Domain-specific and common vocabulary extensions to complement Hunspell
const CUSTOM_WHITELIST = new Set([
  "flipbook", "flipbooks", "fisto", "fistotech", "pdf", "pdfs", "svg", "svgs",
  "qrcode", "qrcodes", "hotspot", "hotspots", "hardcover", "doublepage", "singlepage",
  "wysiwyg", "kerning", "sans", "serif", "monospace", "flexbox", "rgba", "rgb", "hsv",
  "autoplay", "subheading", "login", "logout", "username", "online", "offline", "tooltip",
  "tooltips", "navbar", "navbars", "sidebar", "sidebars", "toolbar", "toolbars",
  "dropdown", "dropdowns", "preset", "presets", "zoom", "pan", "interactjs", "canvas",
  "pre", "div", "span", "img", "figcaption", "webm", "mp4", "aspect", "vimeo", "loom", "wistia",
  "react", "vite", "javascript", "css", "html", "api", "apis", "url", "urls", "ui", "ux",
  "ebook", "ebooks", "pageflip", "fullscreen", "backend", "frontend", "resizer", "multimedia",
  "whatsapp", "facebook", "twitter", "instagram", "linkedin", "youtube", "tiktok", "pinterest"
]);

// Common typos lookup for instantaneous, high-confidence corrections
const COMMON_TYPOS = {
  "teh": "the", "adn": "and", "waht": "what", "taht": "that", "thsi": "this", "wiht": "with",
  "yuo": "you", "oyu": "you", "tihs": "this", "becuase": "because", "recieve": "receive",
  "seperate": "separate", "untill": "until", "wierd": "weird", "occured": "occurred",
  "truely": "truly", "definately": "definitely", "goverment": "government", "tommorrow": "tomorrow",
  "freind": "friend", "peice": "piece", "beleive": "believe", "realy": "really",
  "accomodate": "accommodate", "neccessary": "necessary", "calender": "calendar", "fourty": "forty",
  "lenght": "length", "heigth": "height", "widtht": "width", "flpibook": "flipbook",
  "filpbook": "flipbook", "flipbok": "flipbook", "wether": "whether",
  "allways": "always", "alright": "all right", "basicly": "basically", "enviroment": "environment",
  "existance": "existence", "gaurantee": "guarantee", "knowlege": "knowledge",
  "millenium": "millennium", "noticable": "noticeable", "refered": "referred", "suprise": "surprise",
  "tomorow": "tomorrow", "untill": "until", "acheive": "achieve", "arguement": "argument"
};

// Contraction typos (missing apostrophes)
const CONTRACTION_TYPOS = {
  "dont": "don't", "cant": "can't", "wont": "won't", "didnt": "didn't",
  "isnt": "isn't", "arent": "aren't", "wasnt": "wasn't", "werent": "weren't",
  "havent": "haven't", "hasnt": "hasn't", "hadnt": "hadn't", "couldnt": "couldn't",
  "shouldnt": "shouldn't", "wouldnt": "wouldn't", "doesnt": "doesn't",
  "youre": "you're", "theyre": "they're", "weve": "we've", "theyve": "they've",
  "couldve": "could've", "shouldve": "should've", "wouldve": "would've",
  "ive": "I've", "im": "I'm", "youll": "you'll", "theyll": "they'll", "shell": "she'll",
  "thats": "that's", "whats": "what's", "wheres": "where's", "hows": "how's"
};

// Days and Months capitalization
const DAYS_AND_MONTHS = {
  "monday": "Monday", "tuesday": "Tuesday", "wednesday": "Wednesday", "thursday": "Thursday",
  "friday": "Friday", "saturday": "Saturday", "sunday": "Sunday",
  "january": "January", "february": "February", "march": "March", "april": "April",
  "may": "May", "june": "June", "july": "July", "august": "August", "september": "September",
  "october": "October", "november": "November", "december": "December"
};

/**
 * Initializes the Hunspell English dictionary from /dictionaries/en_US.aff & en_US.dic
 */
export function initDictionary() {
  if (spellCheckerInstance) {
    return Promise.resolve(spellCheckerInstance);
  }
  if (dictionaryLoadPromise) {
    return dictionaryLoadPromise;
  }

  dictionaryLoadPromise = (async () => {
    try {
      const [affRes, dicRes] = await Promise.all([
        fetch('/dictionaries/en_US.aff'),
        fetch('/dictionaries/en_US.dic')
      ]);

      if (!affRes.ok || !dicRes.ok) {
        throw new Error(`Failed to load dictionary files: aff status ${affRes.status}, dic status ${dicRes.status}`);
      }

      const [affText, dicText] = await Promise.all([
        affRes.text(),
        dicRes.text()
      ]);

      const spell = nspell(affText, dicText);

      // Register custom domain terms into the Hunspell instance
      for (const term of CUSTOM_WHITELIST) {
        spell.add(term);
      }

      spellCheckerInstance = spell;
      wordCache.clear();
      return spell;
    } catch (err) {
      console.warn('Hunspell dictionary initialization fallback:', err);
      // Fallback instance if network fetch fails
      const fallback = nspell('SET UTF-8\n', '1\nhello\n');
      CUSTOM_WHITELIST.forEach(w => fallback.add(w));
      spellCheckerInstance = fallback;
      return fallback;
    }
  })();

  return dictionaryLoadPromise;
}

// Preload the dictionary eagerly in the browser
if (typeof window !== 'undefined' && typeof fetch === 'function') {
  initDictionary();
}

/**
 * Checks if a word is recognized as correct
 */
export function isKnownWord(word) {
  if (!word) return true;
  if (isIgnoredWord(word)) return true;

  // Single letters (a, A, i, I) are valid
  if (word.length === 1) {
    const l = word.toLowerCase();
    return l === 'a' || l === 'i';
  }

  // All uppercase acronyms (e.g. PDF, SVG, UI, UX, API, CSS, HTML, FAQ, ID)
  if (/^[A-Z]{2,6}$/.test(word)) return true;

  // Numbers, ordinals, dimensions, percentages, currencies ($100, 1st, 20px, 100ms, 50%, etc.)
  if (/^\$?\d+(?:st|nd|rd|th|px|pt|em|rem|vw|vh|%|ms|s|k|m|g)?$/i.test(word)) return true;

  // Normalize curly quotes
  const normalized = word.replace(/[’‘]/g, "'");
  const lower = normalized.toLowerCase();

  if (wordCache.has(lower)) {
    return wordCache.get(lower);
  }

  if (CUSTOM_WHITELIST.has(lower)) {
    wordCache.set(lower, true);
    return true;
  }

  // Handle hyphenated compound words (e.g. user-friendly, high-quality)
  if (normalized.includes('-')) {
    const parts = normalized.split('-');
    const allValid = parts.every(p => isKnownWord(p));
    if (allValid) {
      wordCache.set(lower, true);
      return true;
    }
  }

  // If dictionary is loaded, use Hunspell engine
  if (spellCheckerInstance) {
    const res = Boolean(spellCheckerInstance.correct(lower) || spellCheckerInstance.correct(normalized));
    wordCache.set(lower, res);
    return res;
  }

  return false;
}

/**
 * Get spelling suggestions for an incorrect word
 */
export function getSpellingSuggestions(word) {
  if (!word) return [];
  const normalized = word.replace(/[’‘]/g, "'");
  const lower = normalized.toLowerCase();

  if (COMMON_TYPOS[lower]) {
    return [matchCase(word, COMMON_TYPOS[lower])];
  }
  if (CONTRACTION_TYPOS[lower]) {
    return [matchCase(word, CONTRACTION_TYPOS[lower])];
  }

  if (spellCheckerInstance) {
    try {
      const suggestions = spellCheckerInstance.suggest(lower) || [];
      const seen = new Set();
      const result = [];

      for (const s of suggestions) {
        const cased = matchCase(word, s);
        if (!seen.has(cased.toLowerCase()) && cased.toLowerCase() !== lower) {
          seen.add(cased.toLowerCase());
          result.push(cased);
          if (result.length >= 4) break;
        }
      }
      return result;
    } catch (e) {
      return [];
    }
  }

  return [];
}

// Helper to preserve user casing (Capitalized or UPPERCASE)
export function matchCase(original, replacement) {
  if (!original || !replacement) return replacement;
  if (original === original.toUpperCase() && original.length > 1) {
    return replacement.toUpperCase();
  }
  if (original[0] === original[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

/**
 * Checks text and returns an array of issues:
 * {
 *   type: 'spelling' | 'grammar',
 *   word: string,
 *   startIndex: number,
 *   endIndex: number,
 *   suggestions: string[],
 *   message: string
 * }
 */
export function checkSpellingAndGrammar(text) {
  if (!text || typeof text !== 'string') return [];
  const issues = [];

  // 1. Phrase / Multi-word Grammar Rules
  const phraseGrammarRules = [
    { pattern: /\b(could|should|would|must|might)\s+of\b/gi, fix: (m, p1) => `${p1} have`, msg: 'Did you mean "$1 have" instead of "$1 of"?' },
    { pattern: /\b(alot)\b/gi, fix: () => 'a lot', msg: '"a lot" is written as two words' },
    { pattern: /\b(noone)\b/gi, fix: () => 'no one', msg: '"no one" is written as two words' },
    { pattern: /\b(infront)\s+of\b/gi, fix: () => 'in front of', msg: '"in front" is written as two words' },
    { pattern: /\b(atleast)\b/gi, fix: () => 'at least', msg: '"at least" is written as two words' },
    { pattern: /\b(each\s+others)\b/gi, fix: () => "each other's", msg: 'Use "each other\'s"' },
    { pattern: /\b(all\s+of\s+the\s+sudden)\b/gi, fix: () => 'all of a sudden', msg: 'The standard idiom is "all of a sudden"' },
    { pattern: /\b(suppose\s+to)\b/gi, fix: () => 'supposed to', msg: 'Use "supposed to"' },
    { pattern: /\b(use\s+to)\s+(be|do|have|go|make|play|work|live)\b/gi, fix: (m, p1) => `used to ${p1}`, msg: 'Use "used to" for past habits' },
    
    // Their / There / They're
    { pattern: /\btheir\s+(going|coming|doing|here|there|not|also|always|ready|happy|sad|excited|able|working|running|eating|making)\b/gi, fix: (m, p1) => `they're ${p1}`, msg: 'Use "they\'re" (they are) before verbs and adjectives' },
    { pattern: /\bthere\s+(car|house|book|name|phone|computer|idea|work|dog|cat|friend|family|team|school|page|product)\b/gi, fix: (m, p1) => `their ${p1}`, msg: 'Use "their" to indicate possession' },
    { pattern: /\btheir\s+(is|are|was|were|will|has|have|had)\b/gi, fix: (m, p1) => `there ${p1}`, msg: 'Use "there" with be-verbs (e.g. "there is", "there are")' },
    { pattern: /\b(over|out|right|up|down|in)\s+their\b/gi, fix: (m, p1) => `${p1} there`, msg: 'Use "there" to indicate a place or direction' },
    
    // Your / You're
    { pattern: /\byour\s+(welcome|right|wrong|going|coming|doing|the|a|an|ready|beautiful|awesome|invited|making|looking)\b/gi, fix: (m, p1) => `you're ${p1}`, msg: 'Use "you\'re" (you are) before verbs/adjectives' },
    { pattern: /\byou're\s+(car|house|book|name|phone|computer|idea|work|dog|cat|friend|family|team|school|page|product|account|email|password)\b/gi, fix: (m, p1) => `your ${p1}`, msg: 'Use "your" to indicate possession' },
    
    // Its / It's
    { pattern: /\bits\s+(a|an|the|not|okay|ok|time|been|easy|hard|clear|true|ready|good|bad|nice|going|working)\b/gi, fix: (m, p1) => `it's ${p1}`, msg: 'Use "it\'s" (it is) here' },
    { pattern: /\bit's\s+(color|size|price|name|place|value|shape|height|width|length|owner|tail|speed|cover)\b/gi, fix: (m, p1) => `its ${p1}`, msg: 'Use "its" (possessive form of it) here' },
    
    // Then / Than
    { pattern: /\b(better|more|less|easier|harder|rather|other|bigger|smaller|faster|slower|taller|shorter|older|younger|higher|lower|stronger|weaker|greater)\s+then\b/gi, fix: (m, p1) => `${p1} than`, msg: 'Use "than" for comparisons' },
    
    // To / Too
    { pattern: /\bto\s+(much|many|late|far|early|fast|slow|expensive|cheap|hard|easy|good|bad|hot|cold|heavy|light|dark|bright)\b/gi, fix: (m, p1) => `too ${p1}`, msg: 'Use "too" (excessively) before adjectives/adverbs' },
    { pattern: /\bme\s+to\b/gi, fix: () => 'me too', msg: 'Use "too" (also/as well)' },
    
    // Loose / Lose
    { pattern: /\bloose\s+(weight|money|the\s+game|my|your|his|her|their|our|control|focus)\b/gi, fix: (m, p1) => `lose ${p1}`, msg: 'Use "lose" instead of "loose"' },
    
    // Affect / Effect
    { pattern: /\b(side|cause\s+and|positive|negative|direct|indirect)\s+affects?\b/gi, fix: (m) => m.replace(/affects?/i, 'effects'), msg: 'Use "effect" as a noun' }
  ];

  for (const rule of phraseGrammarRules) {
    let match;
    while ((match = rule.pattern.exec(text)) !== null) {
      const matchText = match[0];
      const fixed = rule.fix ? rule.fix(...match) : '';
      const cased = matchCase(matchText, fixed);
      issues.push({
        type: 'grammar',
        word: matchText,
        startIndex: match.index,
        endIndex: match.index + matchText.length,
        suggestions: [cased],
        message: rule.msg.replace(/\$1/g, match[1] || '')
      });
    }
  }

  // Regex to extract words with positions (supporting contractions with standard or curly quotes)
  const wordRegex = /\b[a-zA-Z]+(?:['’][a-zA-Z]+)?\b/g;
  let match;
  const words = [];

  while ((match = wordRegex.exec(text)) !== null) {
    words.push({
      text: match[0],
      start: match.index,
      end: match.index + match[0].length
    });
  }

  // 2. Grammar Checks
  // A) Duplicate words (e.g., "the the")
  for (let i = 0; i < words.length - 1; i++) {
    const curr = words[i];
    const next = words[i + 1];
    const between = text.slice(curr.end, next.start);
    if (/^\s+$/.test(between) && curr.text.toLowerCase() === next.text.toLowerCase()) {
      issues.push({
        type: 'grammar',
        word: next.text,
        startIndex: next.start,
        endIndex: next.end,
        suggestions: ['(Delete word)'],
        message: `Duplicate word: "${next.text}"`
      });
    }
  }

  // B) "a" vs "an" before vowel / consonant sounds
  const vowelSounds = new Set(['a', 'e', 'i', 'o', 'u']);
  const consonantSoundAnExceptions = ['hour', 'honest', 'honor', 'heir'];
  const vowelSoundAExceptions = ['uni', 'use', 'user', 'one', 'eu', 'ufo', 'uri', 'url'];

  for (let i = 0; i < words.length - 1; i++) {
    const curr = words[i];
    const next = words[i + 1];
    const between = text.slice(curr.end, next.start);
    if (/^\s+$/.test(between)) {
      const currLower = curr.text.toLowerCase();
      const nextLower = next.text.toLowerCase();
      const firstLetterNext = nextLower[0];

      if (currLower === 'a') {
        const isVowelStart = vowelSounds.has(firstLetterNext);
        const isAException = vowelSoundAExceptions.some(ex => nextLower.startsWith(ex));
        const isAnException = consonantSoundAnExceptions.some(ex => nextLower.startsWith(ex));

        if ((isVowelStart && !isAException) || isAnException) {
          issues.push({
            type: 'grammar',
            word: curr.text,
            startIndex: curr.start,
            endIndex: curr.end,
            suggestions: [matchCase(curr.text, 'an')],
            message: `Use "an" before a vowel sound`
          });
        }
      } else if (currLower === 'an') {
        const isVowelStart = vowelSounds.has(firstLetterNext);
        const isAException = vowelSoundAExceptions.some(ex => nextLower.startsWith(ex));
        const isAnException = consonantSoundAnExceptions.some(ex => nextLower.startsWith(ex));

        if ((!isVowelStart && !isAnException) || isAException) {
          issues.push({
            type: 'grammar',
            word: curr.text,
            startIndex: curr.start,
            endIndex: curr.end,
            suggestions: [matchCase(curr.text, 'a')],
            message: `Use "a" before a consonant sound`
          });
        }
      }
    }
  }

  // C) Subject-Verb Agreement Rules
  const subjectVerbRules = [
    { subjects: ['i'], verbs: { 'is': 'am', 'are': 'am', 'has': 'have', 'does': 'do' } },
    { subjects: ['you'], verbs: { 'is': 'are', 'was': 'were', 'has': 'have', 'does': 'do' } },
    { subjects: ['he', 'she', 'it'], verbs: { 'are': 'is', 'were': 'was', 'have': 'has', "don't": "doesn't", "dont": "doesn't", 'do': 'does' } },
    { subjects: ['we', 'they'], verbs: { 'is': 'are', 'was': 'were', 'has': 'have', 'does': 'do' } }
  ];

  for (let i = 0; i < words.length - 1; i++) {
    const curr = words[i];
    const next = words[i + 1];
    const between = text.slice(curr.end, next.start);
    if (/^\s+$/.test(between)) {
      const currLower = curr.text.toLowerCase();
      const nextLower = next.text.toLowerCase().replace(/[’‘]/g, "'");

      for (const rule of subjectVerbRules) {
        if (rule.subjects.includes(currLower) && rule.verbs[nextLower]) {
          const correctVerb = rule.verbs[nextLower];
          issues.push({
            type: 'grammar',
            word: next.text,
            startIndex: next.start,
            endIndex: next.end,
            suggestions: [matchCase(next.text, correctVerb)],
            message: `Subject-verb agreement: "${curr.text} ${matchCase(next.text, correctVerb)}"`
          });
        }
      }
    }
  }

  // D) Lowercase standalone "i" -> "I"
  for (const w of words) {
    if (w.text === 'i') {
      issues.push({
        type: 'grammar',
        word: 'i',
        startIndex: w.start,
        endIndex: w.end,
        suggestions: ['I'],
        message: 'The pronoun "I" should always be capitalized'
      });
    }
  }

  // E) Days and Months capitalization
  for (const w of words) {
    const lower = w.text.toLowerCase();
    if (DAYS_AND_MONTHS[lower] && w.text !== DAYS_AND_MONTHS[lower] && w.text === lower) {
      issues.push({
        type: 'grammar',
        word: w.text,
        startIndex: w.start,
        endIndex: w.end,
        suggestions: [DAYS_AND_MONTHS[lower]],
        message: `Proper nouns like "${DAYS_AND_MONTHS[lower]}" should be capitalized`
      });
    }
  }

  // F) Contraction typos (e.g. dont -> don't)
  for (const w of words) {
    const lower = w.text.toLowerCase();
    if (CONTRACTION_TYPOS[lower] && !isIgnoredWord(w.text)) {
      const fixed = matchCase(w.text, CONTRACTION_TYPOS[lower]);
      issues.push({
        type: 'grammar',
        word: w.text,
        startIndex: w.start,
        endIndex: w.end,
        suggestions: [fixed],
        message: `Missing apostrophe in contraction: "${fixed}"`
      });
    }
  }

  // 3. Spell Checks for remaining individual words
  const processedPositions = new Set();
  issues.forEach(iss => {
    for (let p = iss.startIndex; p < iss.endIndex; p++) {
      processedPositions.add(p);
    }
  });

  for (const w of words) {
    if (processedPositions.has(w.start)) continue;
    const raw = w.text;
    const lower = raw.toLowerCase().replace(/[’‘]/g, "'");

    if (isIgnoredWord(raw)) continue;

    // Skip single letters
    if (lower.length <= 1) continue;

    const isTypo = !!COMMON_TYPOS[lower];
    const isValid = isKnownWord(raw);

    if (!isValid || isTypo) {
      const suggestions = getSpellingSuggestions(raw);
      issues.push({
        type: 'spelling',
        word: raw,
        startIndex: w.start,
        endIndex: w.end,
        suggestions: suggestions.length > 0 ? suggestions : [],
        message: suggestions.length > 0 ? `Spelling: Did you mean "${suggestions[0]}"?` : `Unknown word "${raw}"`
      });
    }
  }

  // Sort by startIndex
  return issues.sort((a, b) => a.startIndex - b.startIndex);
}
