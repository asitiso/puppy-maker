import React from 'react';
import ReactDOM from 'react-dom/client';
import Root from './Root';
import ProductionErrorBoundary from './ProductionErrorBoundary';
import { installClientObservability } from './client-observability';
import './styles.css';
import './lobby-art.css';
import './schedule-synergy.css';
import './celestial-ascension.css';
import './production-safety.css';
import './mobile-v11-information.css';

installClientObservability();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ProductionErrorBoundary><Root /></ProductionErrorBoundary>
  </React.StrictMode>
);
