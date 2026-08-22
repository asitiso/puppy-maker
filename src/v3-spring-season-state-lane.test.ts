import {describe,expect,it} from 'vitest';
import {emptyCampaignRunState,hydrateCampaignRunState} from './campaign-state';
import {
  resolveCampaignSeasonalObjective,
  sanitizeCampaignSeasonalObjectiveClaimKeys as sanitizeObjectiveClaimKeysFromAdapter,
} from './campaign-seasonal-objectives';
import {sanitizeCampaignSeasonalObjectiveClaimKeys as sanitizeObjectiveClaimKeysFromState} from './campaign-seasonal-claim-keys';
import {emptyV3PersistentState,hydrateV3PersistentState,prepareNewRunState} from './v3-persistent-state';

const claimKey='1-spring:caretaker:spring_caretaker_bond';

describe('V3 Spring Lane C season/state vertical slice',()=>{
  it('stores Seasonal Objective claims in a dedicated CampaignRun ledger',()=>{
    expect(emptyCampaignRunState().claimedSeasonalObjectives).toEqual([]);
    expect(hydrateCampaignRunState({
      claimedSeasonalObjectives:[claimKey,claimKey,'bad','01-spring:caretaker:spring_caretaker_bond'],
    }).claimedSeasonalObjectives).toEqual([claimKey]);
  });

  it('keeps adapter and persistent claim sanitizers in lockstep',()=>{
    const raw=[
      claimKey,
      claimKey,
      '2-summer:arcanist:summer_arcanist_rift',
      '0-spring:caretaker:spring_caretaker_bond',
      '01-spring:caretaker:spring_caretaker_bond',
      '1-winter:caretaker:spring_caretaker_bond',
      '1-spring:vanguard:spring_caretaker_bond',
      '1-spring:caretaker:stale_objective',
      7,
      null,
    ];
    expect(sanitizeObjectiveClaimKeysFromState(raw)).toEqual(sanitizeObjectiveClaimKeysFromAdapter(raw));
  });

  it('keeps one-action/one-objective reward-once across save, load, reload and week rollover',()=>{
    const initial=emptyV3PersistentState();
    const first=resolveCampaignSeasonalObjective({
      year:1,
      week:1,
      season:'spring',
      campaign:'caretaker',
      signals:['bond','rescue','protect','recovery'],
      claimedKeys:initial.campaignRun.claimedSeasonalObjectives,
    });
    expect(first.accepted).toBe(true);
    if(!first.accepted)return;
    expect(first.objective.id).toBe('spring_caretaker_bond');

    const saved={
      ...initial,
      campaignRun:{
        ...initial.campaignRun,
        claimedSeasonalObjectives:[...initial.campaignRun.claimedSeasonalObjectives,first.claimKey],
      },
    };
    const loaded=hydrateV3PersistentState(JSON.parse(JSON.stringify(saved)));
    const reloaded=hydrateV3PersistentState(JSON.parse(JSON.stringify(loaded)));

    expect(reloaded).toEqual(loaded);
    expect(reloaded.campaignRun.claimedSeasonalObjectives).toEqual([first.claimKey]);

    const nextWeek=resolveCampaignSeasonalObjective({
      year:1,
      week:2,
      season:'spring',
      campaign:'caretaker',
      signals:['bond','rescue','protect','recovery'],
      claimedKeys:reloaded.campaignRun.claimedSeasonalObjectives,
    });
    expect(nextWeek).toEqual(expect.objectContaining({accepted:false,reason:'already_claimed'}));
  });

  it('resets the dedicated claim ledger on a new run without mutating Legacy',()=>{
    const current={
      ...emptyV3PersistentState(),
      campaignRun:{...emptyCampaignRunState(),claimedSeasonalObjectives:[claimKey]},
    };
    const next=prepareNewRunState(current);
    expect(next.campaignRun.claimedSeasonalObjectives).toEqual([]);
    expect(next.legacy).toEqual(current.legacy);
  });

  it('emits only the Legacy hook contract and does not implement True Campaign',()=>{
    const result=resolveCampaignSeasonalObjective({
      year:1,
      week:3,
      season:'spring',
      campaign:'caretaker',
      signals:['bond'],
      claimedKeys:[],
    });
    expect(result.accepted).toBe(true);
    if(!result.accepted)return;
    expect(result.legacyHook).toEqual({
      kind:'campaign_seasonal_objective',
      campaignResult:{
        campaignId:'caretaker',
        seasonKey:'1-spring',
        objectiveId:'spring_caretaker_bond',
        sourceDomain:'bond',
      },
      trueClue:undefined,
    });
  });
});
