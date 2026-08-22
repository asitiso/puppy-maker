import {describe,expect,it} from 'vitest';
import {emptyCampaignRunState} from './campaign-state';
import {emptyCharacterBondsState,hydrateCharacterBondsState} from './character-bonds';
import {
  applyFirstCommitmentCharacterBond,
  commitSpringCampaign,
  openPathConvergence,
  pathConvergence,
  resolveFirstCommitment,
  scoreCappedSpringAffinities,
  scoreSpringAffinityEvidence,
} from './spring-raising';

describe('V3 Spring Raising',()=>{
  it('aggregates finite positive affinity evidence by campaign',()=>{
    expect(scoreSpringAffinityEvidence([
      {campaign:'caretaker',source:'training',amount:2,reason:'protected an ally'},
      {campaign:'caretaker',source:'dialogue',amount:3,reason:'shared responsibility'},
      {campaign:'pathfinder',source:'exploration',amount:4,reason:'found a hidden route'},
      {campaign:'vanguard',source:'tactical',amount:Infinity,reason:'corrupt'},
      {campaign:'arcanist',source:'calling',amount:-3,reason:'invalid'},
    ])).toEqual({caretaker:5,pathfinder:4,vanguard:0,arcanist:0});
  });

  it('caps each campaign source while preserving distinct behavioral sources',()=>{
    expect(scoreCappedSpringAffinities([
      {campaign:'caretaker',source:'training',amount:4,reason:'protected an ally'},
      {campaign:'caretaker',source:'training',amount:4,reason:'protected an ally again'},
      {campaign:'caretaker',source:'training',amount:4,reason:'protected an ally again'},
      {campaign:'caretaker',source:'dialogue',amount:5,reason:'shared responsibility'},
      {campaign:'pathfinder',source:'exploration',amount:7,reason:'mapped hidden routes'},
    ])).toEqual({caretaker:11,pathfinder:6,vanguard:0,arcanist:0});
  });

  it('always exposes two main paths and only a close eligible third without raw scores',()=>{
    const evidence=[
      {campaign:'caretaker' as const,source:'bond' as const,amount:6,reason:'stood beside Mira'},
      {campaign:'caretaker' as const,source:'dialogue' as const,amount:5,reason:'shared the burden'},
      {campaign:'pathfinder' as const,source:'exploration' as const,amount:6,reason:'found a hidden route'},
      {campaign:'pathfinder' as const,source:'calling' as const,amount:4,reason:'followed the unknown'},
      {campaign:'vanguard' as const,source:'tactical' as const,amount:6,reason:'won a difficult battle'},
      {campaign:'vanguard' as const,source:'training' as const,amount:2,reason:'trained under pressure'},
      {campaign:'arcanist' as const,source:'calling' as const,amount:1,reason:'studied a relic'},
    ];
    const candidates=pathConvergence(evidence,{eligibleThird:['vanguard']});
    expect(candidates.map(candidate=>candidate.campaign)).toEqual(['caretaker','pathfinder','vanguard']);
    expect(candidates).toHaveLength(3);
    expect(candidates.every(candidate=>candidate.reasons.length>0)).toBe(true);
    expect(candidates.every(candidate=>!('score' in candidate)&&!('affinity' in candidate))).toBe(true);
    expect(pathConvergence([])).toHaveLength(2);
    expect(pathConvergence(evidence,{eligibleThird:[]})).toHaveLength(2);
  });

  it('opens convergence, commits one candidate once, then locks the campaign',()=>{
    const evidence=[
      {campaign:'caretaker' as const,source:'bond' as const,amount:6,reason:'stood beside Mira'},
      {campaign:'caretaker' as const,source:'dialogue' as const,amount:5,reason:'shared the burden'},
      {campaign:'pathfinder' as const,source:'exploration' as const,amount:6,reason:'found a hidden route'},
    ];
    const opened=openPathConvergence(emptyCampaignRunState(),evidence);
    expect(opened.state.phase).toBe('path_selection');
    expect(opened.state.seasonMilestones).toContain('path_convergence');
    expect(opened.candidates).toHaveLength(2);
    const first=commitSpringCampaign(opened.state,opened.candidates,'caretaker');
    expect(first.committed).toBe(true);
    expect(first.state.activeCampaign).toBe('caretaker');
    expect(first.state.campaignAffinities.caretaker).toBe(11);
    const replay=commitSpringCampaign(first.state,opened.candidates,'pathfinder');
    expect(replay.committed).toBe(false);
    expect(replay.reason).toBe('locked');
    expect(replay.state.activeCampaign).toBe('caretaker');
  });

  it('emits First Commitment once before Summer and applies an idempotent representative Character Bond',()=>{
    const opened=openPathConvergence(emptyCampaignRunState(),[
      {campaign:'caretaker',source:'bond',amount:6,reason:'stood beside Mira'},
      {campaign:'pathfinder',source:'exploration',amount:5,reason:'found a hidden route'},
    ]);
    const committed=commitSpringCampaign(opened.state,opened.candidates,'caretaker');
    const commitment=resolveFirstCommitment(committed.state);
    expect(commitment.event).toMatchObject({type:'first_commitment',campaign:'caretaker',character:'mira'});
    expect(commitment.state.phase).toBe('summer');
    expect(resolveFirstCommitment(commitment.state).event).toBeNull();

    const bonds=applyFirstCommitmentCharacterBond(emptyCharacterBondsState(),commitment.event!);
    expect(bonds.mira.trust).toBe(3);
    expect(bonds.mira.memories).toContain('mira_first_commitment');
    const replay=applyFirstCommitmentCharacterBond(bonds,commitment.event!);
    expect(replay.mira.trust).toBe(3);
    expect(replay.mira.memories).toEqual(['mira_first_commitment']);
    expect(hydrateCharacterBondsState(replay).mira.memories).toContain('mira_first_commitment');
  });
});
