/* Windermere lake soundscape: buffers for the CoreEngine's named sources.
 * Content is what the lake holds - fell wind, shore lap, dawn chorus, evening
 * crickets and owls - synthesized, no samples, no voice. The scene profiles in
 * AudioEngine.mapSceneAudioProfile are unchanged; only what each named buffer
 * contains is new. */

import {
  makeCtx,
  windNoise,
  whistleWind,
  lapping,
  streamBed,
  birdChirps,
  coos,
  insects,
  hoots,
} from './soundscape-layers.js';

const SEED = 1902;

function mix2(a, b, wa = 1, wb = 1) {
  const n = a.L.length;
  const out = { L: new Float32Array(n), R: new Float32Array(n) };
  for (let i = 0; i < n; i++) {
    out.L[i] = a.L[i] * wa + b.L[i] * wa * 0 + b.L[i] * wb;
    out.R[i] = a.R[i] * wa + b.R[i] * wb;
  }
  return out;
}

/* Render every named buffer the CoreEngine wires up. Returns {key: {L, R}}. */
export function renderLakeBuffers(sr) {
  const S = 12;
  const ctx = (seed) => makeCtx(sr, S, seed);

  /* fell wind with a ridge whistle */
  const wind = mix2(
    windNoise(ctx(SEED + 1), { color: 0.03, gustDepth: 0.5, base: 0.5 }),
    whistleWind(ctx(SEED + 2), { fMin: 240, fMax: 640, q: 7, gain: 0.14 }),
    1,
    1
  );

  /* shore lap with a little sparkle */
  const ripples = mix2(
    lapping(ctx(SEED + 3), { gain: 0.45, period: 1.9, depth: 0.7 }),
    streamBed(ctx(SEED + 4), { gain: 0.12, period: 0.31, depth: 0.4 }),
    1,
    1
  );

  /* dawn hush: low air over still water, faint far lap */
  const mist = mix2(
    windNoise(ctx(SEED + 5), { color: 0.015, gustDepth: 0.35, base: 0.4 }),
    lapping(ctx(SEED + 6), { gain: 0.16, period: 3.1, depth: 0.5 }),
    1,
    1
  );

  /* dawn chorus: songbirds close and far, a dove under it */
  const birds = mix2(
    birdChirps(ctx(SEED + 7), {
      count: 16,
      fLo: 2100,
      fHi: 3900,
      trill: 16,
      gain: 0.3,
      minGap: 0.35,
    }),
    birdChirps(ctx(SEED + 8), {
      count: 9,
      fLo: 1400,
      fHi: 2400,
      gain: 0.2,
      minGap: 0.8,
      syllables: 2,
    }),
    1,
    1
  );
  const doves = coos(ctx(SEED + 9), { count: 4, f: 560, gain: 0.12 });
  for (let i = 0; i < birds.L.length; i++) {
    birds.L[i] += doves.L[i];
    birds.R[i] += doves.R[i];
  }

  /* evening field: crickets with a tawny owl */
  const crickets = mix2(
    insects(ctx(SEED + 10), { f: 4400, pulseHz: 26, gain: 0.05 }),
    hoots(ctx(SEED + 11), { count: 3, f: 350, gain: 0.22 }),
    1,
    1
  );

  return {
    ambient_wind: wind,
    water_ripples: ripples,
    ambient_mist: mist,
    birds,
    crickets,
  };
}

/* Preview program for tools/render-audio-preview.mjs: scenes mirror
 * mapSceneAudioProfile gains exactly. */
export const previewProgram = {
  defaultScene: 'dawn',
  layers: {
    ambient_wind: {
      seconds: 12,
      seed: SEED + 1,
      render: (c) => {
        const b = renderLakeBuffers(c.sr).ambient_wind;
        c.L = b.L.slice(0, c.n);
        c.R = b.R.slice(0, c.n);
        return c;
      },
    },
    water_ripples: {
      seconds: 12,
      seed: SEED + 3,
      render: (c) => {
        const b = renderLakeBuffers(c.sr).water_ripples;
        c.L = b.L.slice(0, c.n);
        c.R = b.R.slice(0, c.n);
        return c;
      },
    },
    ambient_mist: {
      seconds: 12,
      seed: SEED + 5,
      render: (c) => {
        const b = renderLakeBuffers(c.sr).ambient_mist;
        c.L = b.L.slice(0, c.n);
        c.R = b.R.slice(0, c.n);
        return c;
      },
    },
    birds: {
      seconds: 12,
      seed: SEED + 7,
      render: (c) => {
        const b = renderLakeBuffers(c.sr).birds;
        c.L = b.L.slice(0, c.n);
        c.R = b.R.slice(0, c.n);
        return c;
      },
    },
    crickets: {
      seconds: 12,
      seed: SEED + 10,
      render: (c) => {
        const b = renderLakeBuffers(c.sr).crickets;
        c.L = b.L.slice(0, c.n);
        c.R = b.R.slice(0, c.n);
        return c;
      },
    },
  },
  scenes: {
    dawn: [
      { layer: 'ambient_mist', gain: 1.0 },
      { layer: 'birds', gain: 0.5 },
    ],
    midday: [
      { layer: 'ambient_wind', gain: 1.0 },
      { layer: 'water_ripples', gain: 0.8 },
    ],
    twilight: [
      { layer: 'water_ripples', gain: 0.5 },
      { layer: 'crickets', gain: 0.6 },
    ],
  },
};

export default previewProgram;
