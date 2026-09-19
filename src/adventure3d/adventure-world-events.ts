import type {AdventureWorldState} from './adventure-world-state';

export const adventureWorldUpdateRequestEvent='puppy-maker:v18-adventure-world-update';

export function requestAdventureWorldUpdate(state:AdventureWorldState){
  if(typeof window==='undefined')return;
  window.dispatchEvent(new CustomEvent<AdventureWorldState>(adventureWorldUpdateRequestEvent,{detail:state}));
}
