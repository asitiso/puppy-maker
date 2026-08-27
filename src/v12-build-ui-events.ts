import type { EquipmentId, PlayableCharacterId } from './v12-character-builds'

export const v12BuildRequestEvent='puppy:v12-build-request'

export type V12BuildRequest =
  | {type:'party';party:[PlayableCharacterId,PlayableCharacterId,PlayableCharacterId];leader:PlayableCharacterId}
  | {type:'outfit';outfitId:string}
  | {type:'equipment';equipmentId:EquipmentId}
  | {type:'begin-run'}
  | {type:'end-run'}

export function requestV12Build(action:V12BuildRequest){
  window.dispatchEvent(new CustomEvent<V12BuildRequest>(v12BuildRequestEvent,{detail:action}))
}
