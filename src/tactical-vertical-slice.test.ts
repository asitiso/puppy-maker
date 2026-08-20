import { describe, expect, it } from 'vitest';
import { isBattleFinished } from './tactical-battle';
import { chooseAutoCombinationUltimate, chooseTacticalEngineAction } from './tactical-ai';
import { nextTacticalActor, resolveTacticalAction } from './tactical-engine';
import { createTacticalExpeditionBattle, resolveTacticalExpeditionReward } from './tactical-expedition';
import { resolveCombinationUltimate } from './tactical-ultimate';
import { buildTacticalBattleView } from './tactical-ui';

const progression = { power: 42, magic: 32, agility: 13, maxHp: 150 };

describe('tactical 3v3 vertical slice', () => {
  it('finishes a complete expedition battle without an AI or turn stall', () => {
    let session = createTacticalExpeditionBattle('city_gate', ['wolf', 'owl'], progression, 73);
    let steps = 0;
    let ultimateUsed = false;

    while (!isBattleFinished(session) && steps < 120) {
      const before = session;
      const actorId = nextTacticalActor(session);
      expect(actorId).not.toBeNull();

      if (actorId === 'runa') {
        const ultimate = chooseAutoCombinationUltimate(session, ['wolf', 'owl'], { wolf: 5, owl: 1 });
        if (ultimate) {
          session = resolveCombinationUltimate(session, ultimate);
          ultimateUsed = ultimateUsed || session !== before;
        }
      }

      if (session === before) {
        const move = chooseTacticalEngineAction(session, actorId!, session.seed + session.round + session.acted.length);
        expect(move, `actor ${actorId} must always have a legal action`).not.toBeNull();
        session = resolveTacticalAction(session, move!);
      }

      expect(session, `actor ${actorId} must advance the battle`).not.toBe(before);
      steps += 1;
    }

    const result = isBattleFinished(session);
    expect(result).not.toBeNull();
    expect(steps).toBeLessThan(120);
    expect(ultimateUsed).toBe(true);

    const view = buildTacticalBattleView(session, false, 1);
    expect(view.result).toBe(result);
    expect(view.activeActorId).toBeNull();

    const reward = resolveTacticalExpeditionReward('city_gate', result!);
    if (result === 'victory') {
      expect(reward.coins).toBeGreaterThan(0);
      expect(reward.expeditionScore).toBeGreaterThan(0);
    } else {
      expect(reward.coins).toBe(0);
      expect(reward.expeditionScore).toBe(0);
    }
  });
});
