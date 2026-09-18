import React from 'react';
import ReactDOM from 'react-dom/client';
import Root from './Root';
import FifthPathJourneyFlow from './FifthPathJourneyFlow';
import ProductionErrorBoundary from './ProductionErrorBoundary';
import { installClientObservability } from './client-observability';
import './styles.css';
import './lobby-art.css';
import './schedule-synergy.css';
import './celestial-ascension.css';
import './production-safety.css';
import './mobile-v11-information.css';
import './mobile-v12-loadout.css';
import './v14-polish-pass-4.css';

installClientObservability();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ProductionErrorBoundary>
      <Root />
      <FifthPathJourneyFlow
        winterOutcome="costly_victory"
        worldSignals={['서로 다른 길의 선택들이 하나의 세계에 함께 흔적을 남겼어요.']}
        bondSignals={['리라는 반복보다 함께 만든 선택을 기억하려 해요.']}
      />
    </ProductionErrorBoundary>
  </React.StrictMode>
);
