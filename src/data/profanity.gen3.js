/**
 * Profanity word list for Base64 box-name output filtering.
 *
 * Nintendo Switch re-releases of Pokémon FireRed / LeafGreen censor box
 * names that contain these substrings (case-insensitive).  When the
 * generated Base64 box names contain one of these words the UI shows a
 * warning so the user knows the code may be blocked on-console.
 *
 * The list intentionally covers:
 *   • Common English profanity / slurs
 *   • Shortened / leet-speak variants that can appear in Base64 output
 *   • Known strings the Switch filter blocks
 *
 * Base64 uses [A-Za-z0-9+/] (we map + → ! and / → ? for Emerald),
 * so only alphanumeric substrings matter here.
 *
 * Maintain alphabetically within each section for easy deduplication.
 */
export const PROFANITY_LIST = [
  // ── Common profanity ───────────────────────────────
  'anal',
  'anus',
  'arse',
  'ass',
  'bastard',
  'bitch',
  'blowjob',
  'boner',
  'boob',
  'butt',
  'cock',
  'coon',
  'cum',
  'cunt',
  'damn',
  'dick',
  'dildo',
  'dyke',
  'fag',
  'fap',
  'fuck',
  'hell',
  'hoe',
  'homo',
  'jizz',
  'kike',
  'kink',
  'knob',
  'labia',
  'milf',
  'nazi',
  'negro',
  'nig',
  'nigga',
  'nigger',
  'nonce',
  'nude',
  'oral',
  'organ',
  'orgy',
  'penis',
  'pimp',
  'piss',
  'poop',
  'porn',
  'pube',
  'pussy',
  'queer',
  'rape',
  'rectum',
  'retard',
  'scat',
  'semen',
  'sex',
  'shaft',
  'shit',
  'shiz',
  'slut',
  'smut',
  'sperm',
  'spunk',
  'tit',
  'turd',
  'twat',
  'vagina',
  'vulva',
  'wang',
  'wank',
  'whore',

  // ── Leet-speak / numeric variants visible in Base64 ──
  'a55',
  'b1tch',
  'b00b',
  'c0ck',
  'd1ck',
  'f4g',
  'fuk',
  'fvck',
  'h0e',
  'h0mo',
  'p0rn',
  'pr0n',
  'sh1t',
  'stfu',
  'wtf',
];
