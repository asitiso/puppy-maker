import { hydrateGameState, type GameState } from '../game';
export const CURRENT_SAVE_VERSION=3;
export interface SaveEnvelope{version:number;savedAt:string;state:GameState}
export function serializeGameState(state:GameState):string{return JSON.stringify({version:CURRENT_SAVE_VERSION,savedAt:new Date().toISOString(),state} satisfies SaveEnvelope)}
export function hydrateSave(raw:string|null):GameState{if(!raw)return hydrateGameState(null);try{const parsed=JSON.parse(raw) as Partial<SaveEnvelope>;if(typeof parsed.version==='number'&&parsed.state&&typeof parsed.state==='object')return hydrateGameState(JSON.stringify(parsed.state));return hydrateGameState(raw)}catch{return hydrateGameState(raw)}}
