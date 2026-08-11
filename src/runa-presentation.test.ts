import { describe, expect, it } from 'vitest';
import { initialState } from './game';
import { runaPoseAsset, selectRunaPose } from './runa-presentation';

describe('Runa presentation state', () => {
  it('uses tired art when Runa is tired at home', () => {
    expect(selectRunaPose({ ...initialState, condition: 'tired' })).toBe('tired');
    expect(runaPoseAsset('tired')).toBe('/assets/runa/runa_tired.png');
  });

  it('uses talk art during bonding and idle art by default', () => {
    expect(selectRunaPose(initialState, 'bond')).toBe('talk');
    expect(runaPoseAsset('talk')).toBe('/assets/runa/runa_talk.png');
    expect(selectRunaPose(initialState)).toBe('idle');
    expect(runaPoseAsset('idle')).toBe('/assets/home/runa_idle_layer.png');
  });

  it('maps gameplay reactions to the prepared Runa assets', () => {
    expect(runaPoseAsset('surprised')).toBe('/assets/runa/runa_surprised.png');
    expect(runaPoseAsset('training-ready')).toBe('/assets/runa/runa_training_ready.png');
  });
});
