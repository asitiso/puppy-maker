import type {GameState} from './game';
import type {CampaignId,CampaignPhase} from './campaign-model';

export type RunGuidanceMode='first_run'|'active_run'|'returning_run'|'ready_for_new_run';
export type RunGuidanceRouteTone='normal'|'true'|'hollow';

export type RunGuidanceView={
  mode:RunGuidanceMode;
  eyebrow:string;
  title:string;
  body:string;
  nextAction:string;
  campaignLabel:string;
  seasonLabel:string;
  routeTone:RunGuidanceRouteTone;
  recentResult?:string;
};

const campaignLabels:Record<CampaignId,string>={
  caretaker:'Caretaker',
  pathfinder:'Pathfinder',
  vanguard:'Vanguard',
  arcanist:'Arcanist',
  true_path:'True Path',
};

const phaseLabels:Record<CampaignPhase,string>={
  spring_exploration:'봄',
  path_selection:'봄',
  summer:'여름',
  autumn:'가을',
  winter:'겨울',
  ending:'종장',
};

function humanize(value:string|null|undefined):string|null{
  if(!value)return null;
  return value
    .split('_')
    .filter(Boolean)
    .map(part=>part.charAt(0).toUpperCase()+part.slice(1))
    .join(' ');
}

function recentResult(state:GameState):string|undefined{
  const summary=state.legacy.runSummaries[state.legacy.runSummaries.length-1];
  if(!summary)return undefined;
  const pieces=[
    `${summary.runNumber}회차 ${campaignLabels[summary.campaign]}`,
    humanize(summary.ending),
    humanize(summary.career),
  ].filter((value):value is string=>Boolean(value));
  return pieces.join(' · ');
}

function routeTone(state:GameState):RunGuidanceRouteTone{
  if(state.campaignRun.activeRoute==='hollow')return 'hollow';
  if(state.campaignRun.activeCampaign==='true_path')return 'true';
  return 'normal';
}

export function getRunGuidance(state:GameState):RunGuidanceView{
  const campaign=state.campaignRun.activeCampaign;
  const campaignLabel=campaign?campaignLabels[campaign]:'아직 선택 전';
  const seasonLabel=phaseLabels[state.campaignRun.phase];
  const tone=routeTone(state);
  const recent=recentResult(state);
  const completedRuns=state.legacy.completedRuns;

  if(state.campaignRun.phase==='ending'){
    return {
      mode:'ready_for_new_run',
      eyebrow:'RUN COMPLETE',
      title:`${campaignLabel}의 기록이 완성됐어요`,
      body:recent?`이번 여정은 기록되었습니다. ${recent}`:'이번 여정은 기록되었습니다. 다음 삶에서 새로운 선택을 이어갈 수 있어요.',
      nextAction:'새로운 가능성으로 다음 회차 시작',
      campaignLabel,
      seasonLabel,
      routeTone:tone,
      ...(recent?{recentResult:recent}:{}),
    };
  }

  if(!campaign&&state.campaignRun.phase==='spring_exploration'&&completedRuns>0){
    return {
      mode:'returning_run',
      eyebrow:`NEW POSSIBILITY · ${state.campaignRun.runNumber}회차`,
      title:'다시 시작된 봄, 달라진 가능성',
      body:recent?`지난 기록은 남아 있지만 이번 선택은 새로 시작됩니다. 새로운 가능성을 확인해 보세요. ${recent}`:'지난 삶의 흔적은 남아 있지만 이번 선택은 새로 시작됩니다. 새로운 가능성을 확인해 보세요.',
      nextAction:'봄의 일상에서 새로운 길 찾기',
      campaignLabel,
      seasonLabel,
      routeTone:tone,
      ...(recent?{recentResult:recent}:{}),
    };
  }

  if(!campaign&&state.campaignRun.phase==='spring_exploration'){
    return {
      mode:'first_run',
      eyebrow:'FIRST SPRING',
      title:'첫 번째 봄이 시작됐어요',
      body:'훈련과 외출, 관계의 선택을 쌓아가면 봄 끝에 여러 길이 자연스럽게 열립니다.',
      nextAction:'오늘의 일정부터 시작하기',
      campaignLabel,
      seasonLabel,
      routeTone:'normal',
    };
  }

  const toneCopy=tone==='hollow'
    ? '위험한 선택의 결과가 세계와 관계에 남고 있습니다.'
    : tone==='true'
      ? '여러 삶에서 이어진 단서가 하나의 길로 연결되고 있습니다.'
      : '이번 캠페인의 목표와 관계를 따라 계절을 진행하세요.';

  const nextAction=state.campaignRun.phase==='path_selection'
    ? '열린 길 중 이번 캠페인 선택하기'
    : state.campaignRun.phase==='winter'
      ? '겨울의 결말을 향해 진행하기'
      : `${seasonLabel}의 다음 목표 진행하기`;

  return {
    mode:'active_run',
    eyebrow:`${seasonLabel} · ${state.campaignRun.runNumber}회차`,
    title:`${campaignLabel} 여정 진행 중`,
    body:toneCopy,
    nextAction,
    campaignLabel,
    seasonLabel,
    routeTone:tone,
    ...(recent?{recentResult:recent}:{}),
  };
}
