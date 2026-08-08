import { useState } from 'react';
import { annualHonor } from './annual-honors';
import { annualRecordHeadline } from './annual-record-summary';
import type { GameState } from './game';
import { guardianLegacy } from './guardian-legacy';
import { ceremonyRecord, shouldShowYearEndCeremony } from './year-end-ceremony';

const storageKey = 'puppy-maker-year-ceremonies';

function storedAcknowledgements(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export default function YearEndCeremonyOverlay({ state }: { state: GameState }) {
  const [acknowledged, setAcknowledged] = useState<string[]>(storedAcknowledgements);
  const record = ceremonyRecord(state);
  const visible = record ? shouldShowYearEndCeremony(state, acknowledged) : false;
  if (!record || !visible) return null;

  const honor = annualHonor(record);
  const legacy = guardianLegacy(state.annualRecords);
  const close = () => {
    const next = [...new Set([...acknowledged, record.id])];
    setAcknowledged(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* storage unavailable */ }
  };

  return <div className="year-end-backdrop" role="presentation">
    <section className="year-end-panel" role="dialog" aria-modal="true" aria-label={`${record.year}년차 수호식`}>
      <img className="year-end-frame" src="/ui/popup_panel_frame.png" alt="" draggable={false} />
      <img className="year-end-burst" src="/assets/effects/success_burst.png" alt="" draggable={false} />
      <div className="year-end-content">
        <small>GUARDIAN CEREMONY</small>
        <h2>{record.year}년차 수호식</h2>
        <p>루나와 함께한 한 해의 기록이 연대기에 새겨졌어요.</p>
        <strong className="year-end-honor">✦ {honor.label}</strong>
        <span>{honor.description}</span>
        <div className="year-end-headline">{annualRecordHeadline(record)}</div>
        <div className="year-end-stats">
          <b>훈련 <i>{record.trainings}</i></b><b>외출 <i>{record.outings}</i></b><b>S등급 <i>{record.sGrades}</i></b>
          <b>기억 <i>{record.memories}</i></b><b>발견 <i>{record.discoveries}</i></b><b>인장 <i>{record.seasonStamps}/4</i></b>
        </div>
        <div className="year-end-legacy"><small>현재 레거시</small><strong>{legacy.label}</strong><b>{legacy.points} LEGACY</b></div>
        <button onClick={close}>새로운 해 시작</button>
      </div>
    </section>
  </div>;
}
