import type { BattleResult, TacticalUnit } from './tactical-battle';

export type TacticalEncounterId = 'training_ground'|'starlight_patrol'|'rift_vanguard';
export type TacticalBattleGrade = 'S'|'A'|'B'|'C';
export type TacticalBattleRecord = { grade:TacticalBattleGrade; bestRounds:number; clearCount:number };
export type TacticalEncounterDefinition = {
  id:TacticalEncounterId;
  label:string;
  recommendedPower:number;
  enemies:TacticalUnit[];
};

const enemy = (id:string,hp:number,agility:number,position:'front'|'back'='front',shield=0):TacticalUnit => ({
  id,side:'enemy',position,maxHp:hp,hp,agility,ap:3,maxAp:3,mp:0,maxMp:10,shield,
});

export const tacticalEncounterDefinitions:TacticalEncounterDefinition[] = [
  {
    id:'training_ground',label:'수호자 모의전',recommendedPower:90,
    enemies:[enemy('training_wolf',82,9),enemy('training_golem',120,5,'front',10),enemy('training_bat',70,13,'back')],
  },
  {
    id:'starlight_patrol',label:'별빛 순찰전',recommendedPower:150,
    enemies:[enemy('starlight_hound',112,12),enemy('starlight_guardian',155,7,'front',18),enemy('starlight_hexer',92,14,'back')],
  },
  {
    id:'rift_vanguard',label:'균열 선봉전',recommendedPower:230,
    enemies:[enemy('rift_reaver',150,14),enemy('rift_bulwark',210,8,'front',28),enemy('rift_oracle',125,16,'back',8)],
  },
];

const gradeOrder:Record<TacticalBattleGrade,number> = { C:0,B:1,A:2,S:3 };

export function gradeTacticalBattle(input:{ result:BattleResult; rounds:number; survivingAllies:number; damageTaken:number }):TacticalBattleGrade {
  if (input.result !== 'victory') return 'C';
  const rounds = Math.max(1,Math.floor(input.rounds));
  const survivors = Math.max(0,Math.min(3,Math.floor(input.survivingAllies)));
  const damage = Math.max(0,Math.floor(input.damageTaken));
  if (survivors === 3 && rounds <= 3 && damage <= 80) return 'S';
  if (survivors >= 2 && rounds <= 5 && damage <= 160) return 'A';
  return 'B';
}

export function tacticalEncounterReward(id:TacticalEncounterId,grade:TacticalBattleGrade,firstClear:boolean) {
  const encounterIndex = tacticalEncounterDefinitions.findIndex(item => item.id === id);
  const gradeBonus = { C:0,B:20,A:50,S:90 }[grade];
  const baseGold = 70 + Math.max(0,encounterIndex) * 50 + gradeBonus;
  return {
    gold:firstClear ? baseGold + 120 : Math.max(30,Math.floor(baseGold * .45)),
    gems:firstClear && grade !== 'C' ? 1 + (grade === 'S' && id === 'rift_vanguard' ? 1 : 0) : 0,
  };
}

export function updateTacticalRecord(previous:TacticalBattleRecord|undefined,next:{ grade:TacticalBattleGrade; rounds:number }):TacticalBattleRecord {
  const rounds = Math.max(1,Math.floor(next.rounds));
  if (!previous) return { grade:next.grade,bestRounds:rounds,clearCount:1 };
  return {
    grade:gradeOrder[next.grade] > gradeOrder[previous.grade] ? next.grade : previous.grade,
    bestRounds:Math.min(previous.bestRounds,rounds),
    clearCount:previous.clearCount + 1,
  };
}
