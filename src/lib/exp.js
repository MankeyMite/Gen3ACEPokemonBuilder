export const GROUP = {
  MEDIUM_FAST: 0,
  ERRATIC: 1,
  FLUCTUATING: 2,
  MEDIUM_SLOW: 3,
  FAST: 4,
  SLOW: 5
};

// Compute total experience required to reach level n for given group
export function expForLevel(group, n) {
  // Gen 3 behaviour: level 1 EXP is always 0
  if (n <= 1) return 0;
  
  n = Math.max(1, Math.min(100, Math.floor(n)));
  
  switch (group) {
    case GROUP.MEDIUM_FAST:
      return Math.floor(Math.pow(n, 3));
    
    case GROUP.ERRATIC: {
      if (n < 50) {
        return Math.floor((Math.pow(n, 3) * (100 - n)) / 50);
      } else if (n < 68) {
        return Math.floor((Math.pow(n, 3) * (150 - n)) / 100);
      } else if (n < 98) {
        return Math.floor((Math.pow(n, 3) * Math.floor((1911 - 10 * n) / 3)) / 500);
      } else {
        return Math.floor((Math.pow(n, 3) * (160 - n)) / 100);
      }
    }
    
    case GROUP.FLUCTUATING: {
      if (n < 15) {
        return Math.floor((Math.pow(n, 3) * (Math.floor((n + 1) / 3) + 24)) / 50);
      } else if (n < 36) {
        return Math.floor((Math.pow(n, 3) * (n + 14)) / 50);
      } else {
        return Math.floor((Math.pow(n, 3) * (Math.floor(n / 2) + 32)) / 50);
      }
    }
    
    case GROUP.MEDIUM_SLOW:
      return Math.floor((6/5) * Math.pow(n, 3) - 15 * Math.pow(n, 2) + 100 * n - 140);
    
    case GROUP.FAST:
      return Math.floor((4 * Math.pow(n, 3)) / 5);
    
    case GROUP.SLOW:
      return Math.floor((5 * Math.pow(n, 3)) / 4);
    
    default:
      return Math.floor(Math.pow(n, 3));
  }
}

// Given a total experience value, return the resulting level (largest l such that expForLevel(group,l) <= exp)
export function levelForExp(group, exp) {
  let e = Math.max(0, Math.floor(exp));
  let level = 1;
  for (let n = 1; n <= 100; n++) {
    const req = expForLevel(group, n);
    if (req <= e) level = n;
    else break;
  }
  return level;
}
