import { mainCampaignIds, type MainCampaignId } from './campaign-model';
import type { SeasonId } from './seasonal-cycle';

export type CampaignSeasonalObjectiveSeason = 'spring'|'summer';
export type CampaignSeasonalSignalKind =
  | 'bond'
  | 'rescue'
  | 'protect'
  | 'recovery'
  | 'discovery'
  | 'uncleared_region'
  | 'limited_exploration'
  | 'tactical_challenge'
  | 'win_streak'
  | 'strong_opponent'
  | 'relic'
  | 'astral'
  | 'rift'
  | 'status_combat';

export const campaignSeasonalObjectiveIds = [
  'spring_caretaker_bond',
  'spring_caretaker_guardianship',
  'spring_pathfinder_discovery',
  'spring_pathfinder_frontier',
  'spring_vanguard_challenge',
  'spring_vanguard_streak',
  'spring_arcanist_relic',
  'spring_arcanist_resonance',
  'summer_caretaker_rescue',
  'summer_caretaker_recovery',
  'summer_pathfinder_uncharted',
  'summer_pathfinder_limited_route',
  'summer_vanguard_elite',
  'summer_vanguard_chain',
  'summer_arcanist_rift',
  'summer_arcanist_rule_shift',
] as const;

export type CampaignSeasonalObjectiveId = typeof campaignSeasonalObjectiveIds[number];

export type CampaignSeasonalObjectiveReward = {
  kind:'campaign_memory';
  memoryId:`${CampaignSeasonalObjectiveId}_memory`;
};

export type CampaignSeasonalObjectiveDefinition = {
  id:CampaignSeasonalObjectiveId;
  season:CampaignSeasonalObjectiveSeason;
  campaign:MainCampaignId;
  label:string;
  signals:readonly CampaignSeasonalSignalKind[];
  reward:CampaignSeasonalObjectiveReward;
};

export type CampaignSeasonalLegacyHook = {
  kind:'campaign_seasonal_objective';
  campaignResult:{
    campaignId:MainCampaignId;
    seasonKey:`${number}-${CampaignSeasonalObjectiveSeason}`;
    objectiveId:CampaignSeasonalObjectiveId;
    sourceDomain:CampaignSeasonalSignalKind;
  };
  trueClue:undefined|{
    clueId:string;
    domain:'season';
  };
};

const signalKinds = [
  'bond','rescue','protect','recovery',
  'discovery','uncleared_region','limited_exploration',
  'tactical_challenge','win_streak','strong_opponent',
  'relic','astral','rift','status_combat',
] as const satisfies readonly CampaignSeasonalSignalKind[];

const mainCampaignIdSet = new Set<string>(mainCampaignIds);
const objectiveIdSet = new Set<string>(campaignSeasonalObjectiveIds);
const signalKindSet = new Set<string>(signalKinds);

function objective(
  id:CampaignSeasonalObjectiveId,
  season:CampaignSeasonalObjectiveSeason,
  campaign:MainCampaignId,
  label:string,
  signals:readonly CampaignSeasonalSignalKind[],
):CampaignSeasonalObjectiveDefinition {
  return { id, season, campaign, label, signals, reward:{ kind:'campaign_memory', memoryId:`${id}_memory` } };
}

export const campaignSeasonalObjectiveSets:Record<CampaignSeasonalObjectiveSeason,Record<MainCampaignId,readonly CampaignSeasonalObjectiveDefinition[]>> = {
  spring:{
    caretaker:[
      objective('spring_caretaker_bond','spring','caretaker','마음을 지키는 약속',['bond']),
      objective('spring_caretaker_guardianship','spring','caretaker','돌봄의 첫 선택',['rescue','protect','recovery']),
    ],
    pathfinder:[
      objective('spring_pathfinder_discovery','spring','pathfinder','지도 밖의 발견',['discovery']),
      objective('spring_pathfinder_frontier','spring','pathfinder','미답의 경계',['uncleared_region','limited_exploration']),
    ],
    vanguard:[
      objective('spring_vanguard_challenge','spring','vanguard','강자에게 맞서기',['tactical_challenge','strong_opponent']),
      objective('spring_vanguard_streak','spring','vanguard','흐름을 이어가기',['win_streak']),
    ],
    arcanist:[
      objective('spring_arcanist_relic','spring','arcanist','유물의 첫 공명',['relic']),
      objective('spring_arcanist_resonance','spring','arcanist','별빛 규칙 읽기',['astral','status_combat','rift']),
    ],
  },
  summer:{
    caretaker:[
      objective('summer_caretaker_rescue','summer','caretaker','위기 속 보호',['rescue','protect']),
      objective('summer_caretaker_recovery','summer','caretaker','다시 일어설 자리',['recovery','bond']),
    ],
    pathfinder:[
      objective('summer_pathfinder_uncharted','summer','pathfinder','금지된 좌표',['discovery','uncleared_region']),
      objective('summer_pathfinder_limited_route','summer','pathfinder','제한된 행동으로 길 찾기',['limited_exploration']),
    ],
    vanguard:[
      objective('summer_vanguard_elite','summer','vanguard','강적 격파',['strong_opponent']),
      objective('summer_vanguard_chain','summer','vanguard','연전의 압박',['win_streak','tactical_challenge']),
    ],
    arcanist:[
      objective('summer_arcanist_rift','summer','arcanist','균열의 공명',['rift','astral']),
      objective('summer_arcanist_rule_shift','summer','arcanist','바뀐 규칙을 이용하기',['status_combat','relic']),
    ],
  },
};

