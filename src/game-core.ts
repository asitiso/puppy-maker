import {
  applyGiftEffects,
  applyOutingEffects,
  giftItemIds,
  outingDefinitions,
  outingLocationIds,
  startingInventory,
  type GiftItemId,
  type Inventory,
  type OutingLocationId,
} from './adventure';

export type Screen = 'hub' | 'schedule' | 'training' | 'dialogue' | 'result' | 'event' | 'ending';
export type ActivityId = 'hunt' | 'magic' | 'rest' | 'herb';
export type Condition = 'energetic' | 'normal' | 'focused' | 'tired';
export type ResultQuality = 'NORMAL' | 'GOOD' | 'GREAT' | 'PERFECT';
export type MemoryId =
  | 'first_training'
  | 'first_perfect'
  | 'first_hug'
  | 'first_snack'
  | 'first_s_grade'
  | 'first_month_complete'
  | 'first_skill'
  | 'close_bond'
  | 'first_outing'
  | 'forest_memory'
  | 'village_memory'
  | 'lakeside_memory'
  | 'first_gift';
export type DialogueChoice = 'hug' | 'scold' | 'snack';
export type SkillId = 'quick_strike' | 'mana_focus' | 'steady_breath' | 'trail_instinct';
export type RandomEventId = 'rare_herb' | 'new_move' | 'magic_flow' | 'second_wind' | 'quiet_focus' | 'fox_curiosity';
export type RelationshipRank = 'acquaintance' | 'familiar' | 'friend' | 'close_friend' | 'precious';
export type AchievementId =
  | 'first_steps'
  | 'skill_beginner'
  | 'memory_keeper'
  | 'close_bond'
  | 'mastery_specialist'
  | 'perfect_growth'
  | 'little_explorer'
  | 'thoughtful_giver';

export interface Stats {
  strength: number;
  intelligence: number;
  magic: number;
  morality: number;
  affection: number;
  stress: number;
  fatigue: number;
}

export interface Personality {
  courage: number;
  kindness: number;
  curiosity: number;
  calmness: number;
}

export interface MasteryEntry { xp: number; }
export type MasteryState = Record<ActivityId, MasteryEntry>;

export interface GrowthReport {
  grade: ReturnType<typeof trainingGrade>;
  quality: ResultQuality;
  topStat: { key: keyof Stats; delta: number } | null;
  masteryLevels: Record<ActivityId, number>;
  personalityDeltas: Partial<Personality>;
  newMemories: MemoryId[];
  randomEvent: RandomEventId | null;
  unlockedSkill: SkillId | null;
}

export interface GameState {
  screen: Screen;
  year: number;
  month: number;
  week: number;
  gold: number;
  gems: number;
  schedule: ActivityId[];
  stats: Stats;
  combo: number;
  trainingScore: number;
  lastChoice?: DialogueChoice;
  condition: Condition;
  mastery: MasteryState;
  personality: Personality;
  memories: MemoryId[];
  claimedAchievements: AchievementId[];
  inventory: Inventory;
  visitedOutings: OutingLocationId[];
  lastGrowthReport: GrowthReport | null;
}

export type AchievementDefinition = {
  id: AchievementId;
  title: string;
  description: string;
  reward: { gold?: number; gems?: number };
};

export const achievementDefinitions: AchievementDefinition[] = [
  { id: 'first_steps', title: '첫걸음', description: '첫 훈련을 완료하세요.', reward: { gold: 150 } },
  { id: 'skill_beginner', title: '새 기술의 시작', description: '기술을 1개 해금하세요.', reward: { gold: 200 } },
  { id: 'memory_keeper', title: '추억 수집가', description: '기억을 3개 모으세요.', reward: { gold: 250 } },
  { id: 'close_bond', title: '가까워진 마음', description: '루나와 가까운 친구가 되세요.', reward: { gems: 2 } },
  { id: 'mastery_specialist', title: '숙련의 길', description: '훈련 하나를 Lv.4까지 올리세요.', reward: { gold: 400 } },
  { id: 'perfect_growth', title: '완벽한 성장', description: '첫 PERFECT를 달성하세요.', reward: { gems: 3 } },
  { id: 'little_explorer', title: '작은 탐험가', description: '세 곳의 외출 장소를 모두 방문하세요.', reward: { gold: 300 } },
  { id: 'thoughtful_giver', title: '마음을 담은 선물', description: '루나에게 첫 선물을 건네세요.', reward: { gems: 2 } },
];

