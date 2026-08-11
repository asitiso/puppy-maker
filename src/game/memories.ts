import type { GameState, MemoryId } from '../game';
export const MEMORY_CATALOG:Record<string,{title:string;description:string}>={
 first_training:{title:'첫 훈련',description:'루나와 처음 훈련한 날'},
 first_perfect:{title:'완벽한 순간',description:'처음 PERFECT를 만든 날'},
 first_hug:{title:'따뜻한 포옹',description:'루나를 처음 안아준 날'},
 first_snack:{title:'별빛 간식',description:'루나와 간식을 나눈 날'},
 first_s_grade:{title:'첫 S등급',description:'처음 최고의 평가를 받은 날'},
 first_month_complete:{title:'첫 달의 성장',description:'함께 첫 달을 마친 날'},
 first_month:{title:'첫 달의 성장',description:'함께 첫 달을 마친 날'},
 close_bond:{title:'깊어진 유대',description:'루나와 특별히 가까워진 날'},
 hunt_master:{title:'사냥 숙련',description:'사냥 훈련에서 큰 성장을 이룬 날'}
};
type LegacyMemory={id:string;year?:number;month?:number};
const memoryId=(memory:unknown):string=>typeof memory==='string'?memory:typeof memory==='object'&&memory!==null&&'id'in memory?String((memory as LegacyMemory).id):'';
export const hasMemory=(state:GameState,id:MemoryId)=>state.memories.some(memory=>memoryId(memory)===String(id));
export function unlockMemory(state:GameState,id:MemoryId):GameState{if(hasMemory(state,id))return state;return{...state,memories:[...state.memories,id]} as GameState;}
