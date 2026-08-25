import { useCallback, useState } from 'react';
import type { GiftItemId, OutingLocationId } from './adventure';
import App from './App';
import CollectionArchiveOverlay from './CollectionArchiveOverlay';
import GuardianExpeditionOverlay from './GuardianExpeditionOverlay';
import LayeredHome from './LayeredHome';
import RaisingIdentityOverlay from './RaisingIdentityOverlay';
import SanctuaryOverlay from './SanctuaryOverlay';
import SeasonalHomeBadge from './SeasonalHomeBadge';
import SeasonLiveOpsOverlay from './SeasonLiveOpsOverlay';
import TacticalExpeditionFlow from './TacticalExpeditionFlow';
import WorldProgressOverlay from './WorldProgressOverlay';
import YearEndCeremonyOverlay from './YearEndCeremonyOverlay';
import YearlyAmbitionOverlay from './YearlyAmbitionOverlay';
import type { AstralRiftId, AstralRiftIntensity } from './astral-rift';
import type { AstralRiftRelicId } from './astral-rift-relics';
import type { BattleResult } from './tactical-battle';
import type { CompanionId } from './tactical-companions';
import type { TacticalEncounterId } from './tactical-encounters';
import {
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

export default function Root() {
  const [gameState, setGameState] = useState<GameState>(initialState);
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
  const [openHomeMenu, setOpenHomeMenu] = useState<((id: HomeMenuId) => void) | null>(null);
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
  const [expeditionOpen, setExpeditionOpen] = useState(false);
  const [raisingOpen, setRaisingOpen] = useState(false);
  const [seasonLiveOpen, setSeasonLiveOpen] = useState(false);
  const [sanctuaryOpen, setSanctuaryOpen] = useState(false);

  const captureNavigate = useCallback((nextNavigate: (screen: Screen) => void) => setNavigate(() => nextNavigate), []);
  const captureClaimAchievement = useCallback((nextClaim: (achievement: AchievementId) => void) => setClaimAchievement(() => nextClaim), []);
  const captureOuting = useCallback((nextOuting: (location: OutingLocationId) => void) => setGoOuting(() => nextOuting), []);
  const captureGift = useCallback((nextGift: (item: GiftItemId) => void) => setGiveGift(() => nextGift), []);
  const captureAttendance = useCallback((nextClaim: () => void) => setClaimAttendance(() => nextClaim), []);
  const captureMail = useCallback((nextClaim: (mail: MailRewardId) => void) => setClaimMail(() => nextClaim), []);
  const captureMonthlyFocus = useCallback((nextSetFocus: (focus: GameState['monthlyFocus']) => void) => setSetMonthlyFocus(() => nextSetFocus), []);
  const captureYearlyAmbition = useCallback((nextSetAmbition: (ambition: YearlyAmbitionId) => void) => setSetYearlyAmbition(() => nextSetAmbition), []);
  const captureGuardianCalling = useCallback((nextSetCalling: (calling: GuardianCallingId) => void) => setSetGuardianCalling(() => nextSetCalling), []);
  const captureGrowthTrait = useCallback((nextPurchaseTrait: (trait: GrowthTraitId) => void) => setPurchaseGrowthTrait(() => nextPurchaseTrait), []);
  const captureSeasonPurchase = useCallback((nextPurchase: (offer: SeasonShopOfferId) => void) => setPurchaseSeasonOffer(() => nextPurchase), []);
  const captureSeasonLegacyUnlock = useCallback((nextUnlock: (nodeId: SeasonLegacyNodeId) => void) => setUnlockSeasonLegacyNode(() => nextUnlock), []);
  const captureSanctuaryUpgrade = useCallback((nextUpgrade: (facility: SanctuaryFacilityId) => void) => setUpgradeSanctuary(() => nextUpgrade), []);
  const captureSanctuarySpecialization = useCallback((nextSelect: (specialization: SanctuarySpecializationId) => void) => setSelectSanctuarySpecialization(() => nextSelect), []);
  const captureSanctuaryMasterwork = useCallback((nextBuild: (masterwork: SanctuaryMasterworkId) => void) => setBuildSanctuaryMasterwork(() => nextBuild), []);
  const captureAstralRiftClear = useCallback((nextClear: (riftId: AstralRiftId, intensity: AstralRiftIntensity) => void) => setClearAstralRift(() => nextClear), []);
  const captureAstralRiftRelic = useCallback((nextPurchase: (relicId: AstralRiftRelicId) => void) => setPurchaseAstralRiftRelic(() => nextPurchase), []);
  const captureHomeMenu = useCallback((nextOpenMenu: (id: HomeMenuId) => void) => setOpenHomeMenu(() => nextOpenMenu), []);
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

  const openSchedule = useCallback(() => navigate?.('schedule'), [navigate]);
  const handleClaimAchievement = useCallback((achievement: AchievementId) => claimAchievement?.(achievement), [claimAchievement]);
  const handleOuting = useCallback((location: OutingLocationId) => goOuting?.(location), [goOuting]);
  const handleGift = useCallback((item: GiftItemId) => giveGift?.(item), [giveGift]);
  const handleAttendance = useCallback(() => claimAttendance?.(), [claimAttendance]);
  const handleMail = useCallback((mail: MailRewardId) => claimMail?.(mail), [claimMail]);
  const handleMonthlyFocus = useCallback((focus: GameState['monthlyFocus']) => setMonthlyFocus?.(focus), [setMonthlyFocus]);
  const handleYearlyAmbition = useCallback((ambition: YearlyAmbitionId) => setYearlyAmbition?.(ambition), [setYearlyAmbition]);
  const handleArchiveNavigate = useCallback((id: HomeMenuId) => openHomeMenu?.(id), [openHomeMenu]);
  const handleOpenExpedition = useCallback(() => setExpeditionOpen(true), []);
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

  return <>
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
    {gameState.screen === 'hub' && <>
      <LayeredHome
        state={gameState}
        onSchedule={openSchedule}
        onClaimAchievement={handleClaimAchievement}
        onOuting={handleOuting}
        onGift={handleGift}
        onAttendance={handleAttendance}
        onMail={handleMail}
        onMonthlyFocus={handleMonthlyFocus}
        onWeeklyFocus={handleWeeklyFocus}
        onCompleteWeek={handleCompleteWeek}
        onAdvanceWeek={handleAdvanceWeek}
        onExpedition={handleOpenExpedition}
        onSeason={() => setSeasonLiveOpen(true)}
        onMenuReady={captureHomeMenu}
      />
      <SeasonalHomeBadge month={gameState.month} stamps={gameState.seasonStamps} />
      <SeasonLiveOpsOverlay
        state={gameState}
        open={seasonLiveOpen}
        onOpen={() => setSeasonLiveOpen(true)}
        onClose={() => setSeasonLiveOpen(false)}
        onPurchase={handleSeasonPurchase}
        onLegacyUnlock={handleSeasonLegacyUnlock}
      />
      <SanctuaryOverlay
        state={gameState}
        open={sanctuaryOpen}
        onOpen={() => setSanctuaryOpen(true)}
        onClose={() => setSanctuaryOpen(false)}
        onUpgrade={handleSanctuaryUpgrade}
        onSpecialization={handleSanctuarySpecialization}
        onMasterwork={handleSanctuaryMasterwork}
        onAstralRiftClear={handleAstralRiftClear}
        onAstralRiftRelic={handleAstralRiftRelic}
        onConvergenceClear={() => undefined}
        onGuardianBoon={() => undefined}
      />
      <YearlyAmbitionOverlay state={gameState} onSelect={handleYearlyAmbition} />
      <CollectionArchiveOverlay state={gameState} onNavigate={handleArchiveNavigate} onExpedition={handleOpenExpedition} />
      <WorldProgressOverlay state={gameState} />
      <YearEndCeremonyOverlay state={gameState} />
      <RaisingIdentityOverlay
        state={gameState}
        open={raisingOpen}
        onOpen={() => setRaisingOpen(true)}
        onClose={() => setRaisingOpen(false)}
        onCalling={calling => setGuardianCalling?.(calling)}
        onTrait={trait => purchaseGrowthTrait?.(trait)}
      />
      <GuardianExpeditionOverlay
        state={gameState}
        open={expeditionOpen}
        onOpen={handleOpenExpedition}
        onClose={() => setExpeditionOpen(false)}
        onFinish={(stageId, score, fatigueDelta, stressDelta, actionKinds) => finishExpedition?.(stageId, score, fatigueDelta, stressDelta, actionKinds)}
        onEquip={relic => equipExpedition?.(relic)}
        onUnequip={relic => unequipExpedition?.(relic)}
        onCraft={recipe => craftExpedition?.(recipe)}
      />
      {setTacticalParty && setTacticalPreferences && completeTacticalBattle && finishExpedition && <TacticalExpeditionFlow
        state={gameState}
        expeditionOpen={expeditionOpen}
        onSetParty={setTacticalParty}
        onSetPreferences={setTacticalPreferences}
        onComplete={completeTacticalBattle}
        onExpeditionFinish={finishExpedition}
        onExitToHome={() => setExpeditionOpen(false)}
      />}
    </>}
  </>;
}