import { useMemo, useState } from 'react';
import { currentGuardianStatus, unlockedSkills, type GameState } from './game';
import { ambitionDisplay } from './yearly-ambition-display';
import { currentYearAmbitionRecord } from './yearly-ambition-progress';
import { ambitionRecommendation } from './yearly-ambition-recommendation';
import { ambitionDefinitions, ambitionProgress, type YearlyAmbitionId } from './yearly-ambitions';

export default function YearlyAmbitionOverlay({ state, onSelect }: { state: GameState; onSelect: (ambition: YearlyAmbitionId) => void }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const selected = state.yearlyAmbitions[state.year] ?? null;
  const definition = selected ? ambitionDefinitions.find(item => item.id === selected) ?? null : null;
  const liveRecord = useMemo(() => currentYearAmbitionRecord({
    year: state.year,
    annualRecords: state.annualRecords,
    cumulative: {
      trainings: state.careerRecords.trainings,
      outings: state.careerRecords.outings,
      gifts: state.careerRecords.gifts,
      sGrades: state.careerRecords.sGrades,
      bestScore: state.careerRecords.bestScore,
      memories: state.memories.length,
      skills: unlockedSkills(state).length,
      discoveries: state.discoveries.length,
      seasonStamps: state.seasonStamps.length,
      guardianRank: currentGuardianStatus(state).rank,
    },
  }), [state]);
  const progress = selected ? ambitionProgress(selected, liveRecord) : null;
  const recommendation = selected ? ambitionRecommendation(selected, state.condition) : null;
  const display = ambitionDisplay(definition, progress);
  const chooserOpen = !selected;

  const choose = (ambition: YearlyAmbitionId) => {
    onSelect(ambition);
    setDetailsOpen(false);
  };

  return <>
    <button className={`yearly-ambition-card yearly-ambition-${display.mode}`} onClick={() => selected && setDetailsOpen(true)} aria-label={`${state.year}년차 올해의 야망 ${display.label}`}>
      <img src="/ui/info_card_frame.png" alt="" draggable={false} />
      <div>
        <small>YEARLY AMBITION</small>
        <strong>{display.label}</strong>
        <span>{display.detail}</span>
        {progress && <i><em style={{ width: `${progress.percent}%` }} /></i>}
        {recommendation && <em className="yearly-ambition-quick">추천 · {recommendation.label}</em>}
      </div>
    </button>

    {(chooserOpen || detailsOpen) && <div className="yearly-ambition-backdrop" onClick={() => selected && setDetailsOpen(false)}>
      <section className="yearly-ambition-panel" role="dialog" aria-modal="true" aria-label={`${state.year}년차 올해의 야망`} onClick={event => event.stopPropagation()}>
        <img className="yearly-ambition-frame" src="/ui/popup_panel_frame.png" alt="" draggable={false} />
        <div className="yearly-ambition-content">
          {selected && <button className="yearly-ambition-close" onClick={() => setDetailsOpen(false)} aria-label="닫기">×</button>}
          <small>YEAR {state.year} · GUARDIAN AMBITION</small>
          <h2>{selected ? '올해의 야망' : '올해 어떤 루나를 키울까요?'}</h2>
          <p>{selected ? '선택한 야망은 이 해가 끝날 때까지 유지됩니다.' : '한 해 동안 집중할 성장 방향을 하나 선택하세요.'}</p>
          {selected && recommendation && <div className="yearly-ambition-recommendation">
            <small>NEXT RECOMMENDED ACTION</small>
            <b>{recommendation.label}</b>
            <span>{recommendation.reason}</span>
          </div>}
          <div className="yearly-ambition-options">
            {ambitionDefinitions.map(item => {
              const itemProgress = selected === item.id ? progress : null;
              const active = selected === item.id;
              return <button key={item.id} className={active ? 'active' : ''} disabled={Boolean(selected && !active)} onClick={() => !selected && choose(item.id)}>
                <b>{item.label}</b>
                <span>{item.description}</span>
                {itemProgress && <><i><em style={{ width: `${itemProgress.percent}%` }} /></i><small>{itemProgress.current} / {itemProgress.target} · {itemProgress.complete ? '달성 완료' : `${itemProgress.percent}%`}</small></>}
              </button>;
            })}
          </div>
          {!selected && <em className="yearly-ambition-note">선택 후에는 다음 해가 될 때까지 변경할 수 없어요.</em>}
        </div>
      </section>
    </div>}
  </>;
}
