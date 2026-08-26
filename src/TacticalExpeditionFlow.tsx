import { useEffect, useMemo, useState } from 'react';
import TacticalBattleScreen from './TacticalBattleScreen';
import type { BattleResult, BattleSession } from './tactical-battle';
import { COMPANIONS, type CompanionId } from './tactical-companions';
import type { TacticalEncounterId } from './tactical-encounters';
import { tacticalExpeditionFinishScore } from './tactical-expedition';
import { expeditionStageDefinitions, nextExpeditionStage, type ExpeditionStageId } from './expedition-regions';
import type { ExpeditionActionCounts, GameState } from './game';
import {
  createTacticalBattleFromGame,
  tacticalCompletionMetrics,
  tacticalEncounterForExpeditionStage,
  tacticalPartyForGame,
} from './tactical-launcher';
import './tactical-expedition-flow.css';

export type TacticalPhase='setup'|'active'|'result';

export type TacticalExpeditionFlowProps = {
  state:GameState;
  expeditionOpen:boolean;
  onSetParty:(companions:[CompanionId,CompanionId])=>void;
  onSetPreferences:(auto:boolean,speed:1|2)=>void;
  onComplete:(encounterId:TacticalEncounterId,result:BattleResult,rounds:number,survivingAllies:number,damageTaken:number,companions:[CompanionId,CompanionId])=>void;
  onExpeditionFinish:(stageId:ExpeditionStageId,score:number,fatigueDelta:number,stressDelta:number,actionKinds:ExpeditionActionCounts)=>void;
  onExitToHome:()=>void;
  onPhaseChange?:(phase:TacticalPhase)=>void;
};

const companionLabels:Record<CompanionId,string> = { bear:'곰 · 탱커',owl:'올빼미 · 지원',wolf:'늑대 · 딜러',cat:'고양이 · 교란' };

function seedFor(state:GameState,stageId:ExpeditionStageId) {
  let hash = state.year*10000 + state.month*100 + state.week;
  for (const char of stageId) hash = (hash*31 + char.charCodeAt(0)) >>> 0;
  return hash;
}

export function closeTacticalFlow(clearSession:()=>void,closeBattle:()=>void,onExitToHome:()=>void) {
  clearSession();
  closeBattle();
  onExitToHome();
}

export default function TacticalExpeditionFlow({state,expeditionOpen,onSetParty,onSetPreferences,onComplete,onExpeditionFinish,onExitToHome,onPhaseChange}:TacticalExpeditionFlowProps) {
  const [open,setOpen] = useState(false);
  const [session,setSession] = useState<BattleSession|null>(null);
  const [party,setParty] = useState<[CompanionId,CompanionId]>(()=>tacticalPartyForGame(state));
  const [auto,setAuto] = useState(state.tacticalAutoBattle);
  const [speed,setSpeed] = useState<1|2>(state.tacticalBattleSpeed);
  const stageId = (nextExpeditionStage(state.expeditionRecords) ?? 'forest_path') as ExpeditionStageId;
  const stage = useMemo(()=>expeditionStageDefinitions.find(item=>item.id===stageId)!,[stageId]);
  const bondLevels = useMemo(()=>({
    bear:state.tacticalCompanionBonds.bear.level,
    owl:state.tacticalCompanionBonds.owl.level,
    wolf:state.tacticalCompanionBonds.wolf.level,
    cat:state.tacticalCompanionBonds.cat.level,
  }),[state.tacticalCompanionBonds]);

  useEffect(()=>{
    if(expeditionOpen&&!open)onPhaseChange?.('setup');
  },[expeditionOpen,open,onPhaseChange]);

  if (!expeditionOpen) return null;

  const chooseCompanion = (id:CompanionId) => {
    if (party.includes(id)) return;
    setParty(([first,second])=>[second,id]);
  };

  const createSession = (seedOffset=0) => createTacticalBattleFromGame({...state,selectedTacticalCompanions:party},stageId,seedFor(state,stageId)+seedOffset);

  const start = () => {
    onSetParty(party);
    setSession(createSession());
    setOpen(true);
    onPhaseChange?.('active');
  };

  const toggleAuto = () => {
    const next = !auto;
    setAuto(next);
    onSetPreferences(next,speed);
  };
  const toggleSpeed = () => {
    const next:1|2 = speed===1?2:1;
    setSpeed(next);
    onSetPreferences(auto,next);
  };

  const complete = (result:BattleResult,finalSession:BattleSession) => {
    const metrics = tacticalCompletionMetrics(finalSession);
    onPhaseChange?.('result');
    onComplete(tacticalEncounterForExpeditionStage(stageId),result,metrics.rounds,metrics.survivingAllies,metrics.damageTaken,party);
    const actionKinds:ExpeditionActionCounts = { attack:metrics.rounds,dodge:0,charge:0 };
    const expeditionScore = tacticalExpeditionFinishScore(stage.target,result);
    onExpeditionFinish(stageId,expeditionScore,result==='victory'?2:6,result==='victory'?1:5,actionKinds);
  };

  const retry = () => {
    setSession(createSession(1));
    onPhaseChange?.('active');
  };

  const exit = () => {
    onPhaseChange?.('setup');
    closeTacticalFlow(()=>setSession(null),()=>setOpen(false),onExitToHome);
  };

  if (open && session) {
    return <div className="tactical-expedition-layer">
      <TacticalBattleScreen
        session={session}
        auto={auto}
        speed={speed}
        party={party}
        bondLevels={bondLevels}
        onToggleAuto={toggleAuto}
        onToggleSpeed={toggleSpeed}
        onComplete={complete}
        onRetry={retry}
        onExit={exit}
      />
    </div>;
  }

  return <aside className="tactical-expedition-entry" aria-label="3대3 전술전">
    <img src="/ui/info_card_frame.png" alt="" draggable={false}/>
    <div className="tactical-expedition-entry-content">
      <small>TACTICAL 3 VS 3</small>
      <strong>{stage.name} · 전술전</strong>
      <span>루나 + 동료 2명 · Bond 성장</span>
      <div className="tactical-party-picker">
        {(Object.keys(COMPANIONS) as CompanionId[]).map(id=><button key={id} className={party.includes(id)?'selected':''} onClick={()=>chooseCompanion(id)}>{companionLabels[id]}<em>Bond Lv.{state.tacticalCompanionBonds[id].level}</em></button>)}
      </div>
      <button className="tactical-start" onClick={start}>3v3 전투 시작</button>
    </div>
  </aside>;
}