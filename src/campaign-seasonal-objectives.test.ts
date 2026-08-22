import { describe, expect, it } from 'vitest';

import {
  campaignSeasonalObjectiveSets,
  campaignSeasonalObjectives,
  isValidCampaignSeasonalObjectiveClaimKey,
  resolveCampaignSeasonalObjective,
  sanitizeCampaignId,
  sanitizeCampaignSeasonalObjectiveClaimKeys,
  sanitizeCampaignSeasonalObjectiveId,
} from './campaign-seasonal-objectives';

describe('campaign seasonal objectives', () => {
  it('defines only Spring and Summer objective sets for all four main campaigns', () => {
    expect(Object.keys(campaignSeasonalObjectiveSets).sort()).toEqual(['spring','summer']);
    for (const season of ['spring','summer'] as const) {
      expect(Object.keys(campaignSeasonalObjectiveSets[season]).sort()).toEqual([
        'arcanist',
        'caretaker',
        'pathfinder',
        'vanguard',
      ]);
      for (const campaign of ['caretaker','pathfinder','vanguard','arcanist'] as const) {
        expect(campaignSeasonalObjectiveSets[season][campaign].length).toBeGreaterThanOrEqual(2);
      }
    }
    expect(campaignSeasonalObjectives('autumn' as never,'caretaker')).toEqual([]);
    expect(campaignSeasonalObjectives('winter' as never,'arcanist')).toEqual([]);
  });

  it.each([
    ['caretaker','spring',['bond'],'spring_caretaker_bond'],
    ['caretaker','summer',['rescue'],'summer_caretaker_rescue'],
    ['caretaker','summer',['protect'],'summer_caretaker_rescue'],
    ['caretaker','spring',['recovery'],'spring_caretaker_guardianship'],
    ['pathfinder','spring',['discovery'],'spring_pathfinder_discovery'],
    ['pathfinder','spring',['uncleared_region'],'spring_pathfinder_frontier'],
    ['pathfinder','summer',['limited_exploration'],'summer_pathfinder_limited_route'],
    ['vanguard','spring',['tactical_challenge'],'spring_vanguard_challenge'],
    ['vanguard','spring',['strong_opponent'],'spring_vanguard_challenge'],
    ['vanguard','summer',['win_streak'],'summer_vanguard_chain'],
    ['arcanist','spring',['relic'],'spring_arcanist_relic'],
    ['arcanist','spring',['status_combat'],'spring_arcanist_resonance'],
    ['arcanist','summer',['astral'],'summer_arcanist_rift'],
    ['arcanist','summer',['rift'],'summer_arcanist_rift'],
  ] as const)('maps %s %s existing action signals to one objective', (campaign,season,signals,objectiveId) => {
    const result = resolveCampaignSeasonalObjective({
      year:1,
      week:1,
      season,
      campaign,
      signals:[...signals],
      claimedKeys:[],
    });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.objective.id).toBe(objectiveId);
    expect(result.claimKey).toBe(`1-${season}:${campaign}:${objectiveId}`);
  });

  it('lets one action resolve at most one objective even when it carries several matching facts', () => {
    const first = resolveCampaignSeasonalObjective({
      year:1,
      week:1,
      season:'summer',
      campaign:'caretaker',
      signals:['rescue','protect','recovery','bond'],
      claimedKeys:[],
    });
    expect(first.accepted).toBe(true);
    if (!first.accepted) return;
    expect(first.objective.id).toBe('summer_caretaker_rescue');

    const duplicate = resolveCampaignSeasonalObjective({
      year:1,
      week:1,
      season:'summer',
      campaign:'caretaker',
      signals:['rescue','protect','recovery','bond'],
      claimedKeys:[first.claimKey],
    });
    expect(duplicate).toEqual(expect.objectContaining({ accepted:false, reason:'already_claimed' }));
  });

  it('keeps rewards claimed across reload and weekly rollover because claims are season scoped', () => {
    const first = resolveCampaignSeasonalObjective({
      year:2,
      week:1,
      season:'spring',
      campaign:'pathfinder',
      signals:['discovery'],
      claimedKeys:[],
    });
    expect(first.accepted).toBe(true);
    if (!first.accepted) return;

    const hydratedClaims = sanitizeCampaignSeasonalObjectiveClaimKeys([
      first.claimKey,
      first.claimKey,
      'bad',
    ]);
    const afterReload = resolveCampaignSeasonalObjective({
      year:2,
      week:1,
      season:'spring',
      campaign:'pathfinder',
      signals:['discovery'],
      claimedKeys:hydratedClaims,
    });
    const nextWeek = resolveCampaignSeasonalObjective({
      year:2,
      week:2,
      season:'spring',
      campaign:'pathfinder',
      signals:['discovery'],
      claimedKeys:hydratedClaims,
    });

    expect(hydratedClaims).toEqual([first.claimKey]);
    expect(afterReload).toEqual(expect.objectContaining({ accepted:false, reason:'already_claimed' }));
    expect(nextWeek).toEqual(expect.objectContaining({ accepted:false, reason:'already_claimed' }));
  });

  it('sanitizes malformed Campaign, Objective, and claim IDs without aliasing noncanonical values', () => {
    expect(sanitizeCampaignId('caretaker')).toBe('caretaker');
    expect(sanitizeCampaignId('Caretaker')).toBeNull();
    expect(sanitizeCampaignId('true_path')).toBeNull();
    expect(sanitizeCampaignId('retired_campaign')).toBeNull();

    expect(sanitizeCampaignSeasonalObjectiveId('spring_caretaker_bond')).toBe('spring_caretaker_bond');
    expect(sanitizeCampaignSeasonalObjectiveId('retired_objective')).toBeNull();

    expect(isValidCampaignSeasonalObjectiveClaimKey('1-spring:caretaker:spring_caretaker_bond')).toBe(true);
    expect(isValidCampaignSeasonalObjectiveClaimKey('01-spring:caretaker:spring_caretaker_bond')).toBe(false);
    expect(isValidCampaignSeasonalObjectiveClaimKey('1-autumn:caretaker:spring_caretaker_bond')).toBe(false);
    expect(isValidCampaignSeasonalObjectiveClaimKey('1-spring:true_path:spring_caretaker_bond')).toBe(false);
    expect(isValidCampaignSeasonalObjectiveClaimKey('1-spring:caretaker:retired_objective')).toBe(false);
  });

  it('emits a Legacy-compatible campaign result hook without implementing True Campaign clues', () => {
    const result = resolveCampaignSeasonalObjective({
      year:1,
      week:3,
      season:'summer',
      campaign:'arcanist',
      signals:['rift','status_combat'],
      claimedKeys:[],
    });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;

    expect(result.legacyHook).toEqual({
      kind:'campaign_seasonal_objective',
      campaignResult:{
        campaignId:'arcanist',
        seasonKey:'1-summer',
        objectiveId:'summer_arcanist_rift',
        sourceDomain:'rift',
      },
      trueClue:undefined,
    });
  });

  it('does not mutate or require Sanctuary/Astral/Celestial/Rift state to interpret Arcanist signals', () => {
    const astral = resolveCampaignSeasonalObjective({
      year:1,
      week:2,
      season:'summer',
      campaign:'arcanist',
      signals:['astral'],
      claimedKeys:[],
    });
    expect(astral.accepted).toBe(true);
    if (!astral.accepted) return;
    expect(astral.objective.id).toBe('summer_arcanist_rift');
    expect(Object.keys(astral)).not.toContain('sanctuaryState');
    expect(Object.keys(astral)).not.toContain('astralState');
    expect(Object.keys(astral)).not.toContain('celestialState');
    expect(Object.keys(astral)).not.toContain('riftState');
  });
});
