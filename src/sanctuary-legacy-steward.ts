export type LegacyStewardInput={claimableRewards:number;unclearedGuardians:number;affordableBoon:boolean;grandGap:number;ascensionGap:number;callingGap:number;riftGap:number};
export type LegacyStewardTarget='claim'|'convergence'|'boon'|'sanctuary'|'ascension'|'calling'|'rift';
export type LegacyRecommendation={target:LegacyStewardTarget;label:string;reason:string;progress:string};
export function sanctuaryLegacyRecommendation(i:LegacyStewardInput):LegacyRecommendation|null{
 if(i.claimableRewards>0)return{target:'claim',label:'Legacy 보상 받기',reason:'이미 달성한 보상을 한 번에 받을 수 있어요.',progress:`${i.claimableRewards}개`};
 if(i.unclearedGuardians>0)return{target:'convergence',label:'Convergence 도전',reason:'새 수호자 기록이 Legacy 성장 효율이 가장 높아요.',progress:`남은 수호자 ${i.unclearedGuardians}`};
 if(i.affordableBoon)return{target:'boon',label:'Guardian Boon 해금',reason:'현재 자원으로 즉시 영구 성장을 얻을 수 있어요.',progress:'구매 가능'};
 if(i.grandGap>=0&&i.grandGap<=5)return{target:'sanctuary',label:'Sanctuary 성장',reason:'다음 Grand 구간이 가까워요.',progress:`${i.grandGap} 남음`};
 if(i.ascensionGap>=0&&i.ascensionGap<=5)return{target:'ascension',label:'Ascension 성장',reason:'다음 Ascension 구간이 가까워요.',progress:`${i.ascensionGap} 남음`};
 if(i.callingGap>=0&&i.callingGap<=i.riftGap)return{target:'calling',label:'Calling 숙련',reason:'현재 가장 짧은 장기 성장 경로예요.',progress:`${i.callingGap} 남음`};
 if(i.riftGap>=0)return{target:'rift',label:'Astral Rift 탐험',reason:'Rift 폭을 넓히면 Legacy가 성장해요.',progress:`${i.riftGap} 남음`};
 return null;
}
