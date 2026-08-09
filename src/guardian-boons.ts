export type GuardianBoonId =
  | 'dawn_oath'
  | 'moon_oath'
  | 'storm_oath'
  | 'star_oath'
  | 'celestial_chain'
  | 'guardian_halo'
  | 'convergence_crown'
  | 'eternal_covenant';

export type GuardianBoon = {
  id:GuardianBoonId;
  label:string;
  cost:number;
  prerequisite:GuardianBoonId|null;
  reward:{ gold:number; gems:number };
};

export const guardianBoons:GuardianBoon[] = [
  { id:'dawn_oath', label:'새벽의 맹세', cost:5, prerequisite:null, reward:{ gold:200, gems:0 } },
  { id:'moon_oath', label:'월광의 맹세', cost:8, prerequisite:'dawn_oath', reward:{ gold:300, gems:0 } },
  { id:'storm_oath', label:'폭풍의 맹세', cost:12, prerequisite:'moon_oath', reward:{ gold:0, gems:1 } },
  { id:'star_oath', label:'별빛의 맹세', cost:16, prerequisite:'storm_oath', reward:{ gold:400, gems:0 } },
  { id:'celestial_chain', label:'천체의 연쇄', cost:22, prerequisite:'star_oath', reward:{ gold:500, gems:1 } },
  { id:'guardian_halo', label:'수호자의 광륜', cost:30, prerequisite:'celestial_chain', reward:{ gold:0, gems:2 } },
  { id:'convergence_crown', label:'합일의 왕관', cost:40, prerequisite:'guardian_halo', reward:{ gold:800, gems:2 } },
  { id:'eternal_covenant', label:'영원의 서약', cost:55, prerequisite:'convergence_crown', reward:{ gold:1200, gems:4 } },
];

const validIds = guardianBoons.map(item => item.id);

export function sanitizeGuardianBoons(raw:unknown):GuardianBoonId[] {
  if (!Array.isArray(raw)) return [];
  return guardianBoons.map(item => item.id).filter(id => raw.includes(id));
}

export function resolveGuardianBoonPurchase(input:{
  boonId:GuardianBoonId;
  sigils:number;
  purchased:GuardianBoonId[];
}) {
  const purchased = [...new Set(input.purchased)].filter(id => validIds.includes(id));
  const sigils = Number.isFinite(input.sigils) ? Math.max(0,Math.floor(input.sigils)) : 0;
  const boon = guardianBoons.find(item => item.id === input.boonId);
  if (!boon || purchased.includes(boon.id) || (boon.prerequisite && !purchased.includes(boon.prerequisite)) || sigils < boon.cost) {
    return { accepted:false as const, sigils, purchased, reward:{ gold:0, gems:0 } };
  }
  return {
    accepted:true as const,
    sigils:sigils - boon.cost,
    purchased:[...purchased,boon.id],
    reward:boon.reward,
  };
}
