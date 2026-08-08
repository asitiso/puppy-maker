import { useState } from 'react';
import { collectionArchive } from './collection-archive';
import { currentAdvancedTalents, currentCareerTitles, currentStoryChapters, type GameState } from './game';
import { guardianRankDefinitions } from './guardian-rank';

export default function CollectionArchiveOverlay({ state }: { state: GameState }) {
  const [open, setOpen] = useState(false);
  const archive = collectionArchive({
    memories: state.memories.length,
    discoveries: state.discoveries.length,
    stories: currentStoryChapters(state).length,
    talents: currentAdvancedTalents(state).length,
    titles: currentCareerTitles(state).length,
    seasonStamps: state.seasonStamps.length,
  });

  return <>
    <button
      className="collection-archive-trigger"
      onClick={() => setOpen(true)}
      aria-label={`성장 도감 ${archive.percent}% 완성`}
    />
    {open && <div className="collection-archive-backdrop" onClick={() => setOpen(false)}>
      <section className="collection-archive-panel" role="dialog" aria-modal="true" aria-label="성장 도감" onClick={event => event.stopPropagation()}>
        <img className="collection-archive-frame" src="/ui/popup_panel_frame.png" alt="" draggable={false} />
        <div className="collection-archive-content">
          <button className="collection-archive-close" onClick={() => setOpen(false)} aria-label="닫기">×</button>
          <small>GROWTH ARCHIVE</small>
          <h2>성장 도감</h2>
          <div className="collection-archive-total"><strong>{archive.percent}%</strong><span>{archive.current} / {archive.total} 수집</span></div>
          <div className="collection-archive-list">
            {archive.categories.map(category => <div key={category.id}>
              <span>{category.label}</span>
              <b>{category.current} / {category.total}</b>
              <i><em style={{ width: `${Math.round((category.current / category.total) * 100)}%` }} /></i>
            </div>)}
          </div>
          <div className="annual-records">
            <h3>연간 수호 기록</h3>
            {state.annualRecords.length === 0 ? <p>1년차 12월을 마치면 첫 연간 기록이 남아요.</p> : [...state.annualRecords].reverse().map(record => {
              const rank = guardianRankDefinitions.find(item => item.id === record.guardianRank)?.label ?? record.guardianRank;
              return <article key={record.id}>
                <b>{record.year}년차 · {rank}</b>
                <span>훈련 {record.trainings} · 외출 {record.outings} · 선물 {record.gifts} · S등급 {record.sGrades}</span>
                <span>BEST {record.bestScore} · 기억 {record.memories} · 발견 {record.discoveries} · 계절 인장 {record.seasonStamps}/4</span>
              </article>;
            })}
          </div>
          <p>훈련·외출·이야기·계절을 이어가며 루나의 성장 기록을 완성하세요.</p>
        </div>
      </section>
    </div>}
  </>;
}
