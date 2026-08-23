import {describe,expect,it} from 'vitest';
import {emptyCampaignRunState} from './campaign-state';
import {
  commitHollowDangerEvidence,
  hollowDangerEvidenceIds,
  resolveHollowDangerState,
} from './hollow-danger';

describe('Hollow canonical danger authority',()=>{
  it('derives stable and fractured only from distinct canonical current-run evidence',()=>{
    expect(resolveHollowDangerState({score:999,evidence:[]})).toEqual({
      tier:'stable',evidence:[],finalChoiceAvailable:false,
    });
    expect(resolveHollowDangerState({
      evidence:['instrumental_bond','instrumental_bond','civilian_tradeoff','stale'],
    })).toEqual({
      tier:'fractured',evidence:['instrumental_bond','civilian_tradeoff'],finalChoiceAvailable:false,
    });
  });

  it('requires three distinct evidence IDs including one severe choice for the candidate opportunity',()=>{
    expect(resolveHollowDangerState({
      evidence:['instrumental_bond','civilian_tradeoff','rift_dependence'],
    })).toMatchObject({tier:'fractured',finalChoiceAvailable:false});

    expect(resolveHollowDangerState({
      evidence:['instrumental_bond','civilian_tradeoff','veyr_power'],
    })).toEqual({
      tier:'hollow_candidate',
      evidence:['instrumental_bond','civilian_tradeoff','veyr_power'],
      finalChoiceAvailable:true,
    });
  });

  it('records canonical evidence exactly once and rejects unknown evidence',()=>{
    const state=emptyCampaignRunState();
    const first=commitHollowDangerEvidence(state,'forbidden_relic');
    expect(first.committed).toBe(true);
    if(!first.committed)throw new Error('expected first evidence commit');
    expect(first.state.dangerState.evidence).toEqual(['forbidden_relic']);

    const duplicate=commitHollowDangerEvidence(first.state,'forbidden_relic');
    expect(duplicate).toEqual({committed:false,state:first.state,reason:'already_recorded'});

    expect(commitHollowDangerEvidence(first.state,'made_up')).toEqual({
      committed:false,state:first.state,reason:'invalid_evidence',
    });
  });

  it('keeps a stable typed registry for every canonical Hollow evidence category',()=>{
    expect(hollowDangerEvidenceIds).toEqual([
      'ally_sacrifice',
      'instrumental_bond',
      'civilian_tradeoff',
      'forbidden_relic',
      'rift_dependence',
      'veyr_power',
    ]);
  });
});
