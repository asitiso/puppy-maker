export const mainCampaignIds=['caretaker','pathfinder','vanguard','arcanist'] as const;
export const campaignIds=[...mainCampaignIds,'true_path'] as const;
export const campaignPhases=['spring_exploration','path_selection','summer','autumn','winter','ending'] as const;
export const campaignRoutes=['normal','hollow'] as const;
export const characterIds=['mira','kael','rex','selene','noa','eiden','lyra','veyr'] as const;
export const majorEventIds=['guardian_festival','great_expedition','long_night'] as const;
export const majorOutcomeResults=['exceptional_victory','victory','costly_victory','defeat'] as const;
export const campaignMilestoneIds=['path_convergence','summer_resolved','autumn_resolved','winter_resolved','ending_committed'] as const;
export const dangerBehaviorIds=['sacrificed_ally_for_victory','used_forbidden_relic','exploited_bond','ignored_civilians','accepted_veyr_power'] as const;
export const hollowDangerEvidenceIds=[
  'ally_sacrifice',
  'instrumental_bond',
  'civilian_tradeoff',
  'forbidden_relic',
  'rift_dependence',
  'veyr_power',
] as const;

export const majorChoiceOptions={
  caretaker_autumn:['save_one','spread_risk','team_solution'],
  pathfinder_autumn:['open_route','seal_route','limited_access'],
  vanguard_autumn:['centralize','preserve_independence','coalition_command'],
  arcanist_autumn:['use_relic','destroy_relic','controlled_use'],
} as const;

export type MainCampaignId=typeof mainCampaignIds[number];
export type CampaignId=typeof campaignIds[number];
export type CampaignPhase=typeof campaignPhases[number];
export type CampaignRoute=typeof campaignRoutes[number];
export type CharacterId=typeof characterIds[number];
export type MajorEventId=typeof majorEventIds[number];
export type MajorOutcomeResult=typeof majorOutcomeResults[number];
export type CampaignMilestoneId=typeof campaignMilestoneIds[number];
export type DangerBehaviorId=typeof dangerBehaviorIds[number];
export type HollowDangerEvidenceId=typeof hollowDangerEvidenceIds[number];
export type MajorChoiceId=keyof typeof majorChoiceOptions;
export type MajorChoiceOptionId=typeof majorChoiceOptions[MajorChoiceId][number];

export const hollowDangerEvidenceByBehavior:Record<DangerBehaviorId,HollowDangerEvidenceId>={
  sacrificed_ally_for_victory:'ally_sacrifice',
  used_forbidden_relic:'forbidden_relic',
  exploited_bond:'instrumental_bond',
  ignored_civilians:'civilian_tradeoff',
  accepted_veyr_power:'veyr_power',
};
