import {currentGuardianStatus,type GameState} from './game';
import MobileNavIcon from './MobileNavIcon';
import './mobile-v9.css';

type Props={state:GameState;notificationCount:number;onNotifications:()=>void};

export function compactResource(value:number):string{
  const safe=Number.isFinite(value)?Math.max(0,value):0;
  if(safe>=1_000_000)return `${(safe/1_000_000).toFixed(safe>=10_000_000?0:1)}M`;
  if(safe>=10_000)return `${(safe/1_000).toFixed(safe>=100_000?0:1)}K`;
  return Math.round(safe).toLocaleString();
}

export default function MobileHomeStatus({state,notificationCount,onNotifications}:Props){
  const stamina=Math.max(0,Math.min(100,100-state.stats.fatigue));
  const guardian=currentGuardianStatus(state);
  const safeGold=Number.isFinite(state.gold)?Math.max(0,state.gold):0;
  const safeGems=Number.isFinite(state.gems)?Math.max(0,state.gems):0;

  return <header className="v7-home-status v9-home-status" aria-label="현재 상태">
    <div className="v7-home-status-main v9-status-context">
      <strong>{state.lineage.generation}세대 · {state.year}년차 · {state.month}월 {state.week}주차</strong>
      <span className="v7-guardian-chip">수호 {guardian.points}</span>
    </div>
    <div className="v7-home-resources v9-status-resources" aria-label="보유 자원">
      <span aria-label={`골드 ${safeGold.toLocaleString()}`} title={`골드 ${safeGold.toLocaleString()}`}><b>G</b>{compactResource(safeGold)}</span>
      <span aria-label={`보석 ${safeGems.toLocaleString()}`} title={`보석 ${safeGems.toLocaleString()}`}><b>◆</b>{compactResource(safeGems)}</span>
      <span aria-label={`체력 ${stamina}%`}><b>체력</b>{stamina}%</span>
    </div>
    {notificationCount>0&&<button type="button" className="v7-notification v9-status-notification" onClick={onNotifications} aria-label={`새 소식 ${notificationCount}개`}>
      <MobileNavIcon name="bell"/><b>{notificationCount>9?'9+':notificationCount}</b>
    </button>}
  </header>;
}
