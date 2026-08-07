import { useCallback, useState } from 'react';
import App from './App';
import LayeredHome from './LayeredHome';
import { initialState, type AchievementId, type GameState, type Screen } from './game';
import './layered-home.css';
import './home-panels.css';

export default function Root() {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [navigate, setNavigate] = useState<((screen: Screen) => void) | null>(null);
  const [claimAchievement, setClaimAchievement] = useState<((achievement: AchievementId) => void) | null>(null);

  const captureNavigate = useCallback((nextNavigate: (screen: Screen) => void) => {
    setNavigate(() => nextNavigate);
  }, []);

  const captureClaimAchievement = useCallback((nextClaim: (achievement: AchievementId) => void) => {
    setClaimAchievement(() => nextClaim);
  }, []);

  const openSchedule = useCallback(() => {
    navigate?.('schedule');
  }, [navigate]);

  const handleClaimAchievement = useCallback((achievement: AchievementId) => {
    claimAchievement?.(achievement);
  }, [claimAchievement]);

  return <>
    <App
      onStateChange={setGameState}
      onNavigateReady={captureNavigate}
      onClaimAchievementReady={captureClaimAchievement}
    />
    {gameState.screen === 'hub' && <LayeredHome state={gameState} onSchedule={openSchedule} onClaimAchievement={handleClaimAchievement} />}
  </>;
}
