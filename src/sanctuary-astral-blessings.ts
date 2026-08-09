export type AstralBlessingId = 'scholar_glow'|'wayfarer_wind'|'guardian_aegis'|'crown_grace';

export type AstralBlessingDefinition = {
  id:AstralBlessingId;
  label:string;
  description:string;
  cost:number;
  requiredTrial:'scholar_trial'|'wayfarer_trial'|'guardian_trial'|'crown_trial';
};

export const astralBlessings:AstralBlessingDefinition[] = [
  { id:'scholar_glow', label:'학자의 잔광', description:'훈련 성장량을 조금 더 끌어올려요.', cost:3, requiredTrial:'scholar_trial' },
  { id:'wayfarer_wind', label:'방랑자의 순풍', description:'원정의 Season Journey 진행을 강화해요.', cost:3, requiredTrial:'wayfarer_trial' },
  { id:'guardian_aegis', label:'수호자의 가호', description:'월말 피로와 스트레스 회복을 강화해요.', cost:5, requiredTrial:'guardian_trial' },
  { id:'crown_grace', label:'천관의 은총', description:'월말 회복과 Season Journey를 함께 강화해요.', cost:8, requiredTrial:'crown_trial' },
];

const byId = new Map(astralBlessings.map(item => [item.id,item]));

export function resolveAstralBlessingPurchase(input:{
  blessing:AstralBlessingId;
  shards:number;
  purchased:AstralBlessingId[];
  trialKeys:string[];
}) {
  const definition = byId.get(input.blessing);
  if (!definition) return { accepted:false as const, reason:'invalid' as const, shards:input.shards };
  if (input.purchased.includes(input.blessing)) return { accepted:false as const, reason:'purchased' as const, shards:input.shards };
  if (!input.trialKeys.some(key => key.endsWith(`:${definition.requiredTrial}`))) return { accepted:false as const, reason:'trial' as const, shards:input.shards };
  const shards = Number.isFinite(input.shards) ? Math.max(0,Math.floor(input.shards)) : 0;
  if (shards < definition.cost) return { accepted:false as const, reason:'shards' as const, shards };
  return { accepted:true as const, reason:null, definition, shards:shards - definition.cost };
}

export function astralBlessingEffects(purchased:ReadonlyArray<AstralBlessingId>) {
  const ids = new Set(purchased);
  return {
    trainingPercent:ids.has('scholar_glow') ? 2 : 0,
    expeditionJourneyBonus:ids.has('wayfarer_wind') ? 1 : 0,
    monthlyRecovery:(ids.has('guardian_aegis') ? 1 : 0) + (ids.has('crown_grace') ? 1 : 0),
    monthlyJourneyBonus:ids.has('crown_grace') ? 3 : 0,
  };
}
