import { useState } from 'react';
import { annualHonor } from './annual-honors';
import { annualRecordHeadline } from './annual-record-summary';
import { collectionArchive } from './collection-archive';
import { archiveRank } from './collection-archive-rank';
import { currentAdvancedTalents, currentCareerTitles, currentStoryChapters, type GameState } from './game';
import { guardianLegacy } from './guardian-legacy';
import { legacyRelicDefinitions, unlockedLegacyRelics } from './legacy-relics';
import { readAmbitionSelections } from './yearly-ambition-selection';
import { ambitionStreak, ambitionStreakHonor, ambitionStreakHonors } from './yearly-ambition-streak';

const ambitionStorageKey = 'puppy-maker-yearly-ambitions';

function storedAmbitions() {
  try {
    return readAmbitionSelections(JSON.parse(localStorage.getItem(ambitionStorageKey) || '{}'));
  } catch {
    return {};
  }
}

export default function CollectionArchiveOverlay({ state }: { state: GameState }) {
  const [open, setOpen] = useState(false);
  const unlockedRelics = new Set(unlockedLegacyRelics(state.annualRecords));
  const streak = ambitionStreak(state.annualRecords, storedAmbitions());
  const unlockedAmbitionHonors = ambitionStreakHonors.filter(honor => streak >= honor.required);
  const archive = collectionArchive({
    memories: state.memories.length,
    discoveries: state.discoveries.length,
    stories: currentStoryChapters(state).length,
    talents: currentAdvancedTalents(state).length,
    titles: currentCareerTitles(state).length,
    seasonStamps: state.seasonStamps.length,
    legacyRelics: unlockedRelics.size,
    ambitionHonors: unlockedAmbitionHonors.length,
  });
  const archiveStatus = archiveRank(archive.current);
  const legacy = guardianLegacy(state.annualRecords);
  const streakHonor = ambitionStreakHonor(streak);

  return <>
    <button
      className="collection-archive-trigger"
      onClick={() => setOpen(true)}
      aria-label={`성장 도감 ${archive.percent}% 완성 · ${archiveStatus.label}`}
    />
    {open && <div className="collection-archive-backdrop" onClick={() => setOpen(false)}>
      <section className="collection-archive-panel" role="dialog" aria-modal="true" aria-label="성장 도감" onClick={event => event.stopPropagation()}>
        <img className="collection-archive-frame" src="/ui/popup_panel_frame.png" alt="" draggable={false} />
        <div className="collection-archive-content">
          <button className="collection-archive-close" onClick={() => setOpen(false)} aria-label="닫기">×</button>
          <small>GROWTH ARCHIVE · 50 SLOTS</small>
          <h2>성장 도감</h2>
          <div className={`archive-rank-card archive-rank-${archiveStatus.id}`}>
            <span>ARCHIVE RANK</span>
            <strong>{archiveStatus.label}</strong>
            <b>{archive.current} / 50</b>
            <p>{archiveStatus.description}</p>
            <small>{archiveStatus.next ? `다음 ${archiveStatus.next.label}까지 ${archiveStatus.next.remaining}칸` : '50슬롯 완성 · 최종 명예 달성'}</small>
          </div>
          <div className="legacy-card">
            <span>GUARDIAN LEGACY</span>
            <strong>{legacy.label}</strong>
            <b>{legacy.points} LEGACY</b>
            <p>{legacy.description}</p>
            <small>{legacy.next ? `다음 ${legacy.next.label}까지 ${legacy.next.remaining}점` : '최고 레거시 등급 달성'}</small>
            <div className="legacy-ambition-streak">
              <b>야망 연속 {streak}년</b>
              <span>{streakHonor ? `✦ ${streakHonor.label}` : '2년 연속 달성부터 명예 휘장이 열려요.'}</span>
            </div>
          </div>
          <div className="collection-archive-total"><strong>{archive.percent}%</strong><span>{archive.current} / {archive.total} 수집</span></div>
          <div className="collection-archive-list">
            {archive.categories.map(category => <div key={category.id}>
              <span>{category.label}</span>
              <b>{category.current} / {category.total}</b>
              <i><em style={{ width: `${Math.round((category.current / category.total) * 100)}%` }} /></i>
            </div>)}
          </div>
          <div className="ambition-honors">
            <h3>야망 명예 휘장</h3>
            <p>한 해의 목표를 연속으로 완수해 수호자의 약속을 증명하세요.</p>
            {ambitionStreakHonors.map((honor, index) => {
              const unlocked = streak >= honor.required;
              return <article key={honor.id} className={unlocked ? 'is-unlocked' : ''}>
                <span>{unlocked ? '✦' : index + 1}</span>
                <b>{unlocked ? honor.label : `${honor.required}년 연속 야망 완수`}<small>{honor.description}</small></b>
                <i>{unlocked ? '획득' : `${Math.min(streak, honor.required)} / ${honor.required}`}</i>
              </article>;
            })}
          </div>
          <div className="legacy-relics">
            <h3>레거시 유물</h3>
            {legacyRelicDefinitions.map((relic, index) => {
              const unlocked = unlockedRelics.has(relic.id);
              return <article key={relic.id} className={unlocked ? 'is-unlocked' : ''}>
                <span>{unlocked ? '✦' : index + 1}</span>
                <b>{unlocked ? relic.label : '미발견 유물'}<small>{relic.description}</small></b>
                <i>{unlocked ? '획득' : '도전 중'}</i>
              </article>;
            })}
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
          <p>50개의 성장 흔적을 완성하면 루나와 보낸 시간 전체가 하나의 수호 연대기로 남습니다.</p>
        </div>
      </section>
    </div>}
  </>;
}
