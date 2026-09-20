import {useCallback,useEffect,useRef,useState,type PointerEvent} from 'react';
import type {GameState} from '../game';
import {requestOpenAdventureUpdate} from '../open-adventure-ui-events';
import MobileJoystick from '../exploration/MobileJoystick';
import {DEFAULT_ADVENTURE_CAMERA,followAdventureCamera,rotateAdventureCamera,zoomAdventureCamera} from './camera-controller';
import {
  DEFAULT_PLAYER_COMBAT,
  applyDodgeMotion,
  playerAttackConnects,
  playerAttackDamage,
  playerAttackIsCounter,
  playerAttackWindowOpen,
  resolveEnemyAttack,
  stepPlayerCombat,
  tryStartPlayerAttack,
  tryStartPlayerDodge,
  type PlayerCombatState,
} from './combat-system';
import {alertNearbyEnemies,applyEnemyDamage,stepEnemyAi,type AdventureEnemyState} from './enemy-ai';
import {canClaimRuinReward,castRuinAbility,claimRuinReward,createRuinPuzzleState,playerNearRuinPuzzle,playerNearRuinStone,pushRuinStone,stepRuinPuzzle,type EnvironmentAbilityId} from './environment-system';
import {applyBurningHazardsToEnemies,applyBurningHazardsToPlayer,burningHazardAvoidanceZones,castFieldEnvironmentAbility,playerNearFieldHazard,stepFieldHazards} from './environment-combat';
import {cameraRelativeMove,DEFAULT_PLAYER_STATE,stepPlayerMotion} from './player-controller';
import {isStartingCampEnemy} from './starting-encounter';
import {createDawnreachFieldEnemies,mergeDawnreachWindHunters} from './wind-hunters';
import {advanceTempestWardenPhase,isTempestWarden,mergeTempestWarden,tempestWardenPhase} from './tempest-warden';
import {createStartingCampHazards} from './starting-hazards';
import {nearestStartingFieldDiscovery,STARTING_FIELD,startingFieldHeight} from './starting-field';
import {STARTING_RUIN_PUZZLE} from './starting-ruin-puzzle';
import {cycleLockOnTarget,lockedTargetStillValid,selectLockOnTarget,smoothLockOnYaw,targetCandidates,yawToTarget} from './targeting-system';
import {isDawnreachDiscoveryId} from './open-adventure-state';
import {
  ROADSIDE_AMBUSH,
  createRoadsideAmbushEnemies,
  playerNearRoadsideAmbush,
  playerNearWorldConsequence,
  roadsideAmbushConsequence,
  roadsideAmbushDefeated,
  roadsideAmbushVisual,
  roadsideConsequenceMessage,
  shouldWitnessRoadsideAmbush,
  type WorldEventPhase,
} from './world-events';
import {
  WANDERING_CARAVAN,
  createWanderingCaravanState,
  playerNearWanderingCaravan,
  shouldWitnessWanderingCaravan,
  stepWanderingCaravan,
  wanderingCaravanMessage,
  wanderingCaravanVisual,
} from './roaming-world';
import {
  DAWNREACH_HERD,
  WILDLIFE_DISCOVERY_TRAIL,
  createDawnreachHerdState,
  dawnreachHerdVisual,
  dawnreachWildlifeTrailVisual,
  playerNearDawnreachHerd,
  shouldRevealWildlifeDiscoveryTrail,
  shouldWitnessDawnreachHerd,
  stepDawnreachHerd,
  type WildlifeBehavior,
} from './wildlife';
import {
  HOLLOW_CAVE,
  castHollowCaveWindPulse,
  constrainHollowCavePlayer,
  countActiveHollowCaveResonators,
  createHollowCaveRuntimeState,
  enterHollowCave,
  hollowCaveInsideEntryPosition,
  hollowCaveInsideShortcutSpawn,
  hollowCaveReturnFromEntrance,
  hollowCaveReturnFromShortcut,
  hollowCaveVisual,
  leaveHollowCave,
  playerNearHollowCaveEntrance,
  playerNearHollowCaveExit,
  playerNearHollowCaveOutsideShortcut,
  playerNearHollowCaveShortcut,
  stepHollowCaveRuntime,
} from './hollow-cave';
import {
  SKYBREAK_HIGHLAND,
  applySkybreakGust,
  castSkybreakWindPulse,
  constrainSkybreakPlayer,
  createSkybreakEnemies,
  createSkybreakHighlandState,
  enterSkybreakHighland,
  leaveSkybreakHighland,
  playerNearSkybreakBeacon,
  playerNearSkybreakBridge,
  playerNearSkybreakEntrance,
  playerNearSkybreakOutsideLift,
  playerNearSkybreakWindLift,
  reachSkybreakBeacon,
  skybreakEntryPosition,
  skybreakGustActive,
  skybreakHighlandHeight,
  skybreakHighlandVisual,
  skybreakReturnToBridge,
  skybreakReturnToSkywatch,
  skybreakWindLiftEntry,
  stepSkybreakHighland,
} from './skybreak-highland';
import {applyWindwalkGlide,windwalkMastered,windwalkUnlocked} from './windwalk';
import {
  applyWindwalkCurrent,
  findWindwalkTrace,
  windwalkRouteVisual,
  windwalkTraceIds,
  type WindwalkTraceId,
} from './windwalk-routes';
import {
  CLOUD_GARDEN,
  cloudGardenEnemiesDefeated,
  cloudGardenEntranceVisual,
  cloudGardenEntryPosition,
  cloudGardenHeight,
  cloudGardenOutsideReturnPosition,
  cloudGardenVisual,
  constrainCloudGardenPlayer,
  createCloudGardenEnemies,
  createCloudGardenState,
  enterCloudGarden,
  leaveCloudGarden,
  playerNearCloudGardenExit,
  playerNearCloudGardenHeart,
  playerNearCloudGardenOutsideEntrance,
  restoreCloudGarden,
} from './cloud-garden';
import {renderAdventureField} from './software-renderer';
import type {AdventureCameraState,PlayerMotionState} from './types';
import '../exploration/exploration.css';
import './adventure-vertical-slice.css';

type Props={state:GameState;onExit:()=>void};

const movementKeys=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
const engagedModes=new Set(['suspicious','chase','windup','recover','stagger']);

