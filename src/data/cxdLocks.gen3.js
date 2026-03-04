/**
 * CXD Shadow Team-Lock Data
 * Auto-generated from PKHeX source files — DO NOT EDIT BY HAND
 *
 * Each lock entry:
 *   Regular NPC mon: { s: species, n: nature, g: gender(0=F,1=M,2=genderless), r: genderRatio }
 *   Shadow (unseen): { s: species, shadow: true, seen: false }
 *   Shadow (seen):   { s: species, shadow: true, seen: true  }
 *
 * FramesConsumed: seen ? 5 : 7
 *   - non-shadow / unseen shadow: fakePID(2) + IV(2) + ability(1) + PID(2) = 7
 *   - seen shadow:                 IV(2) + ability(1) + PID(2) = 5
 *
 * A lock's MatchesLock(pid):
 *   if (shadow) → always true (no nature/gender constraint on shadows)
 *   else → check nature === pid%25  AND  gender matches (pid&0xFF vs ratio)
 *
 * CXD Method sequence from origin seed:
 *   advance → IV1 (15-bit: (state>>16)&0x7FFF)
 *   advance → IV2 (15-bit)
 *   advance → ability (bit 0 of upper 16)
 *   advance → PID_hi (upper 16)
 *   advance → PID_lo (upper 16)
 *   If noShiny and PID is shiny for trainer ID, re-consume PID_hi + PID_lo until not shiny.
 *
 * XD shadows: noShiny is ALWAYS true (no shiny XD shadows).
 * Colo shadows: noShiny is true (anti-shiny rerolling for all shadow mons).
 *
 * For team-lock validation:
 *   The "origin seed" is the state BEFORE IV1 for the shadow Pokémon.
 *   Walk backward (Prev) to check each prior NPC team member's PID.
 *   Locks are ordered first→last (index 0 = first team slot, last = closest to shadow).
 *   Validation processes them in REVERSE (last first, walking backward from shadow seed).
 */

/**
 * Species that have at least one encounter with NO locks ("First"):
 * 153, 156, 159, 162, 164, 166, 168, 176, 180, 185, 188, 190, 192, 193, 195, 198, 200, 205, 206, 210, 211, 213, 214, 215, 218, 221, 223, 225, 226, 227, 229, 234, 235, 237, 241, 243, 244, 245, 248, 307, 329, 333, 357, 359, 376
 */
export const COLO_SHADOW_LOCKS = {
  175: [ // 1 pattern(s)
    [
      { s:302, n:23, g:0, r:127 },
      { s:88, n:8, g:0, r:127 },
      { s:316, n:24, g:0, r:127 },
      { s:175, n:22, g:1, r:31 }
    ]
  ],
  179: [ // 1 pattern(s)
    [
      { s:300, n:4, g:1, r:191 },
      { s:211, n:10, g:1, r:127 },
      { s:355, n:12, g:1, r:127 },
      { s:179, n:16, g:1, r:127 }
    ]
  ],
  198: [ // 1 pattern(s)
    [
      { s:318, n:6, g:0, r:127 },
      { s:274, n:12, g:1, r:127 },
      { s:228, n:18, g:0, r:127 }
    ]
  ],
  207: [ // 1 pattern(s)
    [
      { s:216, n:12, g:0, r:127 },
      { s:39, n:6, g:1, r:191 },
      { s:285, n:18, g:0, r:127 }
    ]
  ],
  212: [ // 1 pattern(s)
    [
      { s:198, n:13, g:1, r:191 },
      { s:344, n:2, g:2, r:255 },
      { s:208, n:3, g:0, r:127 },
      { s:212, n:11, g:0, r:127 }
    ]
  ],
  214: [ // 1 pattern(s)
    [
      { s:284, n:0, g:0, r:127 },
      { s:168, n:0, g:1, r:127 }
    ]
  ],
  217: [ // 1 pattern(s)
    [
      { s:67, n:20, g:1, r:63 },
      { s:259, n:16, g:0, r:31 },
      { s:275, n:21, g:1, r:127 }
    ]
  ],
  296: [ // 1 pattern(s)
    [
      { s:355, n:24, g:0, r:127 },
      { s:167, n:0, g:1, r:127 }
    ]
  ],
};

