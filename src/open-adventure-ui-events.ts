import type {OpenAdventureUpdate} from './adventure3d/open-adventure-state';

export const openAdventureUpdateRequestEvent='puppy-maker:open-adventure-update';

export function requestOpenAdventureUpdate(update:OpenAdventureUpdate):void{
  if(typeof window==='undefined')return;
  window.dispatchEvent(new CustomEvent<OpenAdventureUpdate>(openAdventureUpdateRequestEvent,{detail:update}));
}
