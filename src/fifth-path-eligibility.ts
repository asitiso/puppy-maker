import {mainCampaignIds} from './campaign-model';
import {
  hydrateLegacyState,
  trueClueIds,
  type LegacyState,
  type TruePathEvidenceId,
} from './legacy-state';

export const fifthPathEligibilityReasonIds=[
  'campaign_breadth',
  'canonical_clues',
  'meaningful_world_outcome',
  'key_bond_memory',
  'significant_fail_forward',
  'endgame_history',
  'sufficient_ngplus_history',
] as const;
export type FifthPathEligibilityReason=typeof fifthPathEligibilityReasonIds[number];

export type FifthPathEligibilityEvidence={
  campaignBreadth:boolean;
  canonicalClues:boolean;
  meaningfulWorldOutcome:boolean;
  keyBondMemory:boolean;
  significantFailForward:boolean;
  endgameHistory:boolean;
  sufficientNgPlusHistory:boolean;
};

const endgameEvidence=new Set<TruePathEvidenceId>([
  'sanctuary_history','astral_history','celestial_history','rift_history',
]);

export function resolveFifthPathEligibility(raw:LegacyState){
  const legacy=hydrateLegacyState(raw);
  const summaryCampaigns=new Set(legacy.runSummaries.map(summary=>summary.campaign));
  const completedCampaigns=new Set(legacy.completedCampaigns);
  const clues=new Set(legacy.trueClues);
  const evidenceIds=new Set(legacy.runSummaries.flatMap(summary=>summary.truePathEvidence));

  const evidence:FifthPathEligibilityEvidence={
    campaignBreadth:mainCampaignIds.every(id=>completedCampaigns.has(id)&&summaryCampaigns.has(id)),
    canonicalClues:trueClueIds.every(id=>clues.has(id)),
    meaningfulWorldOutcome:legacy.runSummaries.some(summary=>summary.majorWorldOutcomes.length>0),
    keyBondMemory:legacy.runSummaries.some(summary=>summary.keyBondMemories.length>0),
    significantFailForward:evidenceIds.has('significant_fail_forward'),
    endgameHistory:[...endgameEvidence].some(id=>evidenceIds.has(id)),
    sufficientNgPlusHistory:legacy.completedRuns>=4&&legacy.runSummaries.length>=4,
  };

  const reasons:FifthPathEligibilityReason[]=[];
  if(!evidence.campaignBreadth)reasons.push('campaign_breadth');
  if(!evidence.canonicalClues)reasons.push('canonical_clues');
  if(!evidence.meaningfulWorldOutcome)reasons.push('meaningful_world_outcome');
  if(!evidence.keyBondMemory)reasons.push('key_bond_memory');
  if(!evidence.significantFailForward)reasons.push('significant_fail_forward');
  if(!evidence.endgameHistory)reasons.push('endgame_history');
  if(!evidence.sufficientNgPlusHistory)reasons.push('sufficient_ngplus_history');
  return {eligible:reasons.length===0,reasons,evidence};
}
