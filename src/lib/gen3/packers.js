// Helpers for packing little-endian words and computing checksum.
export function u32(x){ return (x >>> 0); }

export function writeU16LE(buf, off, v){
  buf[off] = v & 0xFF;
  buf[off+1] = (v >>> 8) & 0xFF;
}

export function writeU32LE(buf, off, v){
  buf[off] = v & 0xFF;
  buf[off+1] = (v >>> 8) & 0xFF;
  buf[off+2] = (v >>> 16) & 0xFF;
  buf[off+3] = (v >>> 24) & 0xFF;
}

export function readU32LE(buf, off){
  return (buf[off] | (buf[off+1]<<8) | (buf[off+2]<<16) | (buf[off+3]<<24)) >>> 0;
}

// IV packing per Gen3 spec (bits: HP,ATK,DEF,SPE,SPA,SPD + Egg + Ability)
// hp, atk, def, spe, spa, spd ∈ [0..31]; eggBit, abilityBit ∈ {0,1}
export function packIVWord({hp, atk, def, spe, spa, spd}, eggBit=0, abilityBit=0){
  let w = 0;
  w |= (hp & 0x1F);
  w |= (atk & 0x1F) << 5;
  w |= (def & 0x1F) << 10;
  w |= (spe & 0x1F) << 15;
  w |= (spa & 0x1F) << 20;
  w |= (spd & 0x1F) << 25;
  w |= (eggBit & 1) << 30;
  w |= (abilityBit & 1) << 31;
  return u32(w);
}

// 16-bit checksum of decrypted 48 bytes (sum of 16-bit LE words)
export function checksum16(decrypted48){
  let sum = 0;
  for(let i=0;i<48;i+=2){
    const w = decrypted48[i] | (decrypted48[i+1] << 8);
    sum = (sum + w) & 0xFFFF;
  }
  return sum;
}

// Simple hex utilities
export function hexByte(n){ return n.toString(16).padStart(2,'0').toUpperCase(); }
export function bytesToHex(bytes){ return Array.from(bytes, hexByte).join(''); }
export function bytesToFormattedHex(bytes){
  // Format as 10 lines of 8 bytes each (16 hex chars per line, with extra space in middle)
  const hex = Array.from(bytes, hexByte);
  const lines = [];
  for(let i = 0; i < hex.length; i += 8){
    const chunk = hex.slice(i, i + 8);
    const line = chunk.slice(0, 4).join(' ') + '  ' + chunk.slice(4, 8).join(' ');
    lines.push(line);
  }
  return lines.join('\n');
}
