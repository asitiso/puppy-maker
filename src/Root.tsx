import { useEffect, useState } from 'react';
import App from './App';
import LayeredHome from './LayeredHome';
import './layered-home.css';
import './home-panels.css';

export default function Root() {
  const [showHome, setShowHome] = useState(true);

  useEffect(() => {
    const syncHomeVisibility = () => {
      const isHubVisible = Boolean(document.querySelector('.hub-screen'));
      setShowHome(isHubVisible);
    };

    syncHomeVisibility();

    const observer = new MutationObserver(syncHomeVisibility);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  const openSchedule = () => {
    const scheduleButton = document.querySelector<HTMLButtonElement>('.hub-screen .bottom-nav button');
    scheduleButton?.click();
    setShowHome(false);
  };

  return <>
    <App />
    {showHome && <LayeredHome onSchedule={openSchedule} />}
  </>;
}
