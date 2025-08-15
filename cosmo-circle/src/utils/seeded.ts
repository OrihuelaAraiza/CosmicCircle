// src/utils/seeded.ts
export function seededRandom(seed: string) {
    let h = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return () => {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      const t = (h ^= h >>> 16) >>> 0;
      return (t & 0xfffffff) / 0x10000000;
    };
  }
  
  export function seededPosition3D(id: string, spread = 25) {
    const rnd = seededRandom(id);
    const r = (0.55 + rnd() * 0.45) * spread;
    const theta = rnd() * Math.PI * 2;
    const phi = Math.acos(2 * rnd() - 1);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    return { x, y, z };
  }