export const activities: Record<ActivityId, { name: string; icon: string; effect: Partial<Stats> }> = {
  hunt: { name: '사냥 훈련', icon: 'sword', effect: { strength: 6, fatigue: 9, stress: 4 } },
  magic: { name: '마법 수업', icon: 'spark', effect: { magic: 7, intelligence: 3, fatigue: 7 } },
  rest: { name: '포근한 휴식', icon: 'moon', effect: { stress: -16, fatigue: -20, affection: 2 } },
  herb: { name: '약초 채집', icon: 'leaf', effect: { intelligence: 2, fatigue: 5 } },
};

export const initialState: GameState = {
  screen: 'hub', year: 1, month: 4, week: 1, gold: 5000, gems: 220,
  schedule: ['hunt','magic','rest','herb'],
  stats: { strength: 30, intelligence: 30, magic: 30, morality: 40, affection: 45, stress: 12, fatigue: 18 },
  combo: 0, trainingScore: 0, condition: 'normal',
  mastery: { hunt:{xp:0}, magic:{xp:0}, rest:{xp:0}, herb:{xp:0} },
  personality: { courage:45, kindness:50, curiosity:48, calmness:45 },
  memories: [], claimedAchievements: [], inventory: startingInventory(), visitedOutings: [], lastGrowthReport: null,
};

export function clampStat(value:number){return Math.max(0,Math.min(100,value));}
export function trainingGrade(score:number){return score>=900?'S':score>=700?'A':score>=450?'B':'C';}
export function masteryLevel(xp:number){return xp>=20?5:xp>=12?4:xp>=7?3:xp>=3?2:1;}
export function relationshipRank(affection:number):RelationshipRank{return affection>=85?'precious':affection>=70?'close_friend':affection>=55?'friend':affection>=40?'familiar':'acquaintance';}
export function collectionProgress(state:GameState){return{memories:state.memories.length,skills:state.lastGrowthReport?.unlockedSkill?1:0};}
export function eligibleAchievements(state:GameState){return achievementDefinitions.filter(item=>!state.claimedAchievements.includes(item.id)&&(
 item.id==='first_steps'?state.memories.includes('first_training'):
 item.id==='skill_beginner'?Boolean(state.lastGrowthReport?.unlockedSkill):
 item.id==='memory_keeper'?state.memories.length>=3:
 item.id==='close_bond'?state.stats.affection>=70:
 item.id==='mastery_specialist'?Object.values(state.mastery).some(entry=>masteryLevel(entry.xp)>=4):
 item.id==='perfect_growth'?state.lastGrowthReport?.quality==='PERFECT':
 item.id==='little_explorer'?state.visitedOutings.length>=outingLocationIds.length:
 state.inventory.star_cookie<startingInventory().star_cookie
 ));}
export function applyActivity(state:GameState,id:ActivityId){const effect=activities[id].effect,stats={...state.stats};for(const[key,value]of Object.entries(effect))stats[key as keyof Stats]=clampStat(stats[key as keyof Stats]+(value??0));return{...state,stats};}
export function applyOuting(state:GameState,location:OutingLocationId){const effect=applyOutingEffects({stats:state.stats,personality:state.personality,gold:state.gold},location);return{...state,...effect,visitedOutings:state.visitedOutings.includes(location)?state.visitedOutings:[...state.visitedOutings,location]};}
export function applyGift(state:GameState,item:GiftItemId){if(state.inventory[item]<=0)return state;const effect=applyGiftEffects({stats:state.stats,personality:state.personality},item);return{...state,...effect,inventory:{...state.inventory,[item]:state.inventory[item]-1}};}
