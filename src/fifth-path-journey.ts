import type {MajorOutcomeResult} from './campaign-model';
import type {V3PersistentState} from './v3-persistent-state';

export type FifthPathJourneyAction=
  | 'resolve_summer'
  | 'rewrite_the_pattern'
  | 'resolve_long_night'
  | 'commit_true_ending';

export type FifthPathJourneyResult=
  | {advanced:true;state:V3PersistentState}
  | {advanced:false;state:V3PersistentState;reason:'not_ready'};

function appendUnique<T>(items:readonly T[],item:T):T[]{
  return items.includes(item)?[...items]:[...items,item];
}

function winterOutcome(state:V3PersistentState):MajorOutcomeResult{
  return state.campaignRun.majorOutcomes.long_night??'victory';
}

export function advanceFifthPathJourney(
  state:V3PersistentState,
  action:FifthPathJourneyAction,
):FifthPathJourneyResult{
  const run=state.campaignRun;
  if(run.activeCampaign!=='true_path'||run.activeRoute!=='normal'){
    return {advanced:false,state,reason:'not_ready'};
  }

  if(action==='resolve_summer'){
    if(run.phase!=='summer'||run.seasonMilestones.includes('summer_resolved'))return {advanced:false,state,reason:'not_ready'};
    return {advanced:true,state:{...state,campaignRun:{...run,phase:'autumn',seasonMilestones:appendUnique(run.seasonMilestones,'summer_resolved')}}};
  }

  if(action==='rewrite_the_pattern'){
    if(run.phase!=='autumn'||run.seasonMilestones.includes('autumn_resolved'))return {advanced:false,state,reason:'not_ready'};
    return {advanced:true,state:{...state,campaignRun:{...run,phase:'winter',seasonMilestones:appendUnique(run.seasonMilestones,'autumn_resolved')}}};
  }

  if(action==='resolve_long_night'){
    if(run.phase!=='winter'||run.seasonMilestones.includes('winter_resolved'))return {advanced:false,state,reason:'not_ready'};
    const outcome=winterOutcome(state);
    return {advanced:true,state:{...state,campaignRun:{...run,phase:'ending',seasonMilestones:appendUnique(run.seasonMilestones,'winter_resolved'),majorOutcomes:{...run.majorOutcomes,long_night:outcome}}}};
  }

  if(run.phase!=='ending'||!run.seasonMilestones.includes('winter_resolved')||run.seasonMilestones.includes('ending_committed')){
    return {advanced:false,state,reason:'not_ready'};
  }
  return {advanced:true,state:{...state,campaignRun:{...run,seasonMilestones:appendUnique(run.seasonMilestones,'ending_committed')}}};
}

export function fifthPathJourneyActionForChoice(choice:string):FifthPathJourneyAction|null{
  const normalized=choice.trim();
  if(normalized==='원인을 더 깊이 추적한다'||normalized==='다음 계절로 나아간다')return 'resolve_summer';
  if(normalized==='정답을 반복하지 않고 새로운 합의를 만든다')return 'rewrite_the_pattern';
  if(normalized==='긴 밤을 끝낸다'||normalized==='새벽으로 나아간다')return 'resolve_long_night';
  if(normalized==='이 선택을 기억한다'||normalized==='새로운 봄을 맞는다')return 'commit_true_ending';
  return null;
}
