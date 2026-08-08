import { useCallback, useState } from 'react';
import type { GiftItemId, OutingLocationId } from './adventure';
import App from './App';
import CollectionArchiveOverlay from './CollectionArchiveOverlay';
import LayeredHome from './LayeredHome';
import SeasonalHomeBadge from './SeasonalHomeBadge';
import YearEndCeremonyOverlay from './YearEndCeremonyOverlay';
import YearlyAmbitionOverlay from './YearlyAmbitionOverlay';
import { initialState, type AchievementId, type GameState, type MailRewardId, type Screen, type YearlyAmbitionId } from './game';
import type { HomeMenuId } from './home-panels';
import './layered-home.css';
import './home-panels.css';
import './seasonal-home.css';
import './collection-archive.css';
import './year-end-ceremony.css';
import './yearly-ambition.css';

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
  const [openHomeMenu, setOpenHomeMenu] = useState<((id: HomeMenuId) => void) | null>(null);

  const captureNavigate = useCallback((nextNavigate: (screen: Screen) => void) => setNavigate(() => nextNavigate), []);
  const captureClaimAchievement = useCallback((nextClaim: (achievement: AchievementId) => void) => setClaimAchievement(() => nextClaim), []);
  const captureOuting = useCallback((nextOuting: (location: OutingLocationId) => void) => setGoOuting(() => nextOuting), []);
  const captureGift = useCallback((nextGift: (item: GiftItemId) => void) => setGiveGift(() => nextGift), []);
  const captureAttendance = useCallback((nextClaim: () => void) => setClaimAttendance(() => nextClaim), []);
  const captureMail = useCallback((nextClaim: (mail: MailRewardId) => void) => setClaimMail(() => nextClaim), []);
  const captureMonthlyFocus = useCallback((nextSetFocus: (focus: GameState['monthlyFocus']) => void) => setSetMonthlyFocus(() => nextSetFocus), []);
  const captureYearlyAmbition = useCallback((nextSetAmbition: (ambition: YearlyAmbitionId) => void) => setSetYearlyAmbition(() => nextSetAmbition), []);
  const captureHomeMenu = useCallback((nextOpenMenu: (id: HomeMenuId) => void) => setOpenHomeMenu(() => nextOpenMenu), []);

  const openSchedule = useCallback(() => navigate?.('schedule'), [navigate]);
  const handleClaimAchievement = useCallback((achievement: AchievementId) => claimAchievement?.(achievement), [claimAchievement]);
  const handleOuting = useCallback((location: OutingLocationId) => goOuting?.(location), [goOuting]);
  const handleGift = useCallback((item: GiftItemId) => giveGift?.(item), [giveGift]);
  const handleAttendance = useCallback(() => claimAttendance?.(), [claimAttendance]);
  const handleMail = useCallback((mail: MailRewardId) => claimMail?.(mail), [claimMail]);
  const handleMonthlyFocus = useCallback((focus: GameState['monthlyFocus']) => setMonthlyFocus?.(focus), [setMonthlyFocus]);
  const handleYearlyAmbition = useCallback((ambition: YearlyAmbitionId) => setYearlyAmbition?.(ambition), [setYearlyAmbition]);
  const handleArchiveNavigate = useCallback((id: HomeMenuId) => openHomeMenu?.(id), [openHomeMenu]);

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
        onMenuReady={captureHomeMenu}
      />
      <SeasonalHomeBadge month={gameState.month} stamps={gameState.seasonStamps} />
      <YearlyAmbitionOverlay state={gameState} onSelect={handleYearlyAmbition} />
      <CollectionArchiveOverlay state={gameState} onNavigate={handleArchiveNavigate} />
      <YearEndCeremonyOverlay state={gameState} />
    </>}
  </>;
}
