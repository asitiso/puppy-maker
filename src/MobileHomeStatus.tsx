import {currentGuardianStatus,type GameState} from './game';
import MobileNavIcon from './MobileNavIcon';

type Props={state:GameState;notificationCount:number;onNotifications:()=>void};

export default function MobileHomeStatus({state,notificationCount,onNotifications}:Props){
  const stamina=Math.max(0,Math.min(100,100-state.stats.fatigue));
  const guardian=currentGuardianStatus(state);
  return <header className="v7-home-status" aria-label="현재 상태">
    <div className="v7-home-status-main">
      <strong>{state.lineage.generation}세대 · {state.year}년차 · {state.month}월 {state.week}주차</strong>
      <span className="v7-guardian-chip">수호 {guardian.points}</span>
    </div>
    <div className="v7-home-resources" aria-label="보유 자원">
      <span><b>G</b>{state.gold.toLocaleString()}</span>
      <span><b>◆</b>{state.gems.toLocaleString()}</span>
      <span><b>체력</b>{stamina}%</span>
    </div>
    {notificationCount>0&&<button type="button" className="v7-notification" onClick={onNotifications} aria-label={`새 소식 ${notificationCount}개`}>
      <MobileNavIcon name="bell"/><b>{notificationCount>9?'9+':notificationCount}</b>
    </button>}
  </header>;
}
