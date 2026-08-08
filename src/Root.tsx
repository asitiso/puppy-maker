import { useCallback, useState } from 'react';
import type { GiftItemId, OutingLocationId } from './adventure';
import App from './App';
import LayeredHome from './LayeredHome';
import { initialState, type AchievementId, type GameState, type Screen } from './game';
import './layered-home.css';
import './home-panels.css';

export default function Root() {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [navigate, setNavigate] = useState<((screen: Screen) => void) | null>(null);
  const [claimAchievement, setClaimAchievement] = useState<((achievement: AchievementId) => void) | null>(null);
  const [goOuting, setGoOuting] = useState<((location: OutingLocationId) => void) | null>(null);
  const [giveGift, setGiveGift] = useState<((item: GiftItemId) => void) | null>(null);
  const [claimAttendance, setClaimAttendance] = useState<(() => void) | null>(null);

  const captureNavigate = useCallback((nextNavigate: (screen: Screen) => void) => setNavigate(() => nextNavigate), []);
  const captureClaimAchievement = useCallback((nextClaim: (achievement: AchievementId) => void) => setClaimAchievement(() => nextClaim), []);
  const captureOuting = useCallback((nextOuting: (location: OutingLocationId) => void) => setGoOuting(() => nextOuting), []);
  const captureGift = useCallback((nextGift: (item: GiftItemId) => void) => setGiveGift(() => nextGift), []);
  const captureAttendance = useCallback((nextClaim: () => void) => setClaimAttendance(() => nextClaim), []);

  const openSchedule = useCallback(() => navigate?.('schedule'), [navigate]);
  const handleClaimAchievement = useCallback((achievement: AchievementId) => claimAchievement?.(achievement), [claimAchievement]);
  const handleOuting = useCallback((location: OutingLocationId) => goOuting?.(location), [goOuting]);
  const handleGift = useCallback((item: GiftItemId) => giveGift?.(item), [giveGift]);
  const handleAttendance = useCallback(() => claimAttendance?.(), [claimAttendance]);

  return <>
    <App
      onStateChange={setGameState}
      onNavigateReady={captureNavigate}
      onClaimAchievementReady={captureClaimAchievement}
      onOutingReady={captureOuting}
      onGiftReady={captureGift}
      onAttendanceReady={captureAttendance}
    />
    {gameState.screen === 'hub' && <LayeredHome
      state={gameState}
      onSchedule={openSchedule}
      onClaimAchievement={handleClaimAchievement}
      onOuting={handleOuting}
      onGift={handleGift}
      onAttendance={handleAttendance}
    />}
  </>;
}
