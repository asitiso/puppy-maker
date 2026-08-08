import type { SeasonCompletionHonorId } from './season-completion-honors';
import type { SeasonJourneyHistoryEntry } from './live-ops-state';

export type SeasonLegacyNodeId =
  | 'chronicle_seed'|'chronicle_keeper'|'chronicle_crown'
  | 'bond_seed'|'bond_keeper'|'bond_crown'
  | 'expedition_seed'|'expedition_keeper'|'expedition_crown';

export type SeasonLegacyNode = {
  id:SeasonLegacyNodeId;
  branch:'chronicle'|'bond'|'expedition';
  tier:1|2|3;
  label:string;
  description:string;
  cost:number;
  prerequisite:SeasonLegacyNodeId|null;
  reward:{ gold:number; gems:number };
};

export const seasonLegacyNodes:SeasonLegacyNode[] = [
  { id:'chronicle_seed', branch:'chronicle', tier:1, label:'기록의 씨앗', description:'계절 기록의 첫 장을 영구 유산으로 남겨요.', cost:1, prerequisite:null, reward:{ gold:150, gems:0 } },
  { id:'chronicle_keeper', branch:'chronicle', tier:2, label:'기록의 보관자', description:'쌓인 계절의 기록이 하나의 연대기가 돼요.', cost:2, prerequisite:'chronicle_seed', reward:{ gold:0, gems:1 } },
  { id:'chronicle_crown', branch:'chronicle', tier:3, label:'연대기의 왕관', description:'오랜 계절 기록을 완성한 수호자의 증표예요.', cost:3, prerequisite:'chronicle_keeper', reward:{ gold:500, gems:1 } },
  { id:'bond_seed', branch:'bond', tier:1, label:'온기의 씨앗', description:'루나와 함께한 계절의 온기를 기억해요.', cost:1, prerequisite:null, reward:{ gold:120, gems:0 } },
  { id:'bond_keeper', branch:'bond', tier:2, label:'온기의 보관자', description:'함께한 시간이 오래 남는 유대의 기록이 돼요.', cost:2, prerequisite:'bond_seed', reward:{ gold:250, gems:0 } },
  { id:'bond_crown', branch:'bond', tier:3, label:'유대의 왕관', description:'수많은 계절을 함께한 특별한 관계의 증표예요.', cost:3, prerequisite:'bond_keeper', reward:{ gold:0, gems:2 } },
  { id:'expedition_seed', branch:'expedition', tier:1, label:'원정의 씨앗', description:'계절마다 걸어온 원정의 흔적을 새겨요.', cost:1, prerequisite:null, reward:{ gold:100, gems:0 } },
  { id:'expedition_keeper', branch:'expedition', tier:2, label:'원정의 보관자', description:'여러 계절의 모험이 하나의 길로 이어져요.', cost:2, prerequisite:'expedition_seed', reward:{ gold:300, gems:0 } },
  { id:'expedition_crown', branch:'expedition', tier:3, label:'별길의 왕관', description:'끝없는 원정을 이어온 계절 수호자의 증표예요.', cost:3, prerequisite:'expedition_keeper', reward:{ gold:300, gems:1 } },
];

export function seasonLegacyPoints(history:SeasonJourneyHistoryEntry[], honors:SeasonCompletionHonorId[]):number {
  const completed = history.filter(entry => entry.tiersCompleted >= 10).length;
  return completed + new Set(honors).size;
}

export function seasonLegacyBoard(unlocked:SeasonLegacyNodeId[]) {
  const set = new Set(unlocked);
  return seasonLegacyNodes.map(node => ({
    ...node,
    unlocked:set.has(node.id),
    available:!set.has(node.id) && (!node.prerequisite || set.has(node.prerequisite)),
  }));
}

export function resolveSeasonLegacyUnlock(input:{
  nodeId:SeasonLegacyNodeId;
  history:SeasonJourneyHistoryEntry[];
  honors:SeasonCompletionHonorId[];
  unlocked:SeasonLegacyNodeId[];
}) {
  const node = seasonLegacyNodes.find(item => item.id === input.nodeId);
  const uniqueUnlocked = [...new Set(input.unlocked)].filter(id => seasonLegacyNodes.some(node => node.id === id));
  const earned = seasonLegacyPoints(input.history,input.honors);
  const spent = uniqueUnlocked.reduce((sum,id) => sum + (seasonLegacyNodes.find(node => node.id === id)?.cost ?? 0),0);
  const remaining = Math.max(0,earned - spent);
  if (!node || uniqueUnlocked.includes(node.id) || (node.prerequisite && !uniqueUnlocked.includes(node.prerequisite)) || remaining < node.cost) {
    return { accepted:false as const, unlocked:uniqueUnlocked, remainingPoints:remaining, reward:{ gold:0, gems:0 } };
  }
  return {
    accepted:true as const,
    unlocked:[...uniqueUnlocked,node.id],
    remainingPoints:remaining - node.cost,
    reward:node.reward,
  };
}
