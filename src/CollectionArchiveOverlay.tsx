import { useState } from 'react';
import { annualHonor } from './annual-honors';
import { annualRecordHeadline } from './annual-record-summary';
import { collectionArchive } from './collection-archive';
import { currentAdvancedTalents, currentCareerTitles, currentStoryChapters, type GameState } from './game';
import { guardianLegacy } from './guardian-legacy';

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
  const legacy = guardianLegacy(state.annualRecords);

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
          <div className="legacy-card">
            <span>GUARDIAN LEGACY</span>
            <strong>{legacy.label}</strong>
            <b>{legacy.points} LEGACY</b>
            <p>{legacy.description}</p>
            <small>{legacy.next ? `다음 ${legacy.next.label}까지 ${legacy.next.remaining}점` : '최고 레거시 등급 달성'}</small>
          </div>
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
              const honor = annualHonor(record);
              return <article key={record.id}>
                <b>{annualRecordHeadline(record)}</b>
                <strong className="annual-honor">✦ {honor.label}</strong>
                <small>{honor.description}</small>
                <span>훈련 {record.trainings} · 외출 {record.outings} · 선물 {record.gifts} · S등급 {record.sGrades}</span>
                <span>기억 {record.memories} · 기술 {record.skills} · 발견 {record.discoveries} · 계절 인장 {record.seasonStamps}/4</span>
              </article>;
            })}
          </div>
          <p>한 해의 선택이 연간 기록이 되고, 여러 해의 기록은 루나의 레거시가 됩니다.</p>
        </div>
      </section>
    </div>}
  </>;
}
