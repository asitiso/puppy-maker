import { sanctuaryGrandProgress } from './sanctuary-grand-milestones';

export type SanctuaryConstellationId = 'dawn_compass' | 'scholar_star' | 'wayfarer_star' | 'guardian_star' | 'celestial_crown';

type ConstellationEffects = {
  monthlyJourneyBonus:number;
  trainingPercent:number;
  expeditionJourneyBonus:number;
  fatigueRecovery:number;
  stressRecovery:number;
};

export type SanctuaryConstellationNode = {
  id:SanctuaryConstellationId;
  name:string;
  threshold:number;
  requires:SanctuaryConstellationId[];
  effects:Partial<ConstellationEffects>;
};

export const sanctuaryConstellationNodes:SanctuaryConstellationNode[] = [
  { id:'dawn_compass', name:'새벽의 나침반', threshold:20, requires:[], effects:{ monthlyJourneyBonus:2 } },
  { id:'scholar_star', name:'학자의 별', threshold:35, requires:['dawn_compass'], effects:{ trainingPercent:5, expeditionJourneyBonus:1 } },
  { id:'wayfarer_star', name:'방랑자의 별', threshold:42, requires:['dawn_compass'], effects:{ expeditionJourneyBonus:2 } },
  { id:'guardian_star', name:'수호자의 별', threshold:50, requires:['scholar_star'], effects:{ fatigueRecovery:2, stressRecovery:2 } },
  { id:'celestial_crown', name:'천상의 왕관', threshold:65, requires:['scholar_star','wayfarer_star','guardian_star'], effects:{ monthlyJourneyBonus:3, trainingPercent:5 } },
];

export const constellationProgress = sanctuaryGrandProgress;

export function availableConstellationNodes(progress:number,unlocked:ReadonlyArray<SanctuaryConstellationId>) {
  return sanctuaryConstellationNodes.filter(node =>
    !unlocked.includes(node.id) && node.threshold <= progress && node.requires.every(id => unlocked.includes(id))
  );
}

export function canUnlockConstellationNode(id:SanctuaryConstellationId,unlocked:ReadonlyArray<SanctuaryConstellationId>,progress:number) {
  const definition = sanctuaryConstellationNodes.find(node => node.id === id)!;
  const accepted = !unlocked.includes(id) && definition.threshold <= progress && definition.requires.every(required => unlocked.includes(required));
  return { accepted, definition };
}

export function constellationEffects(unlocked:ReadonlyArray<SanctuaryConstellationId>):ConstellationEffects {
  return sanctuaryConstellationNodes.filter(node => unlocked.includes(node.id)).reduce<ConstellationEffects>((sum,node) => ({
    monthlyJourneyBonus:sum.monthlyJourneyBonus + (node.effects.monthlyJourneyBonus ?? 0),
    trainingPercent:sum.trainingPercent + (node.effects.trainingPercent ?? 0),
    expeditionJourneyBonus:sum.expeditionJourneyBonus + (node.effects.expeditionJourneyBonus ?? 0),
    fatigueRecovery:sum.fatigueRecovery + (node.effects.fatigueRecovery ?? 0),
    stressRecovery:sum.stressRecovery + (node.effects.stressRecovery ?? 0),
  }),{ monthlyJourneyBonus:0, trainingPercent:0, expeditionJourneyBonus:0, fatigueRecovery:0, stressRecovery:0 });
}

export function constellationRecommendation(progress:number,unlocked:ReadonlyArray<SanctuaryConstellationId>):SanctuaryConstellationId | null {
  return availableConstellationNodes(progress,unlocked)[0]?.id ?? null;
}
