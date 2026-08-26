import type {GameState} from './game';
import {achievementDefinitions,eligibleAchievements} from './game';
import {attendanceKey} from './attendance';
import {availableMail} from './mail-rewards';
import type {MobileContentCategory,MobileFeatureId} from './mobile-router';

export type MobileCategoryRecommendation={
  feature:MobileFeatureId;
  label:string;
  description:string;
  reason:string;
};

const fallback:Record<MobileContentCategory,MobileCategoryRecommendation>={
  life:{feature:'schedule',label:'이번 주 스케줄',description:'이번 주 훈련과 하루 일정을 먼저 정해요.',reason:'이번 주 행동을 정하면 다른 생활 목표도 자연스럽게 따라옵니다.'},
  growth:{feature:'raising',label:'성장 방향 확인',description:'Calling과 Trait, 현재 성장 방향을 확인해요.',reason:'지금의 성장 방향을 확인하면 다음 선택이 쉬워집니다.'},
  adventure:{feature:'expedition',label:'수호자 원정',description:'현재 전력으로 원정과 Tactical 전투에 도전해요.',reason:'모험에서 가장 직접적인 진행 경로입니다.'},
  bond:{feature:'bond',label:'루나와 교감',description:'루나와의 관계와 다음 교감 기회를 확인해요.',reason:'인연의 현재 상태를 가장 빠르게 확인할 수 있습니다.'},
  records:{feature:'archive',label:'성장 도감',description:'성장·원정·유산 기록을 한곳에서 확인해요.',reason:'현재까지의 수집과 장기 진행을 가장 빠르게 파악할 수 있습니다.'},
};

export function mobileCategoryRecommendation(category:MobileContentCategory,state:GameState):MobileCategoryRecommendation{
  if(category==='life'){
    const currentAttendance=attendanceKey(state.year,state.month);
    if(!state.claimedAttendanceMonths.includes(currentAttendance))return {feature:'attendance',label:'출석 보상 받기',description:'이번 달 받을 수 있는 출석 보상을 확인해요.',reason:'아직 수령하지 않은 보상이 있습니다.'};
    if(availableMail(state.year,state.month).some(mail=>!state.claimedMailRewards.includes(mail.id)))return {feature:'mail',label:'우편 보상 확인',description:'도착한 편지와 보상을 확인해요.',reason:'아직 확인하지 않은 우편 보상이 있습니다.'};
  }
  if(category==='growth'){
    const claimable=eligibleAchievements(state).find(id=>!state.claimedAchievements.includes(id));
    if(claimable){
      const definition=achievementDefinitions.find(item=>item.id===claimable);
      return {feature:'achievements',label:'성장 업적 수령',description:definition?`${definition.title} 보상을 받을 수 있어요.`:'달성한 성장 업적 보상을 확인해요.',reason:'바로 수령할 수 있는 성장 보상이 있습니다.'};
    }
  }
  if(category==='adventure'&&state.generationalWorld.activeProject){
    return {feature:'world',label:'세계 프로젝트 이어가기',description:'진행 중인 세계 프로젝트와 지역 변화를 확인해요.',reason:'이미 진행 중인 장기 목표가 있습니다.'};
  }
  if(category==='bond'){
    const giftCount=Object.values(state.inventory).reduce((sum,count)=>sum+Math.max(0,count),0);
    if(giftCount>0)return {feature:'gifts',label:'선물 전하기',description:'보유한 선물로 루나에게 마음을 전해요.',reason:'지금 바로 사용할 수 있는 선물이 있습니다.'};
  }
  return fallback[category];
}

export function mobileCategoryPriorityFeatures(category:MobileContentCategory,state:GameState):MobileFeatureId[]{
  const recommendation=mobileCategoryRecommendation(category,state).feature;
  const extras:MobileFeatureId[]=[];
  if(category==='life'){
    const currentAttendance=attendanceKey(state.year,state.month);
    if(!state.claimedAttendanceMonths.includes(currentAttendance))extras.push('attendance');
    if(availableMail(state.year,state.month).some(mail=>!state.claimedMailRewards.includes(mail.id)))extras.push('mail');
    extras.push('schedule');
  }else if(category==='growth'){
    if(eligibleAchievements(state).some(id=>!state.claimedAchievements.includes(id)))extras.push('achievements');
    extras.push('raising','ambition');
  }else if(category==='adventure'){
    if(state.generationalWorld.activeProject)extras.push('world');
    extras.push('expedition','outing');
  }else if(category==='bond'){
    if(Object.values(state.inventory).some(count=>count>0))extras.push('gifts');
    extras.push('bond','stories');
  }else{
    extras.push('archive','lineage','world_chronicle');
  }
  return [recommendation,...extras.filter(feature=>feature!==recommendation)].slice(0,3);
}
