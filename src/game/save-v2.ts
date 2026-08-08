import { hydrateGameState, type GameState } from '../game';
export const SAVE_VERSION=2;
export interface SaveEnvelopeV2{version:2;savedAt:string;state:GameState}
export function serializeSave(state:GameState):string{return JSON.stringify({version:SAVE_VERSION,savedAt:new Date().toISOString(),state} satisfies SaveEnvelopeV2)}
export function deserializeSave(raw:string|null):GameState{if(!raw)return hydrateGameState(null);try{const parsed=JSON.parse(raw) as Partial<SaveEnvelopeV2>;if(parsed.version===2&&parsed.state)return hydrateGameState(JSON.stringify(parsed.state));return hydrateGameState(raw)}catch{return hydrateGameState(raw)}}
