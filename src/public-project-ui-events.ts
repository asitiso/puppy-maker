import type {PublicProjectId} from './generational-world';

export const publicProjectRequestEvent='puppy-maker:start-public-project';

export function requestPublicProjectStart(projectId:PublicProjectId):void{
  if(typeof window==='undefined')return;
  window.dispatchEvent(new CustomEvent<PublicProjectId>(publicProjectRequestEvent,{detail:projectId}));
}