export function sanitizeCampaignId(value:unknown):MainCampaignId|null {
  return typeof value === 'string' && mainCampaignIdSet.has(value) ? value as MainCampaignId : null;
}

export function sanitizeCampaignSeasonalObjectiveId(value:unknown):CampaignSeasonalObjectiveId|null {
  return typeof value === 'string' && objectiveIdSet.has(value) ? value as CampaignSeasonalObjectiveId : null;
}

function sanitizeObjectiveSeason(value:unknown):CampaignSeasonalObjectiveSeason|null {
  return value === 'spring' || value === 'summer' ? value : null;
}

function sanitizeSignals(raw:unknown):CampaignSeasonalSignalKind[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((value):value is CampaignSeasonalSignalKind => typeof value === 'string' && signalKindSet.has(value)))];
}

function canonicalYear(value:unknown):number|null {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value >= 1 ? value : null;
}

function validWeek(value:unknown):boolean {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 4;
}

export function campaignSeasonalObjectives(season:SeasonId,campaign:MainCampaignId):readonly CampaignSeasonalObjectiveDefinition[] {
  const objectiveSeason = sanitizeObjectiveSeason(season);
  return objectiveSeason ? campaignSeasonalObjectiveSets[objectiveSeason][campaign] : [];
}

function definitionFor(
  season:CampaignSeasonalObjectiveSeason,
  campaign:MainCampaignId,
  objectiveId:CampaignSeasonalObjectiveId,
):CampaignSeasonalObjectiveDefinition|null {
  return campaignSeasonalObjectiveSets[season][campaign].find(objective => objective.id === objectiveId) ?? null;
}

export function isValidCampaignSeasonalObjectiveClaimKey(value:string):boolean {
  const match = /^([1-9]\d*)-(spring|summer):(caretaker|pathfinder|vanguard|arcanist):([a-z0-9_]+)$/.exec(value);
  if (!match) return false;
  const season = match[2] as CampaignSeasonalObjectiveSeason;
  const campaign = sanitizeCampaignId(match[3]);
  const objectiveId = sanitizeCampaignSeasonalObjectiveId(match[4]);
  return Boolean(campaign && objectiveId && definitionFor(season,campaign,objectiveId));
}

export function sanitizeCampaignSeasonalObjectiveClaimKeys(raw:unknown):string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((value):value is string => typeof value === 'string' && isValidCampaignSeasonalObjectiveClaimKey(value)))];
}

export function resolveCampaignSeasonalObjective(input:{
  year:unknown;
  week:unknown;
  season:unknown;
  campaign:unknown;
  signals:unknown;
  claimedKeys:unknown;
}) {
  const year = canonicalYear(input.year);
  const season = sanitizeObjectiveSeason(input.season);
  const campaign = sanitizeCampaignId(input.campaign);
  if (!year || !season || !campaign || !validWeek(input.week)) {
    return { accepted:false as const, reason:'invalid_context' as const };
  }

  const signals = sanitizeSignals(input.signals);
  const objective = campaignSeasonalObjectiveSets[season][campaign]
    .find(candidate => candidate.signals.some(signal => signals.includes(signal)));
  if (!objective) return { accepted:false as const, reason:'no_match' as const };

  const claimKey = `${year}-${season}:${campaign}:${objective.id}` as const;
  const claimedKeys = sanitizeCampaignSeasonalObjectiveClaimKeys(input.claimedKeys);
  if (claimedKeys.includes(claimKey)) {
    return { accepted:false as const, reason:'already_claimed' as const, objective, claimKey };
  }

  const sourceDomain = signals.find(signal => objective.signals.includes(signal))!;
  const legacyHook:CampaignSeasonalLegacyHook = {
    kind:'campaign_seasonal_objective',
    campaignResult:{
      campaignId:campaign,
      seasonKey:`${year}-${season}`,
      objectiveId:objective.id,
      sourceDomain,
    },
    trueClue:undefined,
  };

  return {
    accepted:true as const,
    objective,
    claimKey,
    reward:objective.reward,
    legacyHook,
  };
}
