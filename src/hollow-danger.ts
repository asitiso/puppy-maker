import {
  dangerBehaviorIds,
  hollowDangerEvidenceByBehavior,
  hollowDangerEvidenceIds,
  type HollowDangerEvidenceId,
} from './campaign-model';
import type {CampaignRunState} from './campaign-state';
import {isV3Record,uniqueRegistered} from './v3-state-sanitize';

export {hollowDangerEvidenceIds};
export type HollowDangerTier='stable'|'fractured'|'hollow_candidate';

const severeEvidenceIds=new Set<HollowDangerEvidenceId>([
  'ally_sacrifice','forbidden_relic','veyr_power',
]);

function canonicalEvidence(raw:unknown):HollowDangerEvidenceId[]{
  const source=isV3Record(raw)?raw:{};
  const explicit=uniqueRegistered(source.evidence,hollowDangerEvidenceIds);
  const behaviors=uniqueRegistered(source.behaviors,dangerBehaviorIds);
  const inferred=behaviors.map(behavior=>hollowDangerEvidenceByBehavior[behavior]);
  return hollowDangerEvidenceIds.filter(id=>explicit.includes(id)||inferred.includes(id));
}

export function resolveHollowDangerState(raw:unknown):{
  tier:HollowDangerTier;
  evidence:HollowDangerEvidenceId[];
  finalChoiceAvailable:boolean;
}{
  const evidence=canonicalEvidence(raw);
  const hasSevere=evidence.some(id=>severeEvidenceIds.has(id));
  const candidate=evidence.length>=3&&hasSevere;
  const tier:HollowDangerTier=candidate?'hollow_candidate':evidence.length>=2?'fractured':'stable';
  return {tier,evidence,finalChoiceAvailable:candidate};
}

export function commitHollowDangerEvidence(state:CampaignRunState,evidenceId:unknown):
  | {committed:true;state:CampaignRunState}
  | {committed:false;state:CampaignRunState;reason:'invalid_evidence'|'already_recorded'}{
  if(typeof evidenceId!=='string'||!(hollowDangerEvidenceIds as readonly string[]).includes(evidenceId)){
    return {committed:false,state,reason:'invalid_evidence'};
  }
  const id=evidenceId as HollowDangerEvidenceId;
  const current=resolveHollowDangerState(state.dangerState).evidence;
  if(current.includes(id))return {committed:false,state,reason:'already_recorded'};
  const evidence=hollowDangerEvidenceIds.filter(candidate=>current.includes(candidate)||candidate===id);
  return {
    committed:true,
    state:{
      ...state,
      dangerState:{...state.dangerState,evidence},
    },
  };
}
