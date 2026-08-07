import { useCallback, useState } from 'react';
import App from './App';
import LayeredHome from './LayeredHome';
import { initialState, type GameState, type Screen } from './game';
import './layered-home.css';
import './home-panels.css';

export default function Root() {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [navigate, setNavigate] = useState<((screen: Screen) => void) | null>(null);

  const captureNavigate = useCallback((nextNavigate: (screen: Screen) => void) => {
    setNavigate(() => nextNavigate);
  }, []);

  const openSchedule = useCallback(() => {
    navigate?.('schedule');
  }, [navigate]);

  return <>
    <App onStateChange={setGameState} onNavigateReady={captureNavigate} />
    {gameState.screen === 'hub' && <LayeredHome state={gameState} onSchedule={openSchedule} />}
  </>;
}
