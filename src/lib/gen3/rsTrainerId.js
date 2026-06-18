const MULT = 0x41C64E6D;
const ADD = 0x6073;

function advance(seed) {
  return (Math.imul(seed, MULT) + ADD) >>> 0;
}

export function isValidRSTrainerId(tid, sid) {
  tid = Number(tid) & 0xffff;
  sid = Number(sid) & 0xffff;

  const state1High = sid << 16;

  for (let low = 0; low <= 0xffff; low++) {
    const state1 = (state1High | low) >>> 0;
    const state2 = advance(state1);

    if ((state2 >>> 16) === tid) {
      return true;
    }
  }

  return false;
}

export function generateValidRSTrainerId() {
  const seed = (Math.random() * 0x100000000) >>> 0;

  const state1 = advance(seed);
  const sid = state1 >>> 16;

  const state2 = advance(state1);
  const tid = state2 >>> 16;

  return { tid, sid, seed };
}

function isShinyForTidSid(pid, tid, sid) {
  pid = Number(pid) >>> 0;
  tid = Number(tid) & 0xffff;
  sid = Number(sid) & 0xffff;

  const pidHigh = (pid >>> 16) & 0xffff;
  const pidLow = pid & 0xffff;
  return (((pidHigh ^ pidLow) ^ (tid ^ sid)) < 8);
}

export function adjustShinySidForRSTrainerId(tid, pid, sid) {
  tid = Number(tid) & 0xffff;
  pid = Number(pid) >>> 0;
  sid = Number(sid) & 0xffff;

  if (isValidRSTrainerId(tid, sid)) {
    return { sid, adjusted: false, direction: 0, valid: true };
  }

  for (const direction of [1, -1]) {
    const candidate = sid + direction;
    if (candidate < 0 || candidate > 0xffff) continue;
    if (!isShinyForTidSid(pid, tid, candidate)) continue;
    if (!isValidRSTrainerId(tid, candidate)) continue;

    return {
      sid: candidate,
      adjusted: true,
      direction,
      valid: true,
    };
  }

  return { sid, adjusted: false, direction: 0, valid: false };
}
