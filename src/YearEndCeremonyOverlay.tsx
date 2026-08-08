import { useState } from 'react';
import { annualEpilogue } from './annual-epilogues';
import { annualHonor } from './annual-honors';
import { annualRecordHeadline } from './annual-record-summary';
import type { GameState } from './game';
import { guardianLegacy } from './guardian-legacy';
import { newlyUnlockedLegacyRelics } from './legacy-relic-discovery';
import { legacyRelicDefinitions } from './legacy-relics';
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
  const epilogue = annualEpilogue(record);
  const legacy = guardianLegacy(state.annualRecords);
  const newRelics = newlyUnlockedLegacyRelics(state.annualRecords, record.id)
    .map(id => legacyRelicDefinitions.find(item => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
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
        <p className="year-end-epilogue-title">{epilogue.title}</p>
        <p className="year-end-runa">“{epilogue.runaLine}”</p>
        <strong className="year-end-honor">✦ {honor.label}</strong>
        <span>{epilogue.narration}</span>
        <div className="year-end-headline">{annualRecordHeadline(record)}</div>
        {newRelics.length > 0 && <div className="year-end-relics">
          <small>NEW LEGACY RELIC</small>
          {newRelics.map(relic => <div key={relic.id}><b>✦ {relic.label}</b><span>{relic.description}</span></div>)}
        </div>}
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
