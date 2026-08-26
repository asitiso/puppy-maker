import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { GiftItemId, OutingLocationId } from './adventure';
import { attendanceKey } from './attendance';
import App from './App';
import CollectionArchiveOverlay from './CollectionArchiveOverlay';
import GuardianExpeditionOverlay from './GuardianExpeditionOverlay';
import LayeredHome from './LayeredHome';
import MobileCategoryPage from './MobileCategoryPage';
import MobileLegacyFeaturePage from './MobileLegacyFeaturePage';
import MobileRouterChrome from './MobileRouterChrome';
import RaisingIdentityOverlay from './RaisingIdentityOverlay';
import SanctuaryOverlay from './SanctuaryOverlay';
import SeasonalHomeBadge from './SeasonalHomeBadge';
import SeasonLiveOpsOverlay from './SeasonLiveOpsOverlay';
import TacticalExpeditionFlow, { type TacticalPhase } from './TacticalExpeditionFlow';
import WorldProgressOverlay from './WorldProgressOverlay';
import YearEndCeremonyOverlay from './YearEndCeremonyOverlay';
import YearlyAmbitionOverlay from './YearlyAmbitionOverlay';
import type { AstralRiftId, AstralRiftIntensity } from './astral-rift';
import type { AstralRiftRelicId } from './astral-rift-relics';
import type { BattleResult } from './tactical-battle';
import type { CompanionId } from './tactical-companions';
import type { TacticalEncounterId } from './tactical-encounters';
import {
  currentAvailableMail,
  eligibleAchievements,
  initialState,
  type AchievementId,
  type ExpeditionActionCounts,
  type ExpeditionCraftingRecipeId,
  type ExpeditionRelicId,
  type ExpeditionStageId,
  type GameState,
  type GrowthTraitId,
  type GuardianCallingId,
  type MailRewardId,
  type Screen,
  type YearlyAmbitionId,
} from './game';
import type { HomeMenuId } from './home-panels';
import {
  categoryForFeature,
  initialMobileNavigationState,
  isGuardedActiveRoute,
  mobileNavigationReducer,
  type MobileContentCategory,
  type MobileFeatureId,
} from './mobile-router';
import type { SanctuaryMasterworkId } from './sanctuary-masterworks';
import type { SanctuarySpecializationId } from './sanctuary-specializations';
import type { SanctuaryFacilityId } from './starlight-sanctuary';
import type { SeasonLegacyNodeId } from './season-legacy-board';
import type { SeasonShopOfferId } from './season-shop';
import type { WeeklyFocusId } from './weekly-life';
import './layered-home.css';
import './weekly-planner.css';
import './home-panels.css';
import './seasonal-home.css';
import './season-live-ops.css';
import './collection-archive.css';
import './world-progress.css';
import './year-end-ceremony.css';
import './yearly-ambition.css';
import './expedition-ui.css';
import './expedition-world.css';
import './raising-identity.css';
import './sanctuary.css';
import './astral-rift.css';

const homeMenuFeatures:Record<HomeMenuId,MobileFeatureId>={
  schedule:'schedule',bag:'inventory',quest:'achievements',outing:'outing',bond:'bond',
  attendance:'attendance',event:'stories',mail:'mail',mission:'mission',
};

const legacyPageFeatures = new Set<MobileFeatureId>([
  'mission','attendance','mail','achievements','inventory','outing','bond','gifts','stories',
]);

const appScreenRoutes:Partial<Record<Screen,{category:'life';screen:'schedule'|'training'|'dialogue'|'result'}>>={
  schedule:{category:'life',screen:'schedule'},
  training:{category:'life',screen:'training'},
  dialogue:{category:'life',screen:'dialogue'},
  result:{category:'life',screen:'result'},
};

