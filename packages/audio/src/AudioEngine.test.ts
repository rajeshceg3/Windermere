/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioEngine } from './AudioEngine';

// Mock AudioContext because jsdom doesn't have it
class MockAudioContext {
  createGain() {
    return {
      connect: vi.fn(),
      gain: {
        value: 1,
        linearRampToValueAtTime: vi.fn()
      }
    };
  }
  createPanner() { return { connect: vi.fn() }; }
  createBufferSource() { return { connect: vi.fn() }; }
  destination = {};
  currentTime = 10;
  state = 'running';
  resume = vi.fn();
}

vi.stubGlobal('AudioContext', MockAudioContext);
vi.stubGlobal('webkitAudioContext', MockAudioContext);

describe('AudioEngine', () => {
  let engine: AudioEngine;

  beforeEach(async () => {
    vi.clearAllMocks();
    engine = new AudioEngine();
    await engine.initialize();
  });

  it('initializes successfully', () => {
    expect(engine.getContext()).toBeDefined();
    expect(engine.getMasterGain()).toBeDefined();
  });

  describe('State Switching (mapSceneAudioProfile)', () => {
    it('transitions to DawnSurface audio profile correctly', () => {
      const context = engine.getContext();
      const ambientMistSource = context!.createGain();
      const birdsSource = context!.createGain();
      const otherSource = context!.createGain();

      const audioSources: Record<string, GainNode> = {
        'ambient_mist': ambientMistSource as unknown as GainNode,
        'birds': birdsSource as unknown as GainNode,
        'other': otherSource as unknown as GainNode,
      };

      engine.mapSceneAudioProfile('DawnSurface', audioSources);

      const targetTime = context!.currentTime + 2.0;

      // Check that all sources are initially scheduled to ramp to 0
      expect(ambientMistSource.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, targetTime);
      expect(birdsSource.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, targetTime);
      expect(otherSource.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, targetTime);

      // Check that specific sources for DawnSurface ramp to their target values
      expect(ambientMistSource.gain.linearRampToValueAtTime).toHaveBeenCalledWith(1.0, targetTime);
      expect(birdsSource.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.5, targetTime);
    });

    it('transitions to MiddayExpanse audio profile correctly', () => {
      const context = engine.getContext();
      const ambientWindSource = context!.createGain();
      const waterRipplesSource = context!.createGain();
      const otherSource = context!.createGain();

      const audioSources: Record<string, GainNode> = {
        'ambient_wind': ambientWindSource as unknown as GainNode,
        'water_ripples': waterRipplesSource as unknown as GainNode,
        'other': otherSource as unknown as GainNode,
      };

      engine.mapSceneAudioProfile('MiddayExpanse', audioSources);

      const targetTime = context!.currentTime + 2.0;

      // specific sources for MiddayExpanse ramp to target values
      expect(ambientWindSource.gain.linearRampToValueAtTime).toHaveBeenCalledWith(1.0, targetTime);
      expect(waterRipplesSource.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.8, targetTime);
    });

    it('transitions to TwilightStillness audio profile correctly', () => {
      const context = engine.getContext();
      const ambientPianoSource = context!.createGain();
      const cricketsSource = context!.createGain();
      const otherSource = context!.createGain();

      const audioSources: Record<string, GainNode> = {
        'ambient_piano': ambientPianoSource as unknown as GainNode,
        'crickets': cricketsSource as unknown as GainNode,
        'other': otherSource as unknown as GainNode,
      };

      engine.mapSceneAudioProfile('TwilightStillness', audioSources);

      const targetTime = context!.currentTime + 2.0;

      // specific sources for TwilightStillness ramp to target values
      expect(ambientPianoSource.gain.linearRampToValueAtTime).toHaveBeenCalledWith(1.0, targetTime);
      expect(cricketsSource.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.6, targetTime);
    });
  });
});