/**
 * Species that have at least one encounter with NO locks ("First"):
 * 15, 90, 112, 175, 179, 216, 228, 249, 277, 318, 335, 343
 */
export const XD_SHADOW_LOCKS = {
  12: [ // 2 pattern(s)
    [
      { s:38, n:12, g:1, r:191 },
      { s:189, n:6, g:0, r:127 },
      { s:184, n:0, g:1, r:127 },
      { s:114, shadow:true, seen:false }
    ],
    [
      { s:38, n:12, g:1, r:191 },
      { s:189, n:6, g:0, r:127 },
      { s:184, n:0, g:1, r:127 },
      { s:114, shadow:true, seen:true }
    ]
  ],
  17: [ // 2 pattern(s)
    [
      { s:15, shadow:true, seen:false },
      { s:162, n:12, g:0, r:127 },
      { s:176, n:18, g:0, r:31 }
    ],
    [
      { s:15, shadow:true, seen:true },
      { s:162, n:12, g:0, r:127 },
      { s:176, n:18, g:0, r:31 }
    ]
  ],
  20: [ // 2 pattern(s)
    [
      { s:178, n:18, g:1, r:127 },
      { s:85, shadow:true, seen:false },
      { s:340, n:18, g:0, r:127 }
    ],
    [
      { s:178, n:18, g:1, r:127 },
      { s:85, shadow:true, seen:true },
      { s:340, n:18, g:0, r:127 }
    ]
  ],
  21: [ // 1 pattern(s)
    [
      { s:279, n:18, g:0, r:127 },
      { s:309, n:6, g:1, r:127 }
    ]
  ],
  24: [ // 1 pattern(s)
    [
      { s:367, n:6, g:0, r:127 },
      { s:332, n:0, g:1, r:127 },
      { s:110, n:12, g:1, r:127 },
      { s:217, n:18, g:1, r:127 }
    ]
  ],
  37: [ // 1 pattern(s)
    [
      { s:167, n:0, g:0, r:127 },
      { s:267, n:6, g:1, r:127 },
      { s:269, n:18, g:0, r:127 }
    ]
  ],
  46: [ // 1 pattern(s)
    [
      { s:336, n:24, g:0, r:127 },
      { s:198, n:6, g:1, r:127 }
    ]
  ],
  49: [ // 1 pattern(s)
    [
      { s:55, n:18, g:1, r:127 },
      { s:237, n:24, g:0, r:0 },
      { s:297, n:12, g:0, r:63 }
    ]
  ],
  51: [ // 1 pattern(s)
    [
      { s:362, n:0, g:0, r:127 },
      { s:181, n:18, g:0, r:127 },
      { s:286, n:6, g:1, r:127 },
      { s:232, n:12, g:0, r:127 }
    ]
  ],
  52: [ // 1 pattern(s)
    [
      { s:64, n:6, g:0, r:63 },
      { s:215, n:0, g:1, r:127 },
      { s:200, n:18, g:1, r:127 }
    ]
  ],
  55: [ // 1 pattern(s)
    [
      { s:342, n:24, g:0, r:127 },
      { s:279, n:6, g:1, r:127 },
      { s:226, n:18, g:1, r:127 }
    ]
  ],
  57: [ // 1 pattern(s)
    [
      { s:305, n:18, g:1, r:127 },
      { s:364, n:12, g:1, r:127 },
      { s:199, n:6, g:1, r:127 },
      { s:217, n:24, g:0, r:127 }
    ]
  ],
  58: [ // 2 pattern(s)
    [
      { s:336, n:24, g:0, r:127 },
      { s:198, n:6, g:1, r:127 },
      { s:46, shadow:true, seen:false }
    ],
    [
      { s:336, n:24, g:0, r:127 },
      { s:198, n:6, g:1, r:127 },
      { s:46, shadow:true, seen:true }
    ]
  ],
  62: [ // 1 pattern(s)
    [
      { s:199, n:18, g:0, r:127 },
      { s:217, n:18, g:0, r:127 },
      { s:306, n:24, g:0, r:127 },
      { s:365, n:6, g:1, r:127 }
    ]
  ],
  70: [ // 2 pattern(s)
    [
      { s:55, n:18, g:1, r:127 },
      { s:237, n:24, g:0, r:0 },
      { s:297, n:12, g:0, r:63 },
      { s:49, shadow:true, seen:false }
    ],
    [
      { s:55, n:18, g:1, r:127 },
      { s:237, n:24, g:0, r:0 },
      { s:297, n:12, g:0, r:63 },
      { s:49, shadow:true, seen:true }
    ]
  ],
  78: [ // 1 pattern(s)
    [
      { s:323, n:24, g:0, r:127 },
      { s:110, n:6, g:0, r:127 },
      { s:89, n:12, g:1, r:127 }
    ]
  ],
  82: [ // 1 pattern(s)
    [
      { s:292, n:18, g:2, r:255 },
      { s:202, n:0, g:0, r:127 },
      { s:329, n:12, g:1, r:127 }
    ]
  ],
  83: [ // 1 pattern(s)
    [
      { s:282, n:12, g:0, r:127 },
      { s:368, n:0, g:1, r:127 },
      { s:315, n:24, g:0, r:127 }
    ]
  ],
  85: [ // 1 pattern(s)
    [
      { s:178, n:18, g:1, r:127 }
    ]
  ],
  86: [ // 1 pattern(s)
    [
      { s:163, n:6, g:0, r:127 },
      { s:75, n:18, g:0, r:127 },
      { s:316, n:18, g:1, r:127 }
    ]
  ],
  88: [ // 1 pattern(s)
    [
      { s:358, n:12, g:0, r:127 },
      { s:234, n:18, g:0, r:127 }
    ]
  ],
  97: [ // 2 pattern(s)
    [
      { s:305, n:18, g:1, r:127 },
      { s:364, n:12, g:1, r:127 },
      { s:199, n:6, g:1, r:127 },
      { s:217, n:24, g:0, r:127 },
      { s:57, shadow:true, seen:false }
    ],
    [
      { s:305, n:18, g:1, r:127 },
      { s:364, n:12, g:1, r:127 },
      { s:199, n:6, g:1, r:127 },
      { s:217, n:24, g:0, r:127 },
      { s:57, shadow:true, seen:true }
    ]
  ],
  100: [ // 1 pattern(s)
    [
      { s:271, n:0, g:0, r:127 },
      { s:271, n:18, g:0, r:127 },
      { s:271, n:12, g:1, r:127 }
    ]
  ],
  103: [ // 2 pattern(s)
    [
      { s:112, shadow:true, seen:false },
      { s:146, shadow:true, seen:false }
    ],
    [
      { s:112, shadow:true, seen:true },
      { s:146, shadow:true, seen:true }
    ]
  ],
  105: [ // 3 pattern(s)
    [
      { s:291, n:6, g:1, r:127 },
      { s:310, shadow:true, seen:false },
      { s:373, shadow:true, seen:false },
      { s:330, n:24, g:0, r:127 }
    ],
    [
      { s:291, n:6, g:1, r:127 },
      { s:310, shadow:true, seen:true },
      { s:373, shadow:true, seen:false },
      { s:330, n:24, g:0, r:127 }
    ],
    [
      { s:291, n:6, g:1, r:127 },
      { s:310, shadow:true, seen:true },
      { s:373, shadow:true, seen:true },
      { s:330, n:24, g:0, r:127 }
    ]
  ],
  106: [ // 1 pattern(s)
    [
      { s:326, n:18, g:0, r:127 },
      { s:227, n:12, g:1, r:127 },
      { s:375, n:6, g:2, r:255 },
      { s:297, n:24, g:1, r:63 }
    ]
  ],
  107: [ // 1 pattern(s)
    [
      { s:308, n:24, g:0, r:127 },
      { s:76, n:6, g:1, r:127 },
      { s:178, n:18, g:1, r:127 }
    ]
  ],
  108: [ // 1 pattern(s)
    [
      { s:171, n:24, g:0, r:127 },
      { s:82, n:6, g:2, r:255 }
    ]
  ],
  113: [ // 2 pattern(s)
    [
      { s:234, n:6, g:1, r:127 },
      { s:295, n:24, g:0, r:127 },
      { s:123, shadow:true, seen:false }
    ],
    [
      { s:234, n:6, g:1, r:127 },
      { s:295, n:24, g:0, r:127 },
      { s:123, shadow:true, seen:true }
    ]
  ],
  114: [ // 1 pattern(s)
    [
      { s:38, n:12, g:1, r:191 },
      { s:189, n:6, g:0, r:127 },
      { s:184, n:0, g:1, r:127 }
    ]
  ],
  115: [ // 1 pattern(s)
    [
      { s:101, n:0, g:2, r:255 },
      { s:200, n:18, g:1, r:127 },
      { s:344, n:12, g:2, r:255 }
    ]
  ],
  121: [ // 2 pattern(s)
    [
      { s:375, n:24, g:2, r:255 },
      { s:195, n:6, g:0, r:127 },
      { s:212, n:0, g:1, r:127 },
      { s:338, shadow:true, seen:false },
      { s:351, n:18, g:0, r:127 }
    ],
    [
      { s:375, n:24, g:2, r:255 },
      { s:195, n:6, g:0, r:127 },
      { s:212, n:0, g:1, r:127 },
      { s:338, shadow:true, seen:true },
      { s:351, n:18, g:0, r:127 }
    ]
  ],
  122: [ // 2 pattern(s)
    [
      { s:199, n:18, g:0, r:127 },
      { s:217, n:18, g:0, r:127 },
      { s:306, n:24, g:0, r:127 },
      { s:365, n:6, g:1, r:127 },
      { s:62, shadow:true, seen:false }
    ],
    [
      { s:199, n:18, g:0, r:127 },
      { s:217, n:18, g:0, r:127 },
      { s:306, n:24, g:0, r:127 },
      { s:365, n:6, g:1, r:127 },
      { s:62, shadow:true, seen:true }
    ]
  ],
  123: [ // 1 pattern(s)
    [
      { s:234, n:6, g:1, r:127 },
      { s:295, n:24, g:0, r:127 }
    ]
  ],
  125: [ // 2 pattern(s)
    [
      { s:277, shadow:true, seen:false },
      { s:65, n:24, g:0, r:63 },
      { s:230, n:6, g:1, r:127 },
      { s:214, n:18, g:1, r:127 }
    ],
    [
      { s:277, shadow:true, seen:true },
      { s:65, n:24, g:0, r:63 },
      { s:230, n:6, g:1, r:127 },
      { s:214, n:18, g:1, r:127 }
    ]
  ],
  126: [ // 1 pattern(s)
    [
      { s:229, n:18, g:0, r:127 },
      { s:38, n:18, g:0, r:191 },
      { s:45, n:0, g:1, r:127 }
    ]
  ],
  127: [ // 2 pattern(s)
    [
      { s:229, n:18, g:0, r:127 },
      { s:38, n:18, g:0, r:191 },
      { s:45, n:0, g:1, r:127 },
      { s:126, shadow:true, seen:false }
    ],
    [
      { s:229, n:18, g:0, r:127 },
      { s:38, n:18, g:0, r:191 },
      { s:45, n:0, g:1, r:127 },
      { s:126, shadow:true, seen:true }
    ]
  ],
  128: [ // 3 pattern(s)
    [
      { s:112, shadow:true, seen:false },
      { s:146, shadow:true, seen:false },
      { s:103, shadow:true, seen:false }
    ],
    [
      { s:112, shadow:true, seen:true },
      { s:146, shadow:true, seen:true },
      { s:103, shadow:true, seen:false }
    ],
    [
      { s:112, shadow:true, seen:true },
      { s:146, shadow:true, seen:true },
      { s:103, shadow:true, seen:true }
    ]
  ],
  131: [ // 5 pattern(s)
    [
      { s:291, n:6, g:1, r:127 },
      { s:310, shadow:true, seen:false },
      { s:373, shadow:true, seen:false },
      { s:330, n:24, g:0, r:127 },
      { s:105, shadow:true, seen:false }
    ],
    [
      { s:291, n:6, g:1, r:127 },
      { s:310, shadow:true, seen:true },
      { s:373, shadow:true, seen:false },
      { s:330, n:24, g:0, r:127 },
      { s:105, shadow:true, seen:false }
    ],
    [
      { s:291, n:6, g:1, r:127 },
      { s:310, shadow:true, seen:true },
      { s:373, shadow:true, seen:true },
      { s:330, n:24, g:0, r:127 },
      { s:105, shadow:true, seen:false }
    ],
    [
      { s:291, n:6, g:1, r:127 },
      { s:310, shadow:true, seen:true },
      { s:373, shadow:true, seen:false },
      { s:330, n:24, g:0, r:127 },
      { s:105, shadow:true, seen:true }
    ],
    [
      { s:291, n:6, g:1, r:127 },
      { s:310, shadow:true, seen:true },
      { s:373, shadow:true, seen:true },
      { s:330, n:24, g:0, r:127 },
      { s:105, shadow:true, seen:true }
    ]
  ],
  143: [ // 3 pattern(s)
    [
      { s:277, shadow:true, seen:false },
      { s:65, n:24, g:0, r:63 },
      { s:230, n:6, g:1, r:127 },
      { s:214, n:18, g:1, r:127 },
      { s:125, shadow:true, seen:false }
    ],
    [
      { s:277, shadow:true, seen:true },
      { s:65, n:24, g:0, r:63 },
      { s:230, n:6, g:1, r:127 },
      { s:214, n:18, g:1, r:127 },
      { s:125, shadow:true, seen:false }
    ],
    [
      { s:277, shadow:true, seen:true },
      { s:65, n:24, g:0, r:63 },
      { s:230, n:6, g:1, r:127 },
      { s:214, n:18, g:1, r:127 },
      { s:125, shadow:true, seen:true }
    ]
  ],
  144: [ // 5 pattern(s)
    [
      { s:112, shadow:true, seen:false },
      { s:146, shadow:true, seen:false },
      { s:103, shadow:true, seen:false },
      { s:128, shadow:true, seen:false }
    ],
    [
      { s:112, shadow:true, seen:true },
      { s:146, shadow:true, seen:true },
      { s:103, shadow:true, seen:false },
      { s:128, shadow:true, seen:false }
    ],
    [
      { s:112, shadow:true, seen:true },
      { s:146, shadow:true, seen:true },
      { s:103, shadow:true, seen:false },
      { s:128, shadow:true, seen:true }
    ],
    [
      { s:112, shadow:true, seen:true },
      { s:146, shadow:true, seen:true },
      { s:103, shadow:true, seen:true },
      { s:128, shadow:true, seen:false }
    ],
    [
      { s:112, shadow:true, seen:true },
      { s:146, shadow:true, seen:true },
      { s:103, shadow:true, seen:true },
      { s:128, shadow:true, seen:true }
    ]
  ],
  145: [ // 9 pattern(s)
    [
      { s:112, shadow:true, seen:false },
      { s:146, shadow:true, seen:false },
      { s:103, shadow:true, seen:false },
      { s:128, shadow:true, seen:false },
      { s:144, shadow:true, seen:false }
    ],
    [
      { s:112, shadow:true, seen:true },
      { s:146, shadow:true, seen:true },
      { s:103, shadow:true, seen:false },
      { s:128, shadow:true, seen:false },
      { s:144, shadow:true, seen:false }
    ],
    [
      { s:112, shadow:true, seen:true },
      { s:146, shadow:true, seen:true },
      { s:103, shadow:true, seen:false },
      { s:128, shadow:true, seen:true },
      { s:144, shadow:true, seen:false }
    ],
    [
      { s:112, shadow:true, seen:true },
      { s:146, shadow:true, seen:true },
      { s:103, shadow:true, seen:false },
      { s:128, shadow:true, seen:false },
      { s:144, shadow:true, seen:true }
    ],
    [
      { s:112, shadow:true, seen:true },
      { s:146, shadow:true, seen:true },
      { s:103, shadow:true, seen:true },
      { s:128, shadow:true, seen:false },
      { s:144, shadow:true, seen:false }
    ],
    [
      { s:112, shadow:true, seen:true },
      { s:146, shadow:true, seen:true },
      { s:103, shadow:true, seen:false },
      { s:128, shadow:true, seen:true },
      { s:144, shadow:true, seen:true }
    ],
    [
      { s:112, shadow:true, seen:true },
      { s:146, shadow:true, seen:true },
      { s:103, shadow:true, seen:true },
      { s:128, shadow:true, seen:true },
      { s:144, shadow:true, seen:false }
    ],
    [
      { s:112, shadow:true, seen:true },
      { s:146, shadow:true, seen:true },
      { s:103, shadow:true, seen:true },
      { s:128, shadow:true, seen:false },
      { s:144, shadow:true, seen:true }
    ],
    [
      { s:112, shadow:true, seen:true },
      { s:146, shadow:true, seen:true },
      { s:103, shadow:true, seen:true },
      { s:128, shadow:true, seen:true },
      { s:144, shadow:true, seen:true }
    ]
  ],
  146: [ // 1 pattern(s)
    [
      { s:112, shadow:true, seen:false }
    ]
  ],
  149: [ // 1 pattern(s)
    [
      { s:272, n:0, g:0, r:127 },
      { s:272, n:18, g:0, r:127 },
      { s:272, n:12, g:1, r:127 },
      { s:272, n:12, g:1, r:127 },
      { s:272, n:0, g:0, r:127 }
    ]
  ],
  165: [ // 1 pattern(s)
    [
      { s:276, n:0, g:1, r:127 }
    ]
  ],
  167: [ // 1 pattern(s)
    [
      { s:220, n:12, g:1, r:127 },
      { s:353, n:6, g:0, r:127 }
    ]
  ],
  177: [ // 1 pattern(s)
    [
      { s:281, n:0, g:0, r:127 },
      { s:264, n:0, g:1, r:127 }
    ]
  ],
  204: [ // 1 pattern(s)
    [
      { s:198, n:6, g:0, r:127 }
    ]
  ],
  219: [ // 2 pattern(s)
    [
      { s:323, n:24, g:0, r:127 },
      { s:110, n:6, g:0, r:127 },
      { s:89, n:12, g:1, r:127 },
      { s:78, shadow:true, seen:false }
    ],
    [
      { s:323, n:24, g:0, r:127 },
      { s:110, n:6, g:0, r:127 },
      { s:89, n:12, g:1, r:127 },
      { s:78, shadow:true, seen:true }
    ]
  ],
  220: [ // 1 pattern(s)
    [
      { s:324, n:18, g:1, r:127 },
      { s:274, n:0, g:0, r:127 }
    ]
  ],
  261: [ // 1 pattern(s)
    [
      { s:41, n:12, g:1, r:127 }
    ]
  ],
  273: [ // 3 pattern(s)
    [
      { s:43, n:6, g:0, r:127 },
      { s:331, n:24, g:1, r:127 },
      { s:285, n:18, g:1, r:127 },
      { s:270, n:0, g:0, r:127 },
      { s:204, n:12, g:0, r:127 }
    ],
    [
      { s:43, n:6, g:0, r:127 },
      { s:331, n:24, g:1, r:127 },
      { s:285, n:0, g:1, r:127 },
      { s:270, n:0, g:1, r:127 },
      { s:204, n:6, g:0, r:127 }
    ],
    [
      { s:45, n:6, g:0, r:127 },
      { s:332, n:24, g:1, r:127 },
      { s:286, n:0, g:1, r:127 },
      { s:271, n:0, g:0, r:127 },
      { s:205, n:12, g:0, r:127 }
    ]
  ],
  280: [ // 1 pattern(s)
    [
      { s:64, n:0, g:0, r:63 },
      { s:180, n:6, g:1, r:127 },
      { s:288, n:18, g:0, r:127 }
    ]
  ],
  285: [ // 1 pattern(s)
    [
      { s:209, n:24, g:1, r:191 },
      { s:352, n:0, g:1, r:127 }
    ]
  ],
  296: [ // 1 pattern(s)
    [
      { s:352, n:6, g:0, r:127 },
      { s:283, n:18, g:1, r:127 }
    ]
  ],
  299: [ // 1 pattern(s)
    [
      { s:271, n:0, g:0, r:127 },
      { s:271, n:18, g:0, r:127 },
      { s:271, n:12, g:1, r:127 }
    ]
  ],
  301: [ // 1 pattern(s)
    [
      { s:370, n:6, g:1, r:191 },
      { s:267, n:0, g:0, r:127 },
      { s:315, n:24, g:0, r:127 }
    ]
  ],
  302: [ // 2 pattern(s)
    [
      { s:342, n:24, g:0, r:127 },
      { s:279, n:6, g:1, r:127 },
      { s:226, n:18, g:1, r:127 },
      { s:55, shadow:true, seen:false }
    ],
    [
      { s:342, n:24, g:0, r:127 },
      { s:279, n:6, g:1, r:127 },
      { s:226, n:18, g:1, r:127 },
      { s:55, shadow:true, seen:true }
    ]
  ],
  303: [ // 1 pattern(s)
    [
      { s:294, n:6, g:0, r:127 },
      { s:203, n:18, g:1, r:127 }
    ]
  ],
  310: [ // 1 pattern(s)
    [
      { s:291, n:6, g:1, r:127 }
    ]
  ],
  315: [ // 1 pattern(s)
    [
      { s:223, n:6, g:0, r:127 },
      { s:42, n:18, g:0, r:127 }
    ]
  ],
  316: [ // 1 pattern(s)
    [
      { s:109, n:12, g:1, r:127 },
      { s:88, n:6, g:0, r:127 }
    ]
  ],
  322: [ // 1 pattern(s)
    [
      { s:280, n:6, g:0, r:127 },
      { s:100, n:0, g:2, r:255 },
      { s:371, n:24, g:1, r:127 }
    ]
  ],
  334: [ // 2 pattern(s)
    [
      { s:282, n:12, g:0, r:127 },
      { s:368, n:0, g:1, r:127 },
      { s:315, n:24, g:0, r:127 },
      { s:83, shadow:true, seen:false }
    ],
    [
      { s:282, n:12, g:0, r:127 },
      { s:368, n:0, g:1, r:127 },
      { s:315, n:24, g:0, r:127 },
      { s:83, shadow:true, seen:true }
    ]
  ],
  337: [ // 1 pattern(s)
    [
      { s:171, n:0, g:1, r:127 },
      { s:195, n:18, g:0, r:127 }
    ]
  ],
  338: [ // 1 pattern(s)
    [
      { s:375, n:24, g:2, r:255 },
      { s:195, n:6, g:0, r:127 },
      { s:212, n:0, g:1, r:127 }
    ]
  ],
  354: [ // 2 pattern(s)
    [
      { s:101, n:0, g:2, r:255 },
      { s:200, n:18, g:1, r:127 },
      { s:344, n:12, g:2, r:255 },
      { s:115, shadow:true, seen:false }
    ],
    [
      { s:101, n:0, g:2, r:255 },
      { s:200, n:18, g:1, r:127 },
      { s:344, n:12, g:2, r:255 },
      { s:115, shadow:true, seen:true }
    ]
  ],
  355: [ // 1 pattern(s)
    [
      { s:215, n:12, g:0, r:127 },
      { s:193, n:18, g:1, r:127 },
      { s:200, n:24, g:0, r:127 }
    ]
  ],
  361: [ // 1 pattern(s)
    [
      { s:336, n:6, g:1, r:127 }
    ]
  ],
  363: [ // 2 pattern(s)
    [
      { s:116, n:24, g:0, r:63 },
      { s:118, n:12, g:1, r:127 }
    ],
    [
      { s:116, n:24, g:0, r:63 },
      { s:118, n:12, g:1, r:127 },
      { s:374, n:0, g:2, r:255 }
    ]
  ],
  373: [ // 2 pattern(s)
    [
      { s:291, n:6, g:1, r:127 },
      { s:310, shadow:true, seen:false }
    ],
    [
      { s:291, n:6, g:1, r:127 },
      { s:310, shadow:true, seen:true }
    ]
  ],
};

/** Species in Colo that have at least one lock-free encounter variant */
export const COLO_NO_LOCK_SPECIES = new Set([153, 156, 159, 162, 164, 166, 168, 176, 180, 185, 188, 190, 192, 193, 195, 198, 200, 205, 206, 210, 211, 213, 214, 215, 218, 221, 223, 225, 226, 227, 229, 234, 235, 237, 241, 243, 244, 245, 248, 307, 329, 333, 357, 359, 376]);

/** Species in XD that have at least one lock-free encounter variant */
export const XD_NO_LOCK_SPECIES = new Set([15, 90, 112, 175, 179, 216, 228, 249, 277, 318, 335, 343]);