export default function Root() {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [navigation, dispatchNavigation] = useReducer(mobileNavigationReducer, initialMobileNavigationState);
  const [pendingExit, setPendingExit] = useState<'back'|'home'|null>(null);
  const leavingAppScreenRef = useRef(false);

  const [navigate, setNavigate] = useState<((screen: Screen) => void) | null>(null);
  const [claimAchievement, setClaimAchievement] = useState<((achievement: AchievementId) => void) | null>(null);
  const [goOuting, setGoOuting] = useState<((location: OutingLocationId) => void) | null>(null);
  const [giveGift, setGiveGift] = useState<((item: GiftItemId) => void) | null>(null);
  const [claimAttendance, setClaimAttendance] = useState<(() => void) | null>(null);
  const [claimMail, setClaimMail] = useState<((mail: MailRewardId) => void) | null>(null);
  const [setMonthlyFocus, setSetMonthlyFocus] = useState<((focus: GameState['monthlyFocus']) => void) | null>(null);
  const [setYearlyAmbition, setSetYearlyAmbition] = useState<((ambition: YearlyAmbitionId) => void) | null>(null);
  const [setGuardianCalling, setSetGuardianCalling] = useState<((calling: GuardianCallingId) => void) | null>(null);
  const [purchaseGrowthTrait, setPurchaseGrowthTrait] = useState<((trait: GrowthTraitId) => void) | null>(null);
  const [purchaseSeasonOffer, setPurchaseSeasonOffer] = useState<((offer: SeasonShopOfferId) => void) | null>(null);
  const [unlockSeasonLegacyNode, setUnlockSeasonLegacyNode] = useState<((nodeId: SeasonLegacyNodeId) => void) | null>(null);
  const [upgradeSanctuary, setUpgradeSanctuary] = useState<((facility: SanctuaryFacilityId) => void) | null>(null);
  const [selectSanctuarySpecialization, setSelectSanctuarySpecialization] = useState<((specialization: SanctuarySpecializationId) => void) | null>(null);
  const [buildSanctuaryMasterwork, setBuildSanctuaryMasterwork] = useState<((masterwork: SanctuaryMasterworkId) => void) | null>(null);
  const [clearAstralRift, setClearAstralRift] = useState<((riftId: AstralRiftId, intensity: AstralRiftIntensity) => void) | null>(null);
  const [purchaseAstralRiftRelic, setPurchaseAstralRiftRelic] = useState<((relicId: AstralRiftRelicId) => void) | null>(null);
  const [finishExpedition, setFinishExpedition] = useState<((stageId: ExpeditionStageId, score: number, fatigueDelta: number, stressDelta: number, actionKinds: ExpeditionActionCounts) => void) | null>(null);
  const [equipExpedition, setEquipExpedition] = useState<((relic: ExpeditionRelicId) => void) | null>(null);
  const [unequipExpedition, setUnequipExpedition] = useState<((relic: ExpeditionRelicId) => void) | null>(null);
  const [craftExpedition, setCraftExpedition] = useState<((recipe: ExpeditionCraftingRecipeId) => void) | null>(null);
  const [setTacticalParty, setSetTacticalParty] = useState<((companions:[CompanionId,CompanionId])=>void)|null>(null);
  const [setTacticalPreferences, setSetTacticalPreferences] = useState<((auto:boolean,speed:1|2)=>void)|null>(null);
  const [completeTacticalBattle, setCompleteTacticalBattle] = useState<((encounterId:TacticalEncounterId,result:BattleResult,rounds:number,survivingAllies:number,damageTaken:number,companions:[CompanionId,CompanionId])=>void)|null>(null);
  const [selectWeeklyFocus, setSelectWeeklyFocus] = useState<((focus:WeeklyFocusId)=>void)|null>(null);
  const [completeWeeklyFocus, setCompleteWeeklyFocus] = useState<(()=>void)|null>(null);
  const [advanceWeek, setAdvanceWeek] = useState<(()=>void)|null>(null);

  const captureNavigate = useCallback((next: (screen: Screen) => void) => setNavigate(() => next), []);
  const captureClaimAchievement = useCallback((next: (achievement: AchievementId) => void) => setClaimAchievement(() => next), []);
  const captureOuting = useCallback((next: (location: OutingLocationId) => void) => setGoOuting(() => next), []);
  const captureGift = useCallback((next: (item: GiftItemId) => void) => setGiveGift(() => next), []);
  const captureAttendance = useCallback((next: () => void) => setClaimAttendance(() => next), []);
  const captureMail = useCallback((next: (mail: MailRewardId) => void) => setClaimMail(() => next), []);
  const captureMonthlyFocus = useCallback((next: (focus: GameState['monthlyFocus']) => void) => setSetMonthlyFocus(() => next), []);
  const captureYearlyAmbition = useCallback((next: (ambition: YearlyAmbitionId) => void) => setSetYearlyAmbition(() => next), []);
  const captureGuardianCalling = useCallback((next: (calling: GuardianCallingId) => void) => setSetGuardianCalling(() => next), []);
  const captureGrowthTrait = useCallback((next: (trait: GrowthTraitId) => void) => setPurchaseGrowthTrait(() => next), []);
  const captureSeasonPurchase = useCallback((next: (offer: SeasonShopOfferId) => void) => setPurchaseSeasonOffer(() => next), []);
  const captureSeasonLegacyUnlock = useCallback((next: (nodeId: SeasonLegacyNodeId) => void) => setUnlockSeasonLegacyNode(() => next), []);
  const captureSanctuaryUpgrade = useCallback((next: (facility: SanctuaryFacilityId) => void) => setUpgradeSanctuary(() => next), []);
  const captureSanctuarySpecialization = useCallback((next: (specialization: SanctuarySpecializationId) => void) => setSelectSanctuarySpecialization(() => next), []);
  const captureSanctuaryMasterwork = useCallback((next: (masterwork: SanctuaryMasterworkId) => void) => setBuildSanctuaryMasterwork(() => next), []);
  const captureAstralRiftClear = useCallback((next: (riftId: AstralRiftId, intensity: AstralRiftIntensity) => void) => setClearAstralRift(() => next), []);
  const captureAstralRiftRelic = useCallback((next: (relicId: AstralRiftRelicId) => void) => setPurchaseAstralRiftRelic(() => next), []);
  const captureExpeditionFinish = useCallback((next: (stageId: ExpeditionStageId, score: number, fatigueDelta: number, stressDelta: number, actionKinds: ExpeditionActionCounts) => void) => setFinishExpedition(() => next), []);
  const captureExpeditionEquip = useCallback((next: (relic: ExpeditionRelicId) => void) => setEquipExpedition(() => next), []);
  const captureExpeditionUnequip = useCallback((next: (relic: ExpeditionRelicId) => void) => setUnequipExpedition(() => next), []);
  const captureExpeditionCraft = useCallback((next: (recipe: ExpeditionCraftingRecipeId) => void) => setCraftExpedition(() => next), []);
  const captureTacticalParty = useCallback((next:(companions:[CompanionId,CompanionId])=>void)=>setSetTacticalParty(()=>next),[]);
  const captureTacticalPreferences = useCallback((next:(auto:boolean,speed:1|2)=>void)=>setSetTacticalPreferences(()=>next),[]);
  const captureTacticalComplete = useCallback((next:(encounterId:TacticalEncounterId,result:BattleResult,rounds:number,survivingAllies:number,damageTaken:number,companions:[CompanionId,CompanionId])=>void)=>setCompleteTacticalBattle(()=>next),[]);
  const captureWeeklyFocus = useCallback((next:(focus:WeeklyFocusId)=>void)=>setSelectWeeklyFocus(() => next),[]);
  const captureWeeklyComplete = useCallback((next:()=>void)=>setCompleteWeeklyFocus(() => next),[]);
  const captureWeeklyAdvance = useCallback((next:()=>void)=>setAdvanceWeek(() => next),[]);

  const leaveAppScreen = useCallback(() => {
    if (gameState.screen === 'hub') return;
    leavingAppScreenRef.current = true;
    navigate?.('hub');
  }, [gameState.screen, navigate]);

  const openCategory = useCallback((category:MobileContentCategory) => {
    leaveAppScreen();
    dispatchNavigation({type:'OPEN_CATEGORY',category});
  },[leaveAppScreen]);

  const openFeature = useCallback((feature:MobileFeatureId) => {
    const category=categoryForFeature[feature];
    if(feature==='schedule'){
      navigate?.('schedule');
      dispatchNavigation({type:'OPEN_PLAY',category:'life',screen:'schedule'});
      return;
    }
    dispatchNavigation({type:'OPEN_FEATURE',category,feature});
  },[navigate]);

  const handleBack = useCallback(() => {
    const current=navigation.current;
    if(current.kind==='play'&&current.screen!=='tactical'&&current.screen!=='choice_event')leaveAppScreen();
    dispatchNavigation({type:'BACK'});
  },[navigation.current,leaveAppScreen]);

  const handleHome = useCallback(() => {
    leaveAppScreen();
    dispatchNavigation({type:'HOME'});
  },[leaveAppScreen]);

  const handleHomeMenuNavigate = useCallback((id:HomeMenuId)=>openFeature(homeMenuFeatures[id]),[openFeature]);
  const handleClaimAchievement = useCallback((achievement: AchievementId) => claimAchievement?.(achievement), [claimAchievement]);
  const handleOuting = useCallback((location: OutingLocationId) => goOuting?.(location), [goOuting]);
  const handleGift = useCallback((item: GiftItemId) => giveGift?.(item), [giveGift]);
  const handleAttendance = useCallback(() => claimAttendance?.(), [claimAttendance]);
  const handleMail = useCallback((mail: MailRewardId) => claimMail?.(mail), [claimMail]);
  const handleMonthlyFocus = useCallback((focus: GameState['monthlyFocus']) => setMonthlyFocus?.(focus), [setMonthlyFocus]);
  const handleYearlyAmbition = useCallback((ambition: YearlyAmbitionId) => setYearlyAmbition?.(ambition), [setYearlyAmbition]);
  const handleSeasonPurchase = useCallback((offer: SeasonShopOfferId) => purchaseSeasonOffer?.(offer), [purchaseSeasonOffer]);
  const handleSeasonLegacyUnlock = useCallback((nodeId: SeasonLegacyNodeId) => unlockSeasonLegacyNode?.(nodeId), [unlockSeasonLegacyNode]);
  const handleSanctuaryUpgrade = useCallback((facility: SanctuaryFacilityId) => upgradeSanctuary?.(facility), [upgradeSanctuary]);
  const handleSanctuarySpecialization = useCallback((specialization: SanctuarySpecializationId) => selectSanctuarySpecialization?.(specialization), [selectSanctuarySpecialization]);
  const handleSanctuaryMasterwork = useCallback((masterwork: SanctuaryMasterworkId) => buildSanctuaryMasterwork?.(masterwork), [buildSanctuaryMasterwork]);
  const handleAstralRiftClear = useCallback((riftId: AstralRiftId, intensity: AstralRiftIntensity) => clearAstralRift?.(riftId,intensity), [clearAstralRift]);
  const handleAstralRiftRelic = useCallback((relicId: AstralRiftRelicId) => purchaseAstralRiftRelic?.(relicId), [purchaseAstralRiftRelic]);
  const handleWeeklyFocus = useCallback((focus:WeeklyFocusId)=>selectWeeklyFocus?.(focus),[selectWeeklyFocus]);
  const handleCompleteWeek = useCallback(()=>completeWeeklyFocus?.(),[completeWeeklyFocus]);
  const handleAdvanceWeek = useCallback(()=>advanceWeek?.(),[advanceWeek]);

  const notificationCount=useMemo(()=>{
    const mail=new Set(currentAvailableMail(gameState));
    const unclaimedMail=[...mail].filter(id=>!gameState.claimedMailRewards.includes(id)).length;
    const attendance=gameState.claimedAttendanceMonths.includes(attendanceKey(gameState.year,gameState.month))?0:1;
    const eligible=new Set(eligibleAchievements(gameState));
    const achievements=[...eligible].filter(id=>!gameState.claimedAchievements.includes(id)).length;
    return unclaimedMail+attendance+achievements;
  },[gameState]);

  const openNotifications=useCallback(()=>{
    const mail=new Set(currentAvailableMail(gameState));
    if([...mail].some(id=>!gameState.claimedMailRewards.includes(id)))return openFeature('mail');
    if(!gameState.claimedAttendanceMonths.includes(attendanceKey(gameState.year,gameState.month)))return openFeature('attendance');
    const eligible=new Set(eligibleAchievements(gameState));
    if([...eligible].some(id=>!gameState.claimedAchievements.includes(id)))return openFeature('achievements');
    openCategory('life');
  },[gameState,openFeature,openCategory]);

  const handleTacticalPhase=useCallback((phase:TacticalPhase)=>{
    if(phase==='active')dispatchNavigation({type:'OPEN_PLAY',category:'adventure',screen:'tactical'});
    else if(phase==='result')dispatchNavigation({type:'OPEN_FEATURE',category:'adventure',feature:'expedition'});
    else if(navigation.current.kind==='play'&&navigation.current.screen==='tactical')dispatchNavigation({type:'OPEN_FEATURE',category:'adventure',feature:'expedition'});
  },[navigation.current]);

  useEffect(()=>{
    if(leavingAppScreenRef.current){
      if(gameState.screen==='hub')leavingAppScreenRef.current=false;
      return;
    }
    const route=appScreenRoutes[gameState.screen];
    if(route){
      const current=navigation.current;
      if(current.kind!=='play'||current.screen!==route.screen){
        dispatchNavigation({type:'OPEN_PLAY',category:route.category,screen:route.screen});
      }
      return;
    }
    if(gameState.screen==='hub'&&navigation.current.kind==='play'&&navigation.current.screen!=='tactical'&&navigation.current.screen!=='choice_event'){
      dispatchNavigation({type:'HOME'});
    }
  },[gameState.screen,navigation.current]);

  const guarded=isGuardedActiveRoute(navigation.current);
  const normalAppPlay=gameState.screen==='schedule'||gameState.screen==='result';
  const guardedAppPlay=gameState.screen==='training'||gameState.screen==='dialogue';

  const confirmExit=useCallback(()=>{
    const target=pendingExit;
    setPendingExit(null);
    if(target==='home')handleHome();
    else if(target==='back')handleBack();
  },[pendingExit,handleHome,handleBack]);

  const renderExpedition = (state:GameState) => <>
    <GuardianExpeditionOverlay
      state={state}
      open
      onOpen={()=>undefined}
      onClose={handleBack}
      onFinish={(stageId, score, fatigueDelta, stressDelta, actionKinds) => finishExpedition?.(stageId, score, fatigueDelta, stressDelta, actionKinds)}
      onEquip={relic => equipExpedition?.(relic)}
      onUnequip={relic => unequipExpedition?.(relic)}
      onCraft={recipe => craftExpedition?.(recipe)}
    />
    {setTacticalParty && setTacticalPreferences && completeTacticalBattle && finishExpedition && <TacticalExpeditionFlow
      state={state}
      expeditionOpen
      onSetParty={setTacticalParty}
      onSetPreferences={setTacticalPreferences}
      onComplete={completeTacticalBattle}
      onExpeditionFinish={finishExpedition}
      onExitToHome={()=>{
        navigate?.('hub');
        dispatchNavigation({type:'OPEN_CATEGORY',category:'adventure'});
      }}
      onPhaseChange={handleTacticalPhase}
    />}
  </>;

  const renderFeature = (state:GameState,feature:MobileFeatureId) => {
    if(legacyPageFeatures.has(feature))return <MobileLegacyFeaturePage
      feature={feature}
      state={state}
      onClaimAchievement={handleClaimAchievement}
      onOuting={handleOuting}
      onGift={handleGift}
      onAttendance={handleAttendance}
      onMail={handleMail}
      onMonthlyFocus={handleMonthlyFocus}
    />;
    if(feature==='raising')return <RaisingIdentityOverlay state={state} open onOpen={()=>undefined} onClose={handleBack} onCalling={calling=>setGuardianCalling?.(calling)} onTrait={trait=>purchaseGrowthTrait?.(trait)}/>;
    if(feature==='ambition')return <YearlyAmbitionOverlay state={state} onSelect={handleYearlyAmbition} open onOpenChange={open=>{if(!open)handleBack();}}/>;
    if(feature==='season')return <SeasonLiveOpsOverlay state={state} open onOpen={()=>undefined} onClose={handleBack} onPurchase={handleSeasonPurchase} onLegacyUnlock={handleSeasonLegacyUnlock}/>;
    if(feature==='sanctuary')return <SanctuaryOverlay state={state} open onOpen={()=>undefined} onClose={handleBack} onUpgrade={handleSanctuaryUpgrade} onSpecialization={handleSanctuarySpecialization} onMasterwork={handleSanctuaryMasterwork} onAstralRiftClear={handleAstralRiftClear} onAstralRiftRelic={handleAstralRiftRelic} onConvergenceClear={()=>undefined} onGuardianBoon={()=>undefined}/>;
    if(feature==='world')return <WorldProgressOverlay state={state} open onOpenChange={open=>{if(!open)handleBack();}}/>;
    if(feature==='archive')return <CollectionArchiveOverlay state={state} onNavigate={handleHomeMenuNavigate} onExpedition={()=>openFeature('expedition')} open onOpenChange={open=>{if(!open)handleBack();}}/>;
    if(feature==='expedition')return renderExpedition(state);
    if(feature==='lineage'||feature==='world_chronicle')return <MobileCategoryPage category="records" state={state} onOpenFeature={openFeature} onWeeklyFocus={handleWeeklyFocus} onCompleteWeek={handleCompleteWeek} onAdvanceWeek={handleAdvanceWeek}/>;
    return null;
  };

  const renderRoute = (state:GameState) => {
    const route=navigation.current;
    if(route.kind==='home')return <>
      <LayeredHome
        state={state}
        onSchedule={()=>openFeature('schedule')}
        onClaimAchievement={handleClaimAchievement}
        onOuting={handleOuting}
        onGift={handleGift}
        onAttendance={handleAttendance}
        onMail={handleMail}
        onMonthlyFocus={handleMonthlyFocus}
        onWeeklyFocus={handleWeeklyFocus}
        onCompleteWeek={handleCompleteWeek}
        onAdvanceWeek={handleAdvanceWeek}
        onExpedition={()=>openFeature('expedition')}
        onSeason={()=>openFeature('season')}
        onMenuNavigate={handleHomeMenuNavigate}
        onWeeklyPlannerNavigate={()=>openCategory('life')}
      />
      <SeasonalHomeBadge month={state.month} stamps={state.seasonStamps}/>
      <YearEndCeremonyOverlay state={state}/>
    </>;
    if(route.kind==='category')return <MobileCategoryPage category={route.category} state={state} onOpenFeature={openFeature} onWeeklyFocus={handleWeeklyFocus} onCompleteWeek={handleCompleteWeek} onAdvanceWeek={handleAdvanceWeek}/>;
    if(route.kind==='feature')return renderFeature(state,route.feature);
    if(route.screen==='tactical')return renderExpedition(state);
    return null;
  };

  return <>
    <div className={`v8-app-host${normalAppPlay?' is-normal-play':''}${guardedAppPlay?' is-guarded-play':''}`}>
      <App
        onStateChange={setGameState}
        onNavigateReady={captureNavigate}
        onClaimAchievementReady={captureClaimAchievement}
        onOutingReady={captureOuting}
        onGiftReady={captureGift}
        onAttendanceReady={captureAttendance}
        onMailReady={captureMail}
        onMonthlyFocusReady={captureMonthlyFocus}
        onYearlyAmbitionReady={captureYearlyAmbition}
        onExpeditionFinishReady={captureExpeditionFinish}
        onExpeditionEquipReady={captureExpeditionEquip}
        onExpeditionUnequipReady={captureExpeditionUnequip}
        onExpeditionCraftReady={captureExpeditionCraft}
        onGuardianCallingReady={captureGuardianCalling}
        onGrowthTraitReady={captureGrowthTrait}
        onSeasonPurchaseReady={captureSeasonPurchase}
        onSeasonLegacyUnlockReady={captureSeasonLegacyUnlock}
        onSanctuaryUpgradeReady={captureSanctuaryUpgrade}
        onSanctuarySpecializationReady={captureSanctuarySpecialization}
        onSanctuaryMasterworkReady={captureSanctuaryMasterwork}
        onAstralRiftClearReady={captureAstralRiftClear}
        onAstralRiftRelicReady={captureAstralRiftRelic}
        onTacticalPartyReady={captureTacticalParty}
        onTacticalPreferencesReady={captureTacticalPreferences}
        onTacticalCompleteReady={captureTacticalComplete}
        onWeeklyFocusReady={captureWeeklyFocus}
        onWeeklyCompleteReady={captureWeeklyComplete}
        onWeeklyAdvanceReady={captureWeeklyAdvance}
      />
    </div>
    <MobileRouterChrome
      state={gameState}
      navigation={navigation}
      guarded={guarded}
      pendingExit={pendingExit}
      onCategory={category=>category==='home'?handleHome():openCategory(category)}
      onBack={handleBack}
      onHome={handleHome}
      onRequestExit={setPendingExit}
      onCancelExit={()=>setPendingExit(null)}
      onConfirmExit={confirmExit}
      notificationCount={notificationCount}
      onNotifications={openNotifications}
    >
      {renderRoute(gameState)}
    </MobileRouterChrome>
  </>;
}