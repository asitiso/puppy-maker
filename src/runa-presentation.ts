import type { GameState } from './game';

export type RunaPose = 'idle' | 'talk' | 'surprised' | 'training-ready' | 'tired';

const poseAssets: Record<RunaPose, string> = {
  idle: '/assets/home/runa_idle_layer.png',
  talk: '/assets/runa/runa_talk.png',
  surprised: '/assets/runa/runa_surprised.png',
  'training-ready': '/assets/runa/runa_training_ready.png',
  tired: '/assets/runa/runa_tired.png',
};

export function selectRunaPose(state: GameState, context?: string): RunaPose {
  if (context === 'bond' || context === 'dialogue') return 'talk';
  if (context === 'reward' || context === 'event') return 'surprised';
  if (context === 'training') return 'training-ready';
  if (state.condition === 'tired') return 'tired';
  return 'idle';
}

export function runaPoseAsset(pose: RunaPose): string {
  return poseAssets[pose] ?? poseAssets.idle;
}
