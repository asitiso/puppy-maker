import { describe, expect, it } from 'vitest';
import { equipExpeditionRelic, expeditionRelicDefinitions, relicModifiers, unequipExpeditionRelic } from './expedition-relics';

describe('expedition relics', () => {
  it('defines exactly six expedition relics', () => {
    expect(expeditionRelicDefinitions).toHaveLength(6);
  });

  it('exposes the approved combat modifiers', () => {
    expect(relicModifiers(['moonfang_charm'])).toMatchObject({ attack: 0.06 });
    expect(relicModifiers(['mana_prism'])).toMatchObject({ charge: 0.06 });
    expect(relicModifiers(['wind_feather'])).toMatchObject({ dodge: 0.08 });
    expect(relicModifiers(['guardian_thread'])).toMatchObject({ all: 0.03 });
    expect(relicModifiers(['explorer_compass']).materialBonus).toBe(1);
    expect(relicModifiers(['bond_locket']).firstClearAffection).toBe(2);
  });

  it('enforces unique owned equipment and a three-slot cap', () => {
    const owned = ['moonfang_charm', 'mana_prism', 'wind_feather', 'guardian_thread'] as const;
    let equipped: any[] = [];
    equipped = equipExpeditionRelic(equipped, owned as any, 'moonfang_charm');
    equipped = equipExpeditionRelic(equipped, owned as any, 'moonfang_charm');
    equipped = equipExpeditionRelic(equipped, owned as any, 'mana_prism');
    equipped = equipExpeditionRelic(equipped, owned as any, 'wind_feather');
    equipped = equipExpeditionRelic(equipped, owned as any, 'guardian_thread');
    expect(equipped).toEqual(['moonfang_charm', 'mana_prism', 'wind_feather']);
    expect(unequipExpeditionRelic(equipped as any, 'mana_prism')).toEqual(['moonfang_charm', 'wind_feather']);
  });
});