export default function AdventureVerticalSlice({state,onExit}:Props){
  const persisted=state.openAdventure.dawnreach;
  const restoredRuin={
    ...createRuinPuzzleState(STARTING_RUIN_PUZZLE),
    ...(persisted.ruin.stonePosition?{
      stonePosition:{
        x:persisted.ruin.stonePosition.x,
        y:startingFieldHeight(persisted.ruin.stonePosition.x,persisted.ruin.stonePosition.z),
        z:persisted.ruin.stonePosition.z,
      },
    }:{}),
    brazierLit:persisted.ruin.brazierLit,
    solved:persisted.ruin.solved,
    rewardClaimed:persisted.ruin.rewardClaimed,
  };
  const canvasRef=useRef<HTMLCanvasElement|null>(null);
  const playerRef=useRef<PlayerMotionState>({...DEFAULT_PLAYER_STATE,position:{...STARTING_FIELD.spawn}});
  const combatRef=useRef<PlayerCombatState>({...DEFAULT_PLAYER_COMBAT});
  const enemiesRef=useRef<AdventureEnemyState[]>(createDawnreachFieldEnemies(
    persisted.campCleared,
    persisted.skybreak.beaconReached,
    persisted.cloudGarden.restored,
    persisted.tempestWarden.defeated,
  ));
  const fieldEnemiesSnapshotRef=useRef<AdventureEnemyState[]|null>(null);
  const cameraRef=useRef<AdventureCameraState>({...DEFAULT_ADVENTURE_CAMERA,target:{x:STARTING_FIELD.spawn.x,y:2,z:STARTING_FIELD.spawn.z}});
  const pressedRef=useRef(new Set<string>());
  const stickRef=useRef({x:0,y:0});
  const jumpRef=useRef(false);
  const glideHeldRef=useRef(false);
  const windwalkActiveRef=useRef(false);
  const attackRef=useRef(false);
  const dodgeRef=useRef(false);
  const sprintTouchRef=useRef(false);
  const nearbyRef=useRef<ReturnType<typeof nearestStartingFieldDiscovery>>(null);
  const dragRef=useRef<{pointerId:number;x:number;y:number}|null>(null);
  const visitedRef=useRef(new Set<string>(persisted.discoveredIds));
  const campClearedRef=useRef(persisted.campCleared);
  const ruinPuzzleRef=useRef(restoredRuin);
  const ruinSolvedNotifiedRef=useRef(persisted.ruin.solved);
  const echoSenseRef=useRef(persisted.echoSenseUnlocked);
  const hazardsRef=useRef(createStartingCampHazards());
  const hazardPulseSerialRef=useRef(10000);
  const lockedTargetRef=useRef<string|null>(null);
  const roadsideResolution=persisted.worldEvents.find(event=>event.id===ROADSIDE_AMBUSH.id);
  const roadsideAmbushResolvedRef=useRef(Boolean(roadsideResolution));
  const roadsideOutcomeRef=useRef(roadsideResolution?.outcome);
  const roadsideAmbushPhaseRef=useRef<WorldEventPhase>('hidden');
  const caravanResolution=persisted.worldEvents.find(event=>event.id===WANDERING_CARAVAN.id);
  const caravanMetRef=useRef(Boolean(caravanResolution));
  const caravanWitnessedRef=useRef(Boolean(caravanResolution));
  const caravanRef=useRef(createWanderingCaravanState());
  const herdRef=useRef(createDawnreachHerdState());
  const herdWitnessedRef=useRef(false);
  const hollowCaveRef=useRef(createHollowCaveRuntimeState(persisted.hollowCave.shortcutOpen));
  const skybreakRef=useRef(createSkybreakHighlandState(persisted.skybreak.beaconReached));
  const windwalkUnlockedRef=useRef(windwalkUnlocked(persisted.skybreak.beaconReached));
  const windwalkTracesRef=useRef(new Set<WindwalkTraceId>(persisted.skybreak.windwalkTraces));
  const windwalkMasteredRef=useRef(windwalkMastered(persisted.skybreak.windwalkTraces.length));
  const boostedWindCurrentRef=useRef<string|null>(null);
  const cloudGardenRef=useRef(createCloudGardenState(persisted.cloudGarden.restored));
  const cloudGardenClearNotifiedRef=useRef(persisted.cloudGarden.restored);
  const tempestWardenDefeatedRef=useRef(persisted.tempestWarden.defeated);
  const tempestPhaseTwoNotifiedRef=useRef(false);
  const tempestDefeatNotifiedRef=useRef(persisted.tempestWarden.defeated);
  const skybreakGustPushedRef=useRef(false);
  const wildlifeTrailClockRef=useRef(0);
  const wildlifeTrailHintedRef=useRef(false);
  const [stamina,setStamina]=useState(100);
  const [hp,setHp]=useState(DEFAULT_PLAYER_COMBAT.hp);
  const [nearby,setNearby]=useState<ReturnType<typeof nearestStartingFieldDiscovery>>(null);
  const [visitedCount,setVisitedCount]=useState(persisted.discoveredIds.length);
  const [notice,setNotice]=useState(
    persisted.skybreak.beaconReached
      ?'바람걸음이 몸에 남아 있습니다. 전망대에서 활강하며 들판 위 상승기류와 공중 흔적을 이어 보세요.'
      :'멀리 보이는 세 곳 중 마음이 가는 방향으로 움직여 보세요.',
  );
  const [sprinting,setSprinting]=useState(false);
  const [combatEngaged,setCombatEngaged]=useState(false);
  const [livingEnemies,setLivingEnemies]=useState(enemiesRef.current.length);
  const [nearPuzzle,setNearPuzzle]=useState(false);
  const [nearStone,setNearStone]=useState(false);
  const [rewardReady,setRewardReady]=useState(false);
  const [puzzleSolved,setPuzzleSolved]=useState(persisted.ruin.solved);
  const [echoSenseUnlocked,setEchoSenseUnlocked]=useState(persisted.echoSenseUnlocked);
  const [nearHazard,setNearHazard]=useState(false);
  const [burningHazards,setBurningHazards]=useState(0);
  const [lockedTargetId,setLockedTargetId]=useState<string|null>(null);
  const [lockCandidateCount,setLockCandidateCount]=useState(0);
  const [worldEventPhase,setWorldEventPhase]=useState<WorldEventPhase>('hidden');
  const [nearWorldEvent,setNearWorldEvent]=useState(false);
  const [nearWorldConsequence,setNearWorldConsequence]=useState(false);
  const [nearCaravan,setNearCaravan]=useState(false);
  const [caravanFamiliar,setCaravanFamiliar]=useState(Boolean(caravanResolution));
  const [nearWildlife,setNearWildlife]=useState(false);
  const [wildlifeBehavior,setWildlifeBehavior]=useState<WildlifeBehavior>('grazing');
  const [wildlifeTrailActive,setWildlifeTrailActive]=useState(false);
  const [insideHollowCave,setInsideHollowCave]=useState(false);
  const [hollowResonators,setHollowResonators]=useState(
    countActiveHollowCaveResonators(hollowCaveRef.current),
  );
  const [hollowShortcutOpen,setHollowShortcutOpen]=useState(persisted.hollowCave.shortcutOpen);
  const [nearHollowExit,setNearHollowExit]=useState(false);
  const [nearHollowShortcut,setNearHollowShortcut]=useState(false);
  const [nearHollowEntrance,setNearHollowEntrance]=useState(false);
  const [nearHollowOutsideShortcut,setNearHollowOutsideShortcut]=useState(false);
  const [insideSkybreak,setInsideSkybreak]=useState(false);
  const [skybreakBeaconReached,setSkybreakBeaconReached]=useState(persisted.skybreak.beaconReached);
  const [skybreakGust,setSkybreakGust]=useState(false);
  const [skybreakCalm,setSkybreakCalm]=useState(false);
  const [nearSkybreakBridge,setNearSkybreakBridge]=useState(false);
  const [nearSkybreakEntrance,setNearSkybreakEntrance]=useState(false);
  const [nearSkybreakBeacon,setNearSkybreakBeacon]=useState(false);
  const [nearSkybreakWindLift,setNearSkybreakWindLift]=useState(false);
  const [nearSkybreakOutsideLift,setNearSkybreakOutsideLift]=useState(false);
  const [windwalkUnlockedState,setWindwalkUnlockedState]=useState(
    windwalkUnlocked(persisted.skybreak.beaconReached),
  );
  const [windwalkActive,setWindwalkActive]=useState(false);
  const [windwalkTraceCount,setWindwalkTraceCount]=useState(persisted.skybreak.windwalkTraces.length);
  const [windwalkMasteredState,setWindwalkMasteredState]=useState(
    windwalkMastered(persisted.skybreak.windwalkTraces.length),
  );
  const [insideCloudGarden,setInsideCloudGarden]=useState(false);
  const [cloudGardenRestored,setCloudGardenRestored]=useState(persisted.cloudGarden.restored);
  const [nearCloudGardenEntrance,setNearCloudGardenEntrance]=useState(false);
  const [nearCloudGardenExit,setNearCloudGardenExit]=useState(false);
  const [nearCloudGardenHeart,setNearCloudGardenHeart]=useState(false);
  const [cloudGardenClear,setCloudGardenClear]=useState(persisted.cloudGarden.restored);
  const [counterReady,setCounterReady]=useState(false);
  const [tempestWardenPhaseState,setTempestWardenPhaseState]=useState<1|2|null>(
    tempestWardenPhase(enemiesRef.current.find(isTempestWarden)),
  );
  const [tempestWardenDefeated,setTempestWardenDefeated]=useState(persisted.tempestWarden.defeated);

  const snapPlayerTo=useCallback((position:PlayerMotionState['position'])=>{
    playerRef.current={
      ...playerRef.current,
      position,
      velocity:{x:0,y:0,z:0},
    };
    cameraRef.current={
      ...cameraRef.current,
      target:{x:position.x,y:position.y+1.8,z:position.z},
    };
  },[]);

  const enterSkybreakAt=useCallback((position:PlayerMotionState['position'],message:string)=>{
    fieldEnemiesSnapshotRef.current=enemiesRef.current;
    enemiesRef.current=createSkybreakEnemies(skybreakRef.current.beaconReached);
    skybreakRef.current=enterSkybreakHighland(skybreakRef.current);
    lockedTargetRef.current=null;
    setLockedTargetId(null);
    setInsideSkybreak(true);
    setLivingEnemies(enemiesRef.current.length);
    snapPlayerTo(position);
    setNotice(message);
  },[snapPlayerTo]);

  const leaveSkybreakTo=useCallback((position:PlayerMotionState['position'],message:string)=>{
    skybreakRef.current=leaveSkybreakHighland(skybreakRef.current);
    enemiesRef.current=fieldEnemiesSnapshotRef.current??createDawnreachFieldEnemies(campClearedRef.current,windwalkUnlockedRef.current);
    fieldEnemiesSnapshotRef.current=null;
    lockedTargetRef.current=null;
    setLockedTargetId(null);
    setInsideSkybreak(false);
    setCombatEngaged(false);
    setLivingEnemies(enemiesRef.current.filter(enemy=>enemy.hp>0).length);
    snapPlayerTo(position);
    setNotice(message);
  },[snapPlayerTo]);

  const enterCloudGardenAt=useCallback((message:string)=>{
    fieldEnemiesSnapshotRef.current=enemiesRef.current;
    enemiesRef.current=createCloudGardenEnemies(cloudGardenRef.current.restored);
    cloudGardenRef.current=enterCloudGarden(cloudGardenRef.current);
    cloudGardenClearNotifiedRef.current=cloudGardenRef.current.restored;
    lockedTargetRef.current=null;
    setLockedTargetId(null);
    setInsideCloudGarden(true);
    setCloudGardenClear(cloudGardenRef.current.restored||cloudGardenEnemiesDefeated(enemiesRef.current));
    setLivingEnemies(enemiesRef.current.length);
    snapPlayerTo(cloudGardenEntryPosition());
    setNotice(message);
  },[snapPlayerTo]);

  const leaveCloudGardenToField=useCallback((message:string)=>{
    cloudGardenRef.current=leaveCloudGarden(cloudGardenRef.current);
    enemiesRef.current=fieldEnemiesSnapshotRef.current??createDawnreachFieldEnemies(campClearedRef.current,windwalkUnlockedRef.current);
    fieldEnemiesSnapshotRef.current=null;
    lockedTargetRef.current=null;
    setLockedTargetId(null);
    setInsideCloudGarden(false);
    setCombatEngaged(false);
    setLivingEnemies(enemiesRef.current.filter(enemy=>enemy.hp>0).length);
    snapPlayerTo(cloudGardenOutsideReturnPosition());
    setNotice(message);
  },[snapPlayerTo]);

  const applyLockTarget=useCallback((enemy:AdventureEnemyState|null)=>{
    const id=enemy?.id??null;
    lockedTargetRef.current=id;
    setLockedTargetId(id);
    if(enemy)setNotice(`락온 · ${enemy.label}`);
  },[]);

  const toggleLockOn=useCallback(()=>{
    if(lockedTargetRef.current){
      lockedTargetRef.current=null;
      setLockedTargetId(null);
      setNotice('락온을 해제했습니다. 자유 시점으로 돌아갑니다.');
      return;
    }
    const target=selectLockOnTarget(
      enemiesRef.current,
      playerRef.current.position,
      cameraRef.current.yaw,
    );
    applyLockTarget(target);
    if(!target)setNotice('락온할 적이 시야 안에 없습니다.');
  },[applyLockTarget]);

  const cycleLockOn=useCallback(()=>{
    const target=cycleLockOnTarget(
      enemiesRef.current,
      playerRef.current.position,
      cameraRef.current.yaw,
      lockedTargetRef.current,
    );
    applyLockTarget(target);
    if(!target)setNotice('전환할 적이 없습니다.');
  },[applyLockTarget]);

  const discover=useCallback(()=>{
    const target=nearbyRef.current;
    if(!target||visitedRef.current.has(target.id))return;
    visitedRef.current=new Set(visitedRef.current).add(target.id);
    setVisitedCount(visitedRef.current.size);
    if(isDawnreachDiscoveryId(target.id))requestOpenAdventureUpdate({type:'discover',id:target.id});
    setNotice(target.kind==='vista'
      ?'높은 곳에서 시야가 열렸습니다. 아래를 둘러보고 다음 목적지를 직접 정하세요.'
      :`${target.label} 발견 · ${target.hint}`);
  },[]);

  const interveneRoadsideAmbush=useCallback(()=>{
    if(
      roadsideAmbushResolvedRef.current||
      roadsideAmbushPhaseRef.current!=='witnessed'||
      !playerNearRoadsideAmbush(playerRef.current.position)||
      combatRef.current.hp<=0
    )return;
    const existingIds=new Set(enemiesRef.current.map(enemy=>enemy.id));
    const reinforcements=createRoadsideAmbushEnemies().filter(enemy=>!existingIds.has(enemy.id));
    enemiesRef.current=[...enemiesRef.current,...reinforcements];
    roadsideAmbushPhaseRef.current='intervening';
    setWorldEventPhase('intervening');
    setNotice('길목 습격에 개입했습니다. 여행자를 노리는 적 둘을 막아내세요.');
  },[]);

  const passRoadsideAmbush=useCallback(()=>{
    if(roadsideAmbushResolvedRef.current||roadsideAmbushPhaseRef.current!=='witnessed')return;
    roadsideAmbushResolvedRef.current=true;
    roadsideOutcomeRef.current='passed';
    roadsideAmbushPhaseRef.current='resolved';
    setWorldEventPhase('resolved');
    setNearWorldEvent(false);
    requestOpenAdventureUpdate({type:'resolve-world-event',id:ROADSIDE_AMBUSH.id,outcome:'passed'});
    setNotice('습격 현장을 지나쳤습니다. 사건은 플레이어의 개입 없이 흘러갑니다.');
  },[]);

  const castEnvironmentAbility=useCallback((ability:EnvironmentAbilityId)=>{
    if(combatRef.current.hp<=0)return;

    if(skybreakRef.current.inside){
      if(ability!=='windPulse'){
        setNotice('높은 능선에는 불붙일 재료가 거의 없습니다. 돌풍은 바람밀기로 잠시 상쇄할 수 있습니다.');
        return;
      }
      const result=castSkybreakWindPulse(skybreakRef.current);
      skybreakRef.current=result.state;
      setSkybreakCalm(result.state.calmClock>0);
      setNotice('바람밀기가 맞바람을 흩뜨렸습니다. 잠시 중앙 돌풍길이 잦아듭니다.');
      return;
    }

    if(hollowCaveRef.current.inside){
      if(ability!=='windPulse'){
        setNotice('동굴의 바람 공명석은 불씨보다 공기의 진동에 반응하는 것 같습니다.');
        return;
      }
      const caveResult=castHollowCaveWindPulse(
        hollowCaveRef.current,
        playerRef.current.position,
        playerRef.current.facingYaw,
      );
      hollowCaveRef.current=caveResult.state;
      setHollowResonators(caveResult.activatedCount);
      if(caveResult.openedShortcut){
        requestOpenAdventureUpdate({type:'open-hollow-shortcut'});
        setHollowShortcutOpen(true);
        setNotice('세 바람 공명석이 한꺼번에 울리며 막혀 있던 바위문이 열렸습니다. 끊어진 돌다리 쪽으로 이어지는 지름길입니다.');
      }else if(caveResult.affected){
        setNotice(`바람 공명석이 깨어났습니다. 동굴 안 공명 ${caveResult.activatedCount}/3`);
      }else{
        setNotice('바람밀기가 공명석에 닿지 않았습니다. 가까이 가서 돌기둥을 바라보고 다시 사용해 보세요.');
      }
      return;
    }

    const ruinResult=castRuinAbility(
      ruinPuzzleRef.current,
      STARTING_RUIN_PUZZLE,
      ability,
      playerRef.current.position,
      playerRef.current.facingYaw,
      startingFieldHeight,
    );
    ruinPuzzleRef.current=ruinResult.state;
    if(ruinResult.affected)requestOpenAdventureUpdate({
      type:'sync-ruin',
      stonePosition:{x:ruinResult.state.stonePosition.x,z:ruinResult.state.stonePosition.z},
      brazierLit:ruinResult.state.brazierLit,
      solved:ruinResult.state.solved,
      rewardClaimed:ruinResult.state.rewardClaimed,
    });

    const fieldResult=castFieldEnvironmentAbility(
      hazardsRef.current,
      ability,
      playerRef.current.position,
      playerRef.current.facingYaw,
    );
    hazardsRef.current=fieldResult.hazards;

    if(fieldResult.affected){
      setNotice(ability==='emberSpark'
        ?'마른 풀이 불붙었습니다. 적을 불길 쪽으로 유도하거나 바람으로 화재를 퍼뜨릴 수 있습니다.'
        :fieldResult.spread
          ?'바람이 불길을 다음 마른 풀 지대로 퍼뜨렸습니다.'
          :'바람이 불길을 거세게 만들었지만 확산될 풀이 바람 방향에 없습니다.');
      return;
    }

    if(ruinResult.affected){
      setNotice(ability==='windPulse'
        ?'바람밀기가 공명석을 밀어냈습니다. 위치를 바꿔 다른 공명판을 시험해 보세요.'
        :'불씨점화가 오래된 화로를 깨웠습니다. 열의 공명이 서쪽 장치로 이어집니다.');
      return;
    }

    if(
      playerNearRuinPuzzle(STARTING_RUIN_PUZZLE,playerRef.current.position,18)||
      playerNearFieldHazard(hazardsRef.current,playerRef.current.position,14)
    )setNotice('능력이 닿지 않았습니다. 반응할 환경 쪽을 바라보고 조금 더 가까이 가 보세요.');
  },[]);

  const interactWorld=useCallback(()=>{
    if(cloudGardenRef.current.inside){
      if(playerNearCloudGardenExit(playerRef.current.position,cloudGardenRef.current)){
        leaveCloudGardenToField(
          cloudGardenRef.current.restored
            ?'복원된 구름정원을 나와 서쪽 능선으로 돌아왔습니다. 들판의 상승기류가 전보다 넓고 강하게 흐릅니다.'
            :'구름틈을 빠져나와 서쪽 능선으로 돌아왔습니다. 정원의 수호자들은 다시 들어오면 자리를 지킵니다.',
        );
        return;
      }
      if(playerNearCloudGardenHeart(playerRef.current.position,cloudGardenRef.current)){
        const cleared=cloudGardenEnemiesDefeated(enemiesRef.current);
        if(!cleared){
          setNotice('정원 심장은 폭풍 수호자들의 기류에 묶여 있습니다. 먼저 주변의 세 수호자를 물리쳐야 합니다.');
          return;
        }
        cloudGardenRef.current=restoreCloudGarden(cloudGardenRef.current);
        enemiesRef.current=[];
        requestOpenAdventureUpdate({type:'restore-cloud-garden'});
        cloudGardenClearNotifiedRef.current=true;
        setCloudGardenRestored(true);
        setCloudGardenClear(true);
        setLivingEnemies(0);
        setCombatEngaged(false);
        setNotice('구름정원 심장이 다시 뛰기 시작했습니다. 새벽들판의 오래된 상승기류가 깨어나 반경·상승력·높이가 영구적으로 강화됐습니다.');
        return;
      }
      setNotice(cloudGardenRef.current.restored
        ?'바람꽃이 정원 전체를 감돌고 있습니다. 입구로 돌아가면 강화된 상승기류를 새벽들판에서 직접 확인할 수 있습니다.'
        :cloudGardenEnemiesDefeated(enemiesRef.current)
          ?'폭풍 수호자들이 사라졌습니다. 정원 북쪽의 흐린 심장에 가까이 가서 E로 바람을 되돌려 놓으세요.'
          :'구름정원의 바람이 뒤틀려 있습니다. 폭풍싹 둘과 구름뿌리 수호자를 쓰러뜨리면 정원 심장에 접근할 수 있습니다.');
      return;
    }

    if(skybreakRef.current.inside){
      if(playerNearSkybreakBeacon(playerRef.current.position,skybreakRef.current)){
        skybreakRef.current=reachSkybreakBeacon(skybreakRef.current);
        requestOpenAdventureUpdate({type:'reach-skybreak-beacon'});
        windwalkUnlockedRef.current=true;
        if(fieldEnemiesSnapshotRef.current){
          fieldEnemiesSnapshotRef.current=mergeDawnreachWindHunters(
            fieldEnemiesSnapshotRef.current,
            true,
          );
        }
        setWindwalkUnlockedState(true);
        setSkybreakBeaconReached(true);
        setNearSkybreakBeacon(false);
        setNotice('바람유리 봉화가 깨어났습니다. 바람걸음을 익혔습니다 — 공중에서 Space를 유지하면 활강할 수 있습니다. 봉화 빛에 반응해 새벽들판 상공에 돌풍날개가 나타났습니다. 지상에서는 급강하를 피한 뒤 반격하거나, 높은 곳에서 직접 요격할 수 있습니다.');
        return;
      }
      if(playerNearSkybreakWindLift(playerRef.current.position,skybreakRef.current)){
        leaveSkybreakTo(
          skybreakReturnToSkywatch(),
          '바람승강로를 타고 별바람 전망대의 높은 능선으로 내려왔습니다. 여기서 뛰어내려 Space를 유지하면 새로 익힌 바람걸음으로 들판을 향해 활강할 수 있습니다.',
        );
        return;
      }
      if(playerNearSkybreakEntrance(playerRef.current.position,skybreakRef.current)){
        leaveSkybreakTo(
          skybreakReturnToBridge(),
          '하늘갈림 고지를 빠져나와 끊어진 돌다리로 돌아왔습니다.',
        );
        return;
      }
      setNotice(skybreakRef.current.beaconReached
        ?'바람유리 봉화가 켜져 있습니다. 입구로 돌아가거나 봉화 옆 바람승강로를 이용할 수 있습니다.'
        :'정면 중앙은 주기적인 돌풍길입니다. Q 바람밀기·달리기·회피로 뚫거나, 오른쪽 능선의 적을 상대해 우회할 수 있습니다.');
      return;
    }

    if(roadsideAmbushPhaseRef.current==='witnessed'&&playerNearRoadsideAmbush(playerRef.current.position)){
      interveneRoadsideAmbush();
      return;
    }
    const inCombat=enemiesRef.current.some(enemy=>enemy.hp>0&&engagedModes.has(enemy.mode));
    if(inCombat||combatRef.current.hp<=0)return;

    if(hollowCaveRef.current.inside){
      if(playerNearHollowCaveShortcut(playerRef.current.position,hollowCaveRef.current)){
        hollowCaveRef.current=leaveHollowCave(hollowCaveRef.current);
        playerRef.current={
          ...playerRef.current,
          position:hollowCaveReturnFromShortcut(),
          velocity:{x:0,y:0,z:0},
        };
        cameraRef.current={
          ...cameraRef.current,
          target:{
            x:playerRef.current.position.x,
            y:playerRef.current.position.y+1.8,
            z:playerRef.current.position.z,
          },
        };
        setInsideHollowCave(false);
        setNearHollowShortcut(false);
        setNotice('열린 바위문을 빠져나오자 끊어진 돌다리 아래쪽 길로 이어집니다. 이제 동굴과 돌다리를 빠르게 오갈 수 있습니다.');
        return;
      }
      if(playerNearHollowCaveExit(playerRef.current.position,hollowCaveRef.current)){
        hollowCaveRef.current=leaveHollowCave(hollowCaveRef.current);
        playerRef.current={
          ...playerRef.current,
          position:hollowCaveReturnFromEntrance(),
          velocity:{x:0,y:0,z:0},
        };
        cameraRef.current={
          ...cameraRef.current,
          target:{
            x:playerRef.current.position.x,
            y:playerRef.current.position.y+1.8,
            z:playerRef.current.position.z,
          },
        };
        setInsideHollowCave(false);
        setNearHollowExit(false);
        setNotice('폭포 뒤 틈을 빠져나와 새벽들판으로 돌아왔습니다.');
        return;
      }
      setNotice(hollowCaveRef.current.shortcutOpen
        ?'동굴 양쪽에 출구가 열려 있습니다. 폭포 쪽으로 돌아가거나 새로 열린 돌다리 지름길을 이용할 수 있습니다.'
        :`동굴 안 바람 공명석 ${countActiveHollowCaveResonators(hollowCaveRef.current)}/3 · Q 바람밀기로 공명시킬 수 있습니다.`);
      return;
    }

    if(playerNearCloudGardenOutsideEntrance(
      playerRef.current.position,
      windwalkMasteredRef.current,
    )){
      enterCloudGardenAt(
        cloudGardenRef.current.restored
          ?'서쪽 능선의 맑아진 구름틈을 통과해 복원된 구름정원으로 돌아왔습니다.'
          :'세 공중 흔적이 하나로 이어지며 서쪽 능선의 구름틈이 열렸습니다. 안쪽에서는 뒤틀린 바람과 수호자의 움직임이 느껴집니다.',
      );
      return;
    }

    if(playerNearHollowCaveOutsideShortcut(
      playerRef.current.position,
      hollowCaveRef.current.shortcutOpen,
    )){
      hollowCaveRef.current=enterHollowCave(hollowCaveRef.current);
      playerRef.current={
        ...playerRef.current,
        position:hollowCaveInsideShortcutSpawn(),
        velocity:{x:0,y:0,z:0},
      };
        cameraRef.current={
          ...cameraRef.current,
          target:{
            x:playerRef.current.position.x,
            y:playerRef.current.position.y+1.8,
            z:playerRef.current.position.z,
          },
        };
      setInsideHollowCave(true);
      setNotice('돌다리 아래 열린 틈을 통과해 바람숨 동굴 안쪽으로 들어왔습니다.');
      return;
    }

    if(playerNearSkybreakOutsideLift(
      playerRef.current.position,
      skybreakRef.current.beaconReached,
    )){
      enterSkybreakAt(
        skybreakWindLiftEntry(),
        '별바람 전망대의 바람승강로를 타고 하늘갈림 고지의 봉화 쪽으로 올라왔습니다.',
      );
      return;
    }

    if(
      visitedRef.current.has('old-bridge')&&
      playerNearSkybreakBridge(
        playerRef.current.position,
        hollowCaveRef.current.shortcutOpen,
      )
    ){
      enterSkybreakAt(
        skybreakEntryPosition(),
        '끊어진 돌다리 아래 열린 바람길을 건너 하늘갈림 고지에 도착했습니다. 중앙의 돌풍을 뚫거나 오른쪽 능선으로 우회할 수 있습니다.',
      );
      return;
    }

    if(
      (visitedRef.current.has(HOLLOW_CAVE.discoveryId)||
        nearbyRef.current?.id===HOLLOW_CAVE.discoveryId)&&
      playerNearHollowCaveEntrance(playerRef.current.position)
    ){
      if(!visitedRef.current.has(HOLLOW_CAVE.discoveryId))discover();
      hollowCaveRef.current=enterHollowCave(hollowCaveRef.current);
      playerRef.current={
        ...playerRef.current,
        position:hollowCaveInsideEntryPosition(),
        velocity:{x:0,y:0,z:0},
      };
        cameraRef.current={
          ...cameraRef.current,
          target:{
            x:playerRef.current.position.x,
            y:playerRef.current.position.y+1.8,
            z:playerRef.current.position.z,
          },
        };
      setInsideHollowCave(true);
      setNotice(hollowCaveRef.current.shortcutOpen
        ?'바람숨 동굴 안입니다. 예전에 열어 둔 바위문 너머로 돌다리 쪽 바람이 들어옵니다.'
        :'바람숨 동굴 안쪽에 세 개의 공명석이 서 있습니다. 바람을 어떻게 전달할지 직접 시험해 보세요.');
      return;
    }

    if(playerNearWanderingCaravan(playerRef.current.position,caravanRef.current)){
      const familiar=caravanMetRef.current;
      if(!familiar){
        caravanMetRef.current=true;
        setCaravanFamiliar(true);
        requestOpenAdventureUpdate({type:'resolve-world-event',id:WANDERING_CARAVAN.id,outcome:'met'});
      }
      setNotice(wanderingCaravanMessage(familiar,roadsideOutcomeRef.current));
      return;
    }

    const consequence=roadsideAmbushConsequence(roadsideOutcomeRef.current);
    if(playerNearWorldConsequence(playerRef.current.position,consequence)){
      setNotice(roadsideConsequenceMessage(consequence!.kind));
      return;
    }

    if(canClaimRuinReward(ruinPuzzleRef.current,STARTING_RUIN_PUZZLE,playerRef.current.position)){
      ruinPuzzleRef.current=claimRuinReward(ruinPuzzleRef.current);
      echoSenseRef.current=true;
      requestOpenAdventureUpdate({
        type:'sync-ruin',
        stonePosition:{x:ruinPuzzleRef.current.stonePosition.x,z:ruinPuzzleRef.current.stonePosition.z},
        brazierLit:ruinPuzzleRef.current.brazierLit,
        solved:true,
        rewardClaimed:true,
      });
      setEchoSenseUnlocked(true);
      setRewardReady(false);
      setNotice('메아리 감각을 얻었습니다. 이전에는 눈에 띄지 않던 숨은 장소가 들판에서 희미하게 드러납니다.');
      return;
    }

    if(playerNearRuinStone(ruinPuzzleRef.current,playerRef.current.position)){
      const result=pushRuinStone(
        ruinPuzzleRef.current,
        STARTING_RUIN_PUZZLE,
        playerRef.current.position,
        playerRef.current.facingYaw,
        startingFieldHeight,
      );
      ruinPuzzleRef.current=result.state;
      if(result.moved){
        requestOpenAdventureUpdate({
          type:'sync-ruin',
          stonePosition:{x:result.state.stonePosition.x,z:result.state.stonePosition.z},
          brazierLit:result.state.brazierLit,
          solved:result.state.solved,
          rewardClaimed:result.state.rewardClaimed,
        });
        setNotice('공명석을 밀었습니다. 두 공명판을 동시에 깨울 방법은 하나가 아닙니다.');
        return;
      }
    }

    discover();
  },[discover,enterCloudGardenAt,enterSkybreakAt,interveneRoadsideAmbush,leaveCloudGardenToField,leaveSkybreakTo]);


  const recoverAtEntrance=useCallback(()=>{
    playerRef.current={...DEFAULT_PLAYER_STATE,position:{...STARTING_FIELD.spawn}};
    hollowCaveRef.current=leaveHollowCave(hollowCaveRef.current);
    skybreakRef.current=leaveSkybreakHighland(skybreakRef.current);
    cloudGardenRef.current=leaveCloudGarden(cloudGardenRef.current);
    setInsideHollowCave(false);
    setInsideSkybreak(false);
    setInsideCloudGarden(false);
    combatRef.current={...DEFAULT_PLAYER_COMBAT};
    enemiesRef.current=fieldEnemiesSnapshotRef.current??createDawnreachFieldEnemies(campClearedRef.current,windwalkUnlockedRef.current);
    fieldEnemiesSnapshotRef.current=null;
    if(roadsideAmbushPhaseRef.current==='intervening'){
      roadsideAmbushPhaseRef.current='witnessed';
      setWorldEventPhase('witnessed');
    }
    cameraRef.current={...DEFAULT_ADVENTURE_CAMERA,target:{x:STARTING_FIELD.spawn.x,y:2,z:STARTING_FIELD.spawn.z}};
    attackRef.current=false;
    dodgeRef.current=false;
    jumpRef.current=false;
    glideHeldRef.current=false;
    windwalkActiveRef.current=false;
    boostedWindCurrentRef.current=null;
    setWindwalkActive(false);
    lockedTargetRef.current=null;
    setLockedTargetId(null);
    setHp(DEFAULT_PLAYER_COMBAT.hp);
    setStamina(DEFAULT_PLAYER_STATE.stamina);
    setLivingEnemies(enemiesRef.current.length);
    setCombatEngaged(false);
    setCounterReady(false);
    setNotice('들판 입구에서 다시 일어났습니다. 정면 전투 대신 다른 길로 우회해도 됩니다.');
  },[]);

  useEffect(()=>{
    const down=(event:KeyboardEvent)=>{
      if(movementKeys.has(event.code)){event.preventDefault();pressedRef.current.add(event.code);return;}
      if(event.code==='ShiftLeft'||event.code==='ShiftRight'){sprintTouchRef.current=true;return;}
      if(event.code==='Space'){event.preventDefault();glideHeldRef.current=true;if(!event.repeat)jumpRef.current=true;return;}
      if(event.code==='KeyJ'&&!event.repeat){event.preventDefault();attackRef.current=true;return;}
      if(event.code==='KeyK'&&!event.repeat){event.preventDefault();dodgeRef.current=true;return;}
      if(event.code==='KeyL'&&!event.repeat){event.preventDefault();toggleLockOn();return;}
      if(event.code==='KeyT'&&!event.repeat){event.preventDefault();cycleLockOn();return;}
      if(event.code==='KeyR'&&!event.repeat&&combatRef.current.hp<=0){event.preventDefault();recoverAtEntrance();return;}
      if(event.code==='KeyQ'&&!event.repeat){event.preventDefault();castEnvironmentAbility('windPulse');return;}
      if(event.code==='KeyC'&&!event.repeat){event.preventDefault();castEnvironmentAbility('emberSpark');return;}
      if(event.code==='KeyE'&&!event.repeat){event.preventDefault();interactWorld();return;}
      if(event.code==='KeyX'&&!event.repeat&&roadsideAmbushPhaseRef.current==='witnessed'){event.preventDefault();passRoadsideAmbush();return;}
      if(event.code==='KeyF'&&!event.repeat){event.preventDefault();discover();return;}
      if(event.code==='Escape'){event.preventDefault();onExit();}
    };
    const up=(event:KeyboardEvent)=>{
      pressedRef.current.delete(event.code);
      if(event.code==='ShiftLeft'||event.code==='ShiftRight')sprintTouchRef.current=false;
      if(event.code==='Space')glideHeldRef.current=false;
    };
    const clear=()=>{
      pressedRef.current.clear();
      stickRef.current={x:0,y:0};
      sprintTouchRef.current=false;
      glideHeldRef.current=false;
      windwalkActiveRef.current=false;
      attackRef.current=false;
      dodgeRef.current=false;
    };
    window.addEventListener('keydown',down);
    window.addEventListener('keyup',up);
    window.addEventListener('blur',clear);
    return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);};
  },[castEnvironmentAbility,cycleLockOn,discover,interactWorld,onExit,passRoadsideAmbush,recoverAtEntrance,toggleLockOn]);

  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas)return;
    const context=canvas.getContext('2d');
    if(!context)return;
    let frame=0;
    let last=performance.now();
    let lastHud=0;

    const resize=()=>{
      const rect=canvas.getBoundingClientRect();
      const ratio=Math.min(2,window.devicePixelRatio||1);
      const width=Math.max(1,Math.round(rect.width*ratio));
      const height=Math.max(1,Math.round(rect.height*ratio));
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
      context.setTransform(ratio,0,0,ratio,0,0);
    };

    const tick=(time:number)=>{
      resize();
      const dt=Math.min(.05,Math.max(0,(time-last)/1000));
      last=time;

      const keys=pressedRef.current;
      const keyboardX=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
      const keyboardForward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0);
      const stick=stickRef.current;
      const strafe=keyboardX+stick.x;
      const forward=keyboardForward-stick.y;
      const move=cameraRelativeMove(strafe,forward,cameraRef.current.yaw);

      let lockedEnemy=lockedTargetRef.current
        ?enemiesRef.current.find(enemy=>enemy.id===lockedTargetRef.current)
        :undefined;
      if(lockedTargetRef.current&&!lockedTargetStillValid(lockedEnemy,playerRef.current.position)){
        lockedTargetRef.current=null;
        setLockedTargetId(null);
        lockedEnemy=undefined;
      }

      let combat=stepPlayerCombat(combatRef.current,dt);
      if(attackRef.current){
        if(lockedEnemy)playerRef.current={
          ...playerRef.current,
          facingYaw:yawToTarget(playerRef.current.position,lockedEnemy.position),
        };
        combat=tryStartPlayerAttack(combat);
        attackRef.current=false;
      }

      if(dodgeRef.current){
        const dodge=tryStartPlayerDodge(combat,playerRef.current.stamina,move,playerRef.current.facingYaw);
        combat=dodge.state;
        if(dodge.started)playerRef.current={...playerRef.current,stamina:dodge.stamina};
        dodgeRef.current=false;
      }

      const incapacitated=combat.hp<=0||combat.hitstun>0;
      const wantsSprint=!incapacitated&&combat.attackClock<0&&combat.dodgeClock<0&&sprintTouchRef.current;
      const movementInput=incapacitated||combat.dodgeClock>=0?{x:0,z:0}:move;
      const terrainHeight=cloudGardenRef.current.inside
        ?cloudGardenHeight
        :skybreakRef.current.inside
          ?skybreakHighlandHeight
          :startingFieldHeight;
      const movementHalfSize=cloudGardenRef.current.inside
        ?CLOUD_GARDEN.halfSize
        :skybreakRef.current.inside
          ?SKYBREAK_HIGHLAND.halfSize
          :STARTING_FIELD.halfSize;
      playerRef.current=stepPlayerMotion(playerRef.current,{
        moveX:movementInput.x,
        moveZ:movementInput.z,
        sprint:wantsSprint,
        jump:!incapacitated&&combat.dodgeClock<0&&jumpRef.current,
      },dt,terrainHeight,movementHalfSize);
      jumpRef.current=false;
      playerRef.current=applyDodgeMotion(playerRef.current,combat,dt,terrainHeight,movementHalfSize);
      const windwalkHeld=glideHeldRef.current&&combat.dodgeClock<0&&!incapacitated;
      const windwalkStep=applyWindwalkGlide(
        playerRef.current,
        windwalkHeld,
        windwalkUnlockedRef.current,
        dt,
        windwalkMasteredRef.current,
      );
      playerRef.current=windwalkStep.state;
      windwalkActiveRef.current=windwalkStep.active;
      if(!hollowCaveRef.current.inside&&!skybreakRef.current.inside&&!cloudGardenRef.current.inside){
        const currentStep=applyWindwalkCurrent(
          playerRef.current,
          windwalkHeld,
          windwalkUnlockedRef.current,
          dt,
          cloudGardenRef.current.restored,
        );
        playerRef.current=currentStep.state;
        boostedWindCurrentRef.current=currentStep.boostedCurrentId;
        const trace=findWindwalkTrace(
          playerRef.current,
          windwalkTracesRef.current,
          windwalkUnlockedRef.current,
        );
        if(trace){
          windwalkTracesRef.current=new Set(windwalkTracesRef.current).add(trace);
          requestOpenAdventureUpdate({type:'discover-windwalk-trace',id:trace});
          const traceCount=windwalkTracesRef.current.size;
          const mastered=windwalkMastered(traceCount);
          windwalkMasteredRef.current=mastered;
          setWindwalkTraceCount(traceCount);
          setWindwalkMasteredState(mastered);
          setNotice(mastered
            ?'세 공중 흔적을 모두 이었습니다. 바람걸음 숙련 — 같은 활강에 드는 스태미나가 줄어 더 멀리 이동할 수 있습니다.'
            :`공중 흔적 ${traceCount}/${windwalkTraceIds.length} 발견 · 상승기류를 이어 다음 흔적을 찾아보세요.`);
        }
      }else{
        boostedWindCurrentRef.current=null;
      }
      if(hollowCaveRef.current.inside){
        playerRef.current={
          ...playerRef.current,
          position:constrainHollowCavePlayer(playerRef.current.position),
        };
      }
      hollowCaveRef.current=stepHollowCaveRuntime(hollowCaveRef.current,dt);

      if(cloudGardenRef.current.inside){
        playerRef.current={
          ...playerRef.current,
          position:constrainCloudGardenPlayer(playerRef.current.position),
        };
      }

      if(skybreakRef.current.inside){
        playerRef.current={
          ...playerRef.current,
          position:constrainSkybreakPlayer(playerRef.current.position),
        };
        skybreakRef.current=stepSkybreakHighland(skybreakRef.current,dt);
        const gust=applySkybreakGust(
          playerRef.current.position,
          skybreakRef.current,
          combat.dodgeClock>=0,
          dt,
        );
        playerRef.current={...playerRef.current,position:gust.position};
        if(gust.pushed&&!skybreakGustPushedRef.current){
          setNotice('정면 돌풍에 밀렸습니다. 돌풍이 잠잠할 때 달리거나, 회피로 버티거나, Q 바람밀기로 잠시 상쇄할 수 있습니다.');
        }
        skybreakGustPushedRef.current=gust.pushed;
      }else{
        skybreakGustPushedRef.current=false;
      }

      const dawnreachPlayerPosition=cloudGardenRef.current.inside
        ?{x:999,y:0,z:999}
        :playerRef.current.position;
      const caravanPause=playerNearWanderingCaravan(dawnreachPlayerPosition,caravanRef.current,7);
      caravanRef.current=stepWanderingCaravan(caravanRef.current,dt,caravanPause);
      if(
        combat.hp>0&&
        !cloudGardenRef.current.inside&&
        shouldWitnessWanderingCaravan(dawnreachPlayerPosition,caravanRef.current,caravanWitnessedRef.current)
      ){
        caravanWitnessedRef.current=true;
        setNotice('짐짐승 방울 소리와 함께 행상인이 들판 길을 지나갑니다. 가까이 가면 잠시 멈춰 이야기를 나눌 수 있습니다.');
      }

      if(
        roadsideAmbushPhaseRef.current==='hidden'&&
        !roadsideAmbushResolvedRef.current&&
!cloudGardenRef.current.inside&&
        shouldWitnessRoadsideAmbush(dawnreachPlayerPosition,false)
      ){
        roadsideAmbushPhaseRef.current='witnessed';
        setWorldEventPhase('witnessed');
        setNotice('앞쪽 길목에서 여행자가 습격당하고 있습니다. 개입할지, 지나갈지 직접 선택할 수 있습니다.');
      }

      const wasPuzzleSolved=ruinPuzzleRef.current.solved;
      ruinPuzzleRef.current=stepRuinPuzzle(
        ruinPuzzleRef.current,
        STARTING_RUIN_PUZZLE,
        dawnreachPlayerPosition,
        dt,
      );
      if(!wasPuzzleSolved&&ruinPuzzleRef.current.solved&&!ruinSolvedNotifiedRef.current){
        ruinSolvedNotifiedRef.current=true;
        requestOpenAdventureUpdate({
          type:'sync-ruin',
          stonePosition:{x:ruinPuzzleRef.current.stonePosition.x,z:ruinPuzzleRef.current.stonePosition.z},
          brazierLit:ruinPuzzleRef.current.brazierLit,
          solved:true,
          rewardClaimed:ruinPuzzleRef.current.rewardClaimed,
        });
        setNotice('메아리 폐허의 봉인이 풀렸습니다. 안쪽 공명핵에서 새로운 탐험 감각을 얻을 수 있습니다.');
      }

      const hazardStep=stepFieldHazards(hazardsRef.current,dt);
      hazardsRef.current=hazardStep.hazards;

      const previousHerdBehavior=herdRef.current.behavior;
      herdRef.current=stepDawnreachHerd(
        herdRef.current,
        dawnreachPlayerPosition,
        hazardsRef.current,
        dt,
      );
      if(
        combat.hp>0&&
        !cloudGardenRef.current.inside&&
        shouldWitnessDawnreachHerd(dawnreachPlayerPosition,herdRef.current,herdWitnessedRef.current)
      ){
        herdWitnessedRef.current=true;
        setNotice('풀숲 사이로 새벽사슴 무리가 움직입니다. 가까이 다가가면 놀라 달아나고, 불길이 번지면 먼저 위험을 피해 움직입니다.');
      }else if(
        previousHerdBehavior!=='flee-fire'&&
        herdRef.current.behavior==='flee-fire'&&
        !cloudGardenRef.current.inside&&
        playerNearDawnreachHerd(dawnreachPlayerPosition,herdRef.current,26)
      ){
        setNotice('불길에 놀란 새벽사슴 무리가 급히 방향을 틀어 안전한 쪽으로 달아납니다.');
      }

      if(visitedRef.current.has(WILDLIFE_DISCOVERY_TRAIL.targetDiscoveryId)){
        wildlifeTrailClockRef.current=0;
      }else if(!cloudGardenRef.current.inside&&shouldRevealWildlifeDiscoveryTrail(
        dawnreachPlayerPosition,
        herdRef.current,
        visitedRef.current,
      )){
        const wasInactive=wildlifeTrailClockRef.current<=0;
        wildlifeTrailClockRef.current=WILDLIFE_DISCOVERY_TRAIL.duration;
        if(wasInactive&&!wildlifeTrailHintedRef.current){
          wildlifeTrailHintedRef.current=true;
          setNotice('사슴들이 자주 밟는 길에 희미한 발자국이 이어집니다. 폭포 쪽 바위 뒤로 사라지는 흔적을 따라가 볼 수 있습니다.');
        }
      }else{
        wildlifeTrailClockRef.current=Math.max(0,wildlifeTrailClockRef.current-dt);
      }

      if(hazardStep.damagePulse){
        hazardPulseSerialRef.current+=1;
        const burned=applyBurningHazardsToEnemies(
          enemiesRef.current,
          hazardsRef.current,
          hazardPulseSerialRef.current,
        );
        enemiesRef.current=burned.enemies;

        const playerBurn=applyBurningHazardsToPlayer(
          combat,
          dawnreachPlayerPosition,
          hazardsRef.current,
        );
        combat=playerBurn.state;

        if(playerBurn.damaged)setNotice(combat.hp>0
          ?'불길 안에 오래 머물러 화상을 입었습니다. 회피나 이동으로 위험 지대에서 벗어나세요.'
          :'환경 화재에 쓰러졌습니다. 불길도 적 공격처럼 피해야 합니다.');
        else if(burned.damagedIds.length>0)setNotice(`환경 화재가 적 ${burned.damagedIds.length}명에게 피해를 주고 진형을 흔들었습니다.`);
      }

      if(playerAttackWindowOpen(combat)){
        const counterAttack=playerAttackIsCounter(combat);
        const attackDamage=playerAttackDamage(combat);
        enemiesRef.current=enemiesRef.current.map(enemy=>{
          if(!playerAttackConnects(playerRef.current.position,playerRef.current.facingYaw,enemy.position,1))return enemy;
          const result=applyEnemyDamage(
            enemy,
            attackDamage,
            combat.attackSerial,
            {counter:counterAttack},
          );
          if(result.damaged){
            if(result.defeated)setNotice(`${enemy.label} 격파`);
            else if(result.guardBroken)setNotice(`가드 파괴 · ${enemy.label}이 크게 비틀거립니다. 지금 추가 공격을 이어가세요.`);
            else if(counterAttack)setNotice(`완벽 회피 반격 · ${enemy.label}에게 강한 일격!`);
            else if(result.blocked)setNotice(`${enemy.label}의 방어에 막혀 피해가 줄었습니다. 공격 예고에 맞춰 회피 후 반격하면 가드를 깰 수 있습니다.`);
            else setNotice(`${enemy.label}에게 공격 적중`);
          }
          return result.enemy;
        });
      }

      if(combat.hp>0){
        const avoidanceZones=skybreakRef.current.inside||cloudGardenRef.current.inside
          ?[]
          :burningHazardAvoidanceZones(hazardsRef.current);
        const enemyTerrain=cloudGardenRef.current.inside
          ?cloudGardenHeight
          :skybreakRef.current.inside
            ?skybreakHighlandHeight
            :startingFieldHeight;
        const stepped=enemiesRef.current.map(enemy=>stepEnemyAi(
          enemy,
          playerRef.current.position,
          dt,
          enemyTerrain,
          avoidanceZones,
        ));
        enemiesRef.current=alertNearbyEnemies(stepped.map(result=>result.enemy));
        for(const result of stepped){
          if(!result.attack)continue;
          const hit=resolveEnemyAttack(combat,result.attack.damage);
          combat=hit.state;
          if(hit.perfectDodged){
            setNotice('완벽 회피 · 반격 기회! 짧은 시간 안에 공격하면 강한 반격이 되고 방패형 적의 가드를 깨뜨립니다.');
            continue;
          }
          if(hit.damaged)setNotice(combat.hp>0?'공격을 맞았습니다. 예고 동작을 보고 회피 타이밍을 잡으세요.':'쓰러졌습니다. R 또는 다시 일어나기로 들판 입구에서 재개할 수 있습니다.');
        }
      }

      if(!skybreakRef.current.inside&&!cloudGardenRef.current.inside&&roadsideAmbushPhaseRef.current==='intervening'&&roadsideAmbushDefeated(enemiesRef.current)){
        roadsideAmbushResolvedRef.current=true;
        roadsideOutcomeRef.current='rescued';
        roadsideAmbushPhaseRef.current='resolved';
        setWorldEventPhase('resolved');
        setNearWorldEvent(false);
        requestOpenAdventureUpdate({type:'resolve-world-event',id:ROADSIDE_AMBUSH.id,outcome:'rescued'});
        setNotice('여행자를 구했습니다. 이 길목의 사건은 해결된 상태로 기억됩니다.');
      }

      combatRef.current=combat;
      cameraRef.current=followAdventureCamera(cameraRef.current,{
        x:playerRef.current.position.x,
        y:playerRef.current.position.y+1.8,
        z:playerRef.current.position.z,
      },dt);
      const cameraLockedEnemy=lockedTargetRef.current
        ?enemiesRef.current.find(enemy=>enemy.id===lockedTargetRef.current)
        :undefined;
      if(lockedTargetStillValid(cameraLockedEnemy,playerRef.current.position)){
        cameraRef.current={
          ...cameraRef.current,
          yaw:smoothLockOnYaw(
            cameraRef.current.yaw,
            playerRef.current.position,
            cameraLockedEnemy!.position,
            dt,
          ),
        };
      }

      const nextNearby=skybreakRef.current.inside||cloudGardenRef.current.inside?null:nearestStartingFieldDiscovery(playerRef.current.position.x,playerRef.current.position.z,visitedRef.current);
      nearbyRef.current=nextNearby;
      renderAdventureField(
        context,
        canvas.clientWidth,
        canvas.clientHeight,
        STARTING_FIELD,
        playerRef.current,
        cameraRef.current,
        visitedRef.current,
        nextNearby?.id??null,
        enemiesRef.current,
        combat,
        ruinPuzzleRef.current,
        STARTING_RUIN_PUZZLE,
        echoSenseRef.current,
        hazardsRef.current,
        lockedTargetRef.current,
        roadsideAmbushVisual(roadsideAmbushPhaseRef.current),
        roadsideAmbushConsequence(roadsideOutcomeRef.current),
        playerNearWorldConsequence(
          playerRef.current.position,
          roadsideAmbushConsequence(roadsideOutcomeRef.current),
        ),
        wanderingCaravanVisual(
          caravanRef.current,
          caravanMetRef.current,
          playerNearWanderingCaravan(playerRef.current.position,caravanRef.current),
        ),
        dawnreachHerdVisual(herdRef.current),
        dawnreachWildlifeTrailVisual(wildlifeTrailClockRef.current),
        hollowCaveVisual(hollowCaveRef.current,playerRef.current.position),
        skybreakHighlandVisual(skybreakRef.current,playerRef.current.position),
        {
          windwalkRoute:windwalkRouteVisual(
            windwalkUnlockedRef.current&&!hollowCaveRef.current.inside&&!skybreakRef.current.inside&&!cloudGardenRef.current.inside,
            windwalkTracesRef.current,
            boostedWindCurrentRef.current,
            cloudGardenRef.current.restored,
          ),
          cloudGarden:cloudGardenVisual(
            cloudGardenRef.current,
            playerRef.current.position,
            enemiesRef.current,
          ),
          cloudGardenEntrance:cloudGardenEntranceVisual(
            windwalkMasteredRef.current,
            cloudGardenRef.current.restored,
            playerRef.current.position,
          ),
        },
      );

      const living=enemiesRef.current.filter(enemy=>enemy.hp>0).length;
      if(
        cloudGardenRef.current.inside&&
        !cloudGardenRef.current.restored&&
        living===0&&
        !cloudGardenClearNotifiedRef.current
      ){
        cloudGardenClearNotifiedRef.current=true;
        setCloudGardenClear(true);
        setNotice('마지막 폭풍 수호자가 사라졌습니다. 정원 북쪽의 흐린 심장으로 가서 E로 바람을 되돌려 놓으세요.');
      }
      const campLiving=enemiesRef.current.filter(enemy=>isStartingCampEnemy(enemy)&&enemy.hp>0).length;
      if(!skybreakRef.current.inside&&!cloudGardenRef.current.inside&&campLiving===0&&!campClearedRef.current){
        campClearedRef.current=true;
        requestOpenAdventureUpdate({type:'clear-camp'});
        setNotice('재빛 야영지의 위협이 사라졌습니다. 주변 흔적과 남겨진 물건을 직접 살펴보세요.');
      }

      if(time-lastHud>80){
        lastHud=time;
        setStamina(Math.round(playerRef.current.stamina));
        setHp(combat.hp);
        setWindwalkActive(windwalkActiveRef.current);
        setSprinting(wantsSprint&&playerRef.current.stamina>.5&&Math.hypot(playerRef.current.velocity.x,playerRef.current.velocity.z)>5.8);
        setNearby(current=>current?.id===nextNearby?.id?current:nextNearby);
        setLivingEnemies(living);
        setCombatEngaged(enemiesRef.current.some(enemy=>enemy.hp>0&&engagedModes.has(enemy.mode)));
        setCounterReady(combat.counterWindow>0&&combat.dodgeClock<0);
        setNearPuzzle(!cloudGardenRef.current.inside&&playerNearRuinPuzzle(STARTING_RUIN_PUZZLE,playerRef.current.position));
        setNearStone(!cloudGardenRef.current.inside&&playerNearRuinStone(ruinPuzzleRef.current,playerRef.current.position));
        setRewardReady(!cloudGardenRef.current.inside&&canClaimRuinReward(ruinPuzzleRef.current,STARTING_RUIN_PUZZLE,playerRef.current.position));
        setPuzzleSolved(ruinPuzzleRef.current.solved);
        setNearHazard(!cloudGardenRef.current.inside&&playerNearFieldHazard(hazardsRef.current,playerRef.current.position));
        setNearWorldEvent(
          !cloudGardenRef.current.inside&&roadsideAmbushPhaseRef.current==='witnessed'&&playerNearRoadsideAmbush(playerRef.current.position),
        );
        setNearWorldConsequence(!cloudGardenRef.current.inside&&playerNearWorldConsequence(
          playerRef.current.position,
          roadsideAmbushConsequence(roadsideOutcomeRef.current),
        ));
        setNearCaravan(!cloudGardenRef.current.inside&&playerNearWanderingCaravan(playerRef.current.position,caravanRef.current));
        setNearWildlife(!cloudGardenRef.current.inside&&playerNearDawnreachHerd(playerRef.current.position,herdRef.current));
        setWildlifeBehavior(herdRef.current.behavior);
        setWildlifeTrailActive(wildlifeTrailClockRef.current>0);
        setInsideHollowCave(hollowCaveRef.current.inside);
        setHollowResonators(countActiveHollowCaveResonators(hollowCaveRef.current));
        setHollowShortcutOpen(hollowCaveRef.current.shortcutOpen);
        setNearHollowExit(playerNearHollowCaveExit(playerRef.current.position,hollowCaveRef.current));
        setNearHollowShortcut(playerNearHollowCaveShortcut(playerRef.current.position,hollowCaveRef.current));
        setNearHollowEntrance(
          !hollowCaveRef.current.inside&&
          visitedRef.current.has(HOLLOW_CAVE.discoveryId)&&
          playerNearHollowCaveEntrance(playerRef.current.position),
        );
        setNearHollowOutsideShortcut(
          !hollowCaveRef.current.inside&&
          !skybreakRef.current.inside&&
          playerNearHollowCaveOutsideShortcut(
            playerRef.current.position,
            hollowCaveRef.current.shortcutOpen,
          ),
        );
        setInsideSkybreak(skybreakRef.current.inside);
        setSkybreakBeaconReached(skybreakRef.current.beaconReached);
        setSkybreakGust(skybreakGustActive(skybreakRef.current));
        setSkybreakCalm(skybreakRef.current.calmClock>0);
        setNearSkybreakBridge(
          !skybreakRef.current.inside&&
          !hollowCaveRef.current.inside&&
          visitedRef.current.has('old-bridge')&&
          playerNearSkybreakBridge(
            playerRef.current.position,
            hollowCaveRef.current.shortcutOpen,
          ),
        );
        setNearSkybreakEntrance(playerNearSkybreakEntrance(playerRef.current.position,skybreakRef.current));
        setNearSkybreakBeacon(playerNearSkybreakBeacon(playerRef.current.position,skybreakRef.current));
        setNearSkybreakWindLift(playerNearSkybreakWindLift(playerRef.current.position,skybreakRef.current));
        setNearSkybreakOutsideLift(
          !skybreakRef.current.inside&&
          !hollowCaveRef.current.inside&&
          !cloudGardenRef.current.inside&&
          playerNearSkybreakOutsideLift(
            playerRef.current.position,
            skybreakRef.current.beaconReached,
          ),
        );
        setInsideCloudGarden(cloudGardenRef.current.inside);
        setCloudGardenRestored(cloudGardenRef.current.restored);
        setCloudGardenClear(cloudGardenRef.current.restored||cloudGardenEnemiesDefeated(enemiesRef.current));
        setNearCloudGardenEntrance(
          !cloudGardenRef.current.inside&&
          !hollowCaveRef.current.inside&&
          !skybreakRef.current.inside&&
          playerNearCloudGardenOutsideEntrance(
            playerRef.current.position,
            windwalkMasteredRef.current,
          ),
        );
        setNearCloudGardenExit(playerNearCloudGardenExit(playerRef.current.position,cloudGardenRef.current));
        setNearCloudGardenHeart(playerNearCloudGardenHeart(playerRef.current.position,cloudGardenRef.current));
        setBurningHazards(hazardsRef.current.filter(hazard=>hazard.burning).length);
        setLockCandidateCount(targetCandidates(
          enemiesRef.current,
          playerRef.current.position,
          cameraRef.current.yaw,
        ).length);
      }

      frame=requestAnimationFrame(tick);
    };

    frame=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(frame);
  },[]);

  const startLook=(event:PointerEvent<HTMLCanvasElement>)=>{
    if(event.pointerType==='mouse'&&event.button!==0)return;
    dragRef.current={pointerId:event.pointerId,x:event.clientX,y:event.clientY};
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveLook=(event:PointerEvent<HTMLCanvasElement>)=>{
    const drag=dragRef.current;
    if(!drag||drag.pointerId!==event.pointerId)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    drag.x=event.clientX;drag.y=event.clientY;
    if(lockedTargetRef.current&&Math.abs(dx)+Math.abs(dy)>5){
      lockedTargetRef.current=null;
      setLockedTargetId(null);
      setNotice('수동 시점 조작으로 락온을 해제했습니다.');
    }
    cameraRef.current=rotateAdventureCamera(cameraRef.current,-dx*.006,-dy*.0045);
  };
  const endLook=(event:PointerEvent<HTMLCanvasElement>)=>{
    if(dragRef.current?.pointerId!==event.pointerId)return;
    dragRef.current=null;
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const defeated=hp<=0;

  return <section className="adventure3d" data-combat={combatEngaged||undefined} aria-label="새벽들판 자유 탐험 Vertical Slice">
    <canvas
      ref={canvasRef}
      className="adventure3d__canvas"
      tabIndex={0}
      onPointerDown={startLook}
      onPointerMove={moveLook}
      onPointerUp={endLook}
      onPointerCancel={endLook}
      onWheel={event=>{event.preventDefault();cameraRef.current=zoomAdventureCamera(cameraRef.current,event.deltaY*.01);}}
      aria-label="3D 자유 탐험 필드. WASD 이동, 드래그 카메라, Shift 전력질주, Space 점프 및 해금 후 활강, J 공격, K 회피, L 락온, T 타겟 변경, Q 바람밀기, C 불씨점화, E 상호작용, X 사건 지나가기"
    />

    <header className="adventure3d__hud">
      <div><small>{insideHollowCave?'HIDDEN INTERIOR':insideCloudGarden?'SECRET SKY GARDEN':insideSkybreak?'HIGH ROUTE':combatEngaged?'COMBAT':'OPEN ADVENTURE'} · {state.year}년차</small><strong>{insideHollowCave?HOLLOW_CAVE.label:insideCloudGarden?CLOUD_GARDEN.label:insideSkybreak?SKYBREAK_HIGHLAND.label:STARTING_FIELD.label}</strong></div>
      {(combatEngaged||hp<DEFAULT_PLAYER_COMBAT.maxHp)&&<div className="adventure3d__health" aria-label={`체력 ${hp}`}><span style={{width:`${hp}%`}}/></div>}
      <div className="adventure3d__stamina" aria-label={`스태미나 ${stamina}`}><span style={{width:`${stamina}%`}}/></div>
      {combatEngaged&&<em>{insideCloudGarden?'정원 위협':insideSkybreak?'능선 위협':worldEventPhase==='intervening'?'길목 습격':'필드 위협'} {livingEnemies}</em>}
      {counterReady&&<em>전투 기회 · 반격 가능</em>}
      {worldEventPhase==='witnessed'&&<em>우연한 사건 · {ROADSIDE_AMBUSH.label}</em>}
      {nearWorldConsequence&&roadsideOutcomeRef.current==='rescued'&&<em>길목 · 구조된 여행자</em>}
      {nearWorldConsequence&&roadsideOutcomeRef.current==='passed'&&<em>길목 · 남겨진 흔적</em>}
      {nearCaravan&&<em>이동 중 · {caravanFamiliar?'아는 행상인':WANDERING_CARAVAN.label}</em>}
      {nearWildlife&&<em>야생 · {DAWNREACH_HERD.label}{wildlifeBehavior==='flee-fire'?' · 불길 회피':wildlifeBehavior==='flee-player'?' · 경계 중':''}</em>}
      {wildlifeTrailActive&&!insideHollowCave&&!insideCloudGarden&&<em>탐색 흔적 · 새벽사슴 발자국</em>}
      {insideHollowCave&&<em>동굴 공명 · {hollowResonators}/3</em>}
      {hollowShortcutOpen&&insideHollowCave&&<em>새 경로 · 돌다리 지름길 개방</em>}
      {insideSkybreak&&!skybreakBeaconReached&&<em>{skybreakCalm?'돌풍 · 잠시 잦아듦':skybreakGust?'돌풍 · 강풍':'돌풍 · 소강'}</em>}
      {insideSkybreak&&skybreakBeaconReached&&<em>새 경로 · 전망대 바람승강로 개방</em>}
      {windwalkUnlockedState&&<em>{windwalkActive?'바람걸음 · 활강 중':windwalkMasteredState?'바람걸음 · 숙련':'탐험 성장 · 바람걸음'}</em>}
      {windwalkUnlockedState&&!windwalkMasteredState&&<em>공중 흔적 · {windwalkTraceCount}/{windwalkTraceIds.length}</em>}
      {insideCloudGarden&&!cloudGardenRestored&&cloudGardenClear&&<em>정원 심장 · 복원 가능</em>}
      {insideCloudGarden&&cloudGardenRestored&&<em>세계 변화 · 상승기류 강화</em>}
      {lockedTargetId&&<em>락온 · {enemiesRef.current.find(enemy=>enemy.id===lockedTargetId)?.label??'대상'}</em>}
      {!combatEngaged&&nearPuzzle&&<em>{puzzleSolved?'메아리 폐허 · 봉인 해제':'메아리 폐허 · 두 공명판'}</em>}
      {echoSenseUnlocked&&<em>탐험 감각 · 메아리</em>}
      {nearHazard&&burningHazards>0&&<em>환경 · 화재 {burningHazards}</em>}
    </header>

    <div className="adventure3d__notice" role="status" aria-live="polite">
      <small>{visitedCount}/{STARTING_FIELD.discoveries.length} 발견</small>
      <span>{nearCloudGardenEntrance&&!insideCloudGarden
        ?cloudGardenRestored
          ?'복원된 구름정원으로 이어지는 맑은 구름틈입니다. E로 다시 들어갈 수 있습니다.'
          :'바람걸음 숙련으로만 드러난 구름틈입니다. 안쪽에서 뒤틀린 바람과 수호자의 움직임이 느껴집니다.'
        :nearCaravan&&!combatEngaged
        ?caravanFamiliar
          ?'전에 만난 행상인이 다시 들판 길을 지나고 있습니다. 가까이 가서 말을 걸 수 있습니다.'
          :'행상인이 이동 중입니다. 가까이 다가가면 잠시 멈춰 이야기를 나눌 수 있습니다.'
        :nearWorldConsequence&&!combatEngaged
        ?roadsideOutcomeRef.current==='rescued'
          ?'구조한 여행자가 아직 길목에 머물고 있습니다. 말을 걸면 주변에 대한 단서를 들을 수 있습니다.'
          :'습격 뒤 남은 짐과 바퀴 자국을 살펴볼 수 있습니다.'
        :rewardReady?'봉인 안쪽의 공명핵이 손에 닿을 거리에서 울립니다.':nearStone&&!combatEngaged?'공명석을 직접 밀거나 바람밀기로 옮길 수 있습니다.':nearby&&!combatEngaged?nearby.hint:notice}</span>
    </div>

    <button type="button" className="adventure3d__exit" onClick={onExit} aria-label="새벽들판 나가기">×</button>
    {worldEventPhase==='witnessed'&&!defeated&&<aside className="adventure3d__world-event" aria-label="우연한 월드 이벤트">
      <small>우연한 사건</small>
      <strong>{ROADSIDE_AMBUSH.label}</strong>
      <p>여행자가 길목에서 습격당하고 있습니다. 퀘스트를 받은 것이 아니라, 지금 여기서 개입 여부를 정합니다.</p>
      <div>
        <button type="button" disabled={!nearWorldEvent} onClick={interveneRoadsideAmbush}>개입</button>
        <button type="button" onClick={passRoadsideAmbush}>지나가기</button>
      </div>
      <em>{nearWorldEvent?'E 개입 · X 지나가기':'조금 더 가까이 가면 개입 가능 · X 지나가기'}</em>
    </aside>}
    {(combatEngaged||lockCandidateCount>0)&&!defeated&&<div className="adventure3d__target-controls" aria-label="전투 타겟 조작">
      {!lockedTargetId?<button type="button" onClick={toggleLockOn}>락온</button>:<>
        {lockCandidateCount>1&&<button type="button" onClick={cycleLockOn}>다음 적</button>}
        <button type="button" onClick={toggleLockOn}>해제</button>
      </>}
    </div>}
    <MobileJoystick disabled={defeated} onDirection={direction=>{stickRef.current=direction;}}/>
    <div className="adventure3d__actions">
      <button
        type="button"
        disabled={defeated}
        data-active={sprinting||undefined}
        onPointerDown={()=>{sprintTouchRef.current=true;}}
        onPointerUp={()=>{sprintTouchRef.current=false;}}
        onPointerCancel={()=>{sprintTouchRef.current=false;}}
      >달리기</button>
      <button
        type="button"
        disabled={defeated}
        data-active={windwalkActive||undefined}
        onPointerDown={()=>{jumpRef.current=true;glideHeldRef.current=true;}}
        onPointerUp={()=>{glideHeldRef.current=false;}}
        onPointerCancel={()=>{glideHeldRef.current=false;}}
      >{windwalkUnlockedState?'점프/활강':'점프'}</button>
      <button type="button" className="is-combat" data-active={counterReady||undefined} disabled={defeated} onClick={()=>{attackRef.current=true;}}>{counterReady?'반격':'공격'}</button>
      <button type="button" className="is-combat" disabled={defeated} onClick={()=>{dodgeRef.current=true;}}>회피</button>
      {(((nearPuzzle||nearHazard)&&!defeated)||(insideHollowCave&&!hollowShortcutOpen&&!defeated)||(insideSkybreak&&!defeated))&&<button type="button" className="is-environment" onClick={()=>castEnvironmentAbility('windPulse')}>바람밀기</button>}
      {(nearPuzzle||nearHazard)&&!defeated&&!insideHollowCave&&!insideSkybreak&&!insideCloudGarden&&<button type="button" className="is-environment" onClick={()=>castEnvironmentAbility('emberSpark')}>불씨점화</button>}
      <button
        type="button"
        className="is-primary"
        disabled={(!nearby&&!nearStone&&!rewardReady&&!nearWorldConsequence&&!nearCaravan&&!nearHollowExit&&!nearHollowShortcut&&!nearHollowEntrance&&!nearHollowOutsideShortcut&&!nearSkybreakBridge&&!nearSkybreakEntrance&&!nearSkybreakBeacon&&!nearSkybreakWindLift&&!nearSkybreakOutsideLift&&!nearCloudGardenEntrance&&!nearCloudGardenExit&&!nearCloudGardenHeart&&!(worldEventPhase==='witnessed'&&nearWorldEvent))||(combatEngaged&&!nearCloudGardenExit)||defeated}
        onClick={interactWorld}
      >{nearCloudGardenHeart
        ?cloudGardenClear?'정원 복원':'심장 살피기'
        :nearCloudGardenExit
          ?'능선으로 돌아가기'
          :nearCloudGardenEntrance
            ?'구름틈 들어가기'
            :nearSkybreakBeacon
        ?'봉화 깨우기'
        :nearSkybreakWindLift
          ?'전망대로 내려가기'
          :nearSkybreakEntrance
            ?'돌다리로 돌아가기'
            :nearSkybreakOutsideLift
              ?'고지대로 올라가기'
              :nearSkybreakBridge
                ?'고지대 건너기'
                :nearHollowShortcut
        ?'돌다리로 나가기'
        :nearHollowExit
          ?'들판으로 돌아가기'
          :nearHollowOutsideShortcut
            ?'동굴 지름길'
            :nearHollowEntrance
              ?'동굴 들어가기'
              :worldEventPhase==='witnessed'&&nearWorldEvent
                ?'개입'
                :nearCaravan
                  ?'말 걸기'
                  :nearWorldConsequence
                    ?roadsideOutcomeRef.current==='rescued'?'대화하기':'흔적 살피기'
                    :rewardReady?'공명핵 회수':nearStone?'공명석 밀기':nearby?.id===HOLLOW_CAVE.discoveryId?'폭포 뒤 들어가기':nearby?'살펴보기':'주변 관찰'}</button>
      {defeated&&<button type="button" className="is-recover" onClick={recoverAtEntrance}>다시 일어나기</button>}
    </div>
    <div className="adventure3d__controls" aria-hidden="true">WASD 이동 · 드래그 시점 · Shift 달리기 · Space 점프{windwalkUnlockedState?' / 유지 활강':''} · J 공격 · K 회피 · L 락온 · T 다음 적 · Q 바람밀기 · C 불씨점화 · E 상호작용 · X 사건 지나가기</div>
  </section>;
}
