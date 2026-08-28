import { useEffect, useMemo, useRef, useState } from 'react';
import TacticalBattleScreen from './TacticalBattleScreen';
import V12BuildEditor from './V12BuildEditor';
import V12LoadoutPanel from './V12LoadoutPanel';
import type { BattleResult, BattleSession } from './tactical-battle';
import { COMPANIONS, type CompanionId } from './tactical-companions';
import type { TacticalEncounterId } from './tactical-encounters';
import { tacticalExpeditionFinishScore } from './tactical-expedition';
import { shouldRecoverOrphanedRunSnapshot } from './tactical-expedition-recovery';
import { expeditionStageDefinitions, nextExpeditionStage, type ExpeditionStageId } from './expedition-regions';
import type { ExpeditionActionCounts, GameState } from './game';
import { unlockedWardrobe } from './game/wardrobe';
import {
  createTacticalBattleFromGame,
  tacticalCompletionMetrics,
  tacticalEncounterForExpeditionStage,
  tacticalPartyForGame,
} from './tactical-launcher';
import { beginRunLoadout, type CharacterBuildState, type EquipmentSlot, type PlayableCharacterId } from './v12-character-builds';
import { requestV12Build } from './v12-build-ui-events';
import { hasHiddenExpeditionInteraction } from './v12-tactical-equipment-runtime';
import './tactical-expedition-flow.css';

export type TacticalPhase='setup'|'active'|'result';

type V12EditorKind='party'|'outfit'|EquipmentSlot;

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
  const [editor,setEditor] = useState<V12EditorKind|null>(null);
  const onPhaseChangeRef = useRef(onPhaseChange);
  const stageId = (nextExpeditionStage(state.expeditionRecords) ?? 'forest_path') as ExpeditionStageId;
  const stage = useMemo(()=>expeditionStageDefinitions.find(item=>item.id===stageId)!,[stageId]);
  const bondLevels = useMemo(()=>({
    bear:state.tacticalCompanionBonds.bear.level,
    owl:state.tacticalCompanionBonds.owl.level,
    wolf:state.tacticalCompanionBonds.wolf.level,
    cat:state.tacticalCompanionBonds.cat.level,
  }),[state.tacticalCompanionBonds]);
  const buildState = useMemo<CharacterBuildState>(()=>{
    const persisted=state.v12Builds.characterBuilds;
    const displayParty:[PlayableCharacterId,PlayableCharacterId,PlayableCharacterId]=['runa',party[0],party[1]];
    const leader=displayParty.includes(persisted.loadout.leader)?persisted.loadout.leader:'runa';
    return {
      ...persisted,
      loadout:{...persisted.loadout,party:displayParty,leader},
    };
  },[party,state.v12Builds.characterBuilds]);
  const unlockedOutfitIds = useMemo(()=>unlockedWardrobe(state),[state]);
  const hiddenInteraction=hasHiddenExpeditionInteraction(buildState.runLoadoutSnapshot ?? buildState.loadout);

  useEffect(()=>{
    onPhaseChangeRef.current=onPhaseChange;
  },[onPhaseChange]);

  useEffect(()=>{
    if(expeditionOpen&&!open)onPhaseChangeRef.current?.('setup');
  },[expeditionOpen,open]);

  useEffect(()=>{
    if(!shouldRecoverOrphanedRunSnapshot({
      expeditionOpen,
      hasSession:Boolean(session),
      hasRunSnapshot:Boolean(buildState.runLoadoutSnapshot),
    }))return;
    requestV12Build({type:'end-run'});
  },[expeditionOpen,session,buildState.runLoadoutSnapshot]);

  if (!expeditionOpen) return null;

  const chooseCompanion = (id:CompanionId) => {
    if (party.includes(id)) return;
    setParty(([,second])=>[second,id]);
  };

  const createSession = (seedOffset=0) => {
    const characterBuilds=beginRunLoadout(buildState);
    return createTacticalBattleFromGame({
      ...state,
      selectedTacticalCompanions:party,
      v12Builds:{...state.v12Builds,characterBuilds},
    },stageId,seedFor(state,stageId)+seedOffset);
  };

  const start = () => {
    if(buildState.runLoadoutSnapshot)return;
    requestV12Build({type:'party',party:buildState.loadout.party,leader:buildState.loadout.leader});
    requestV12Build({type:'begin-run'});
    onSetParty(party);
    setEditor(null);
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
    requestV12Build({type:'end-run'});
  };

  const retry = () => {
    requestV12Build({type:'begin-run'});
    setSession(createSession(1));
    onPhaseChange?.('active');
  };

  const exit = () => {
    requestV12Build({type:'end-run'});
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
      <div className="tactical-expedition-entry-scroll">
        <small>TACTICAL 3 VS 3</small>
        <strong>{stage.name} · 전술전</strong>
        <span>Leader + 파티 2명 · 의상 + 장비 3슬롯 · Bond 성장</span>
        {hiddenInteraction?<span role="status">탐험가의 나침반이 숨은 원정 상호작용을 감지했습니다.</span>:null}
        <V12LoadoutPanel
          state={buildState}
          onStartRun={start}
          showPrimaryAction={false}
          onEditParty={() => setEditor('party')}
          onEditOutfit={() => setEditor('outfit')}
          onEditEquipment={slot => setEditor(slot)}
        />
        {editor?<V12BuildEditor
          mode={editor}
          state={buildState}
          unlockedOutfitIds={unlockedOutfitIds}
          onLeaderChange={leader=>requestV12Build({type:'party',party:buildState.loadout.party,leader})}
          onOutfitChange={outfitId=>requestV12Build({type:'outfit',outfitId})}
          onEquipmentChange={equipmentId=>requestV12Build({type:'equipment',equipmentId})}
          onClose={()=>setEditor(null)}
        />:null}
        <div id="v12-tactical-party-picker" className="tactical-party-picker" aria-label="전술 동료 편성">
          {(Object.keys(COMPANIONS) as CompanionId[]).map(id=><button key={id} type="button" className={party.includes(id)?'selected':''} onClick={()=>chooseCompanion(id)}>{companionLabels[id]}<em>Bond Lv.{state.tacticalCompanionBonds[id].level}</em></button>)}
        </div>
      </div>
      <div className="tactical-setup-actions">
        <button type="button" className="tactical-start" onClick={start} disabled={Boolean(buildState.runLoadoutSnapshot)} aria-disabled={Boolean(buildState.runLoadoutSnapshot)}>
          {buildState.runLoadoutSnapshot?'런 진행 중':'이 편성으로 원정 시작'}
        </button>
      </div>
    </div>
  </aside>;
}