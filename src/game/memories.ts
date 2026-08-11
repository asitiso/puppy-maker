import type { GameState, MemoryId } from '../game';
export const MEMORY_CATALOG:Record<MemoryId,{title:string;description:string}>={first_training:{title:'첫 훈련',description:'루나와 처음 훈련한 날'},first_perfect:{title:'완벽한 순간',description:'처음 PERFECT를 만든 날'},first_hug:{title:'따뜻한 포옹',description:'루나를 처음 안아준 날'},first_snack:{title:'별빛 간식',description:'루나와 간식을 나눈 날'},first_s_grade:{title:'첫 S등급',description:'처음 최고의 평가를 받은 날'},first_month_complete:{title:'첫 달의 성장',description:'함께 첫 달을 마친 날'}};
export const hasMemory=(state:GameState,id:MemoryId)=>state.memories.some(memory=>memory.id===id);
export function unlockMemory(state:GameState,id:MemoryId):GameState{return hasMemory(state,id)?state:{...state,memories:[...state.memories,{id,year:state.year,month:state.month}]};}
