import { useState } from 'react';
import { annualHonor } from './annual-honors';
import { annualRecordHeadline } from './annual-record-summary';
import { collectionArchive } from './collection-archive';
import { archiveRank } from './collection-archive-rank';
import { archiveRecommendation } from './collection-archive-recommendation';
import { archiveRecommendationRoute } from './collection-archive-route';
import { expeditionArchiveProgress } from './expedition-archive-progress';
import { currentAdvancedTalents, currentCareerTitles, currentGuardianStatus, currentStoryChapters, type GameState } from './game';
import { guardianLegacy } from './guardian-legacy';
import type { HomeMenuId } from './home-panels';
import { legacyRelicDefinitions, unlockedLegacyRelics } from './legacy-relics';
import { ambitionStreak, ambitionStreakHonor, ambitionStreakHonors } from './yearly-ambition-streak';

const emptyExpeditionArchive = {
  expeditionStages:0,
  expeditionBosses:0,
  expeditionRelics:0,
  expeditionStories:0,
  expeditionDiscoveries:0,
  guardianEvolution:0,
  expeditionCrafting:0,
  expeditionRegions:0,
  expeditionSMilestones:0,
};

type ArchiveView = 'progress' | 'legacy' | 'history';

export default function CollectionArchiveOverlay({
  state,
  onNavigate,
  onExpedition,
  open:controlledOpen,
  onOpenChange,
}: {
  state: GameState;
  onNavigate?: (id: HomeMenuId) => void;
  onExpedition?: () => void;
  open?: boolean;
  onOpenChange?: (open:boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [archiveView, setArchiveView] = useState<ArchiveView>('progress');
  const open = controlledOpen ?? internalOpen;
  const setOpen = (next:boolean) => {
    if (controlledOpen === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };
  const unlockedRelics = new Set(unlockedLegacyRelics(state.annualRecords));
  const streak = ambitionStreak(state.annualRecords, state.yearlyAmbitions);
  const unlockedAmbitionHonors = ambitionStreakHonors.filter(honor => streak >= honor.required);
  const legacy = guardianLegacy(state.annualRecords);
  const guardianStatus = currentGuardianStatus(state);

  const baseInput = {
    memories: state.memories.length,
    discoveries: state.discoveries.length,
    stories: currentStoryChapters(state).length,
    talents: currentAdvancedTalents(state).length,
    titles: currentCareerTitles(state).length,
    seasonStamps: state.seasonStamps.length,
    legacyRelics: unlockedRelics.size,
    ambitionHonors: unlockedAmbitionHonors.length,
  };
  const baseArchive = collectionArchive({ ...baseInput, ...emptyExpeditionArchive });
  const expeditionProgress = expeditionArchiveProgress({
    baseArchiveCurrent: baseArchive.current,
    records: state.expeditionRecords,
    ownedRelics: state.ownedExpeditionRelics,
    storyEntries: state.expeditionStoryEntries,
    discoveries: state.expeditionDiscoveries,
    craftingMilestones: state.craftingMilestones,
    guardianRank: guardianStatus.rank,
    legacyId: legacy.id,
  });
  const archive = collectionArchive({ ...baseInput, ...expeditionProgress });
  const archiveStatus = archiveRank(archive.current);
  const recommendation = archiveRecommendation(archive.categories);
  const recommendationRoute = archiveRecommendationRoute(recommendation.action);
  const homeRoute = recommendationRoute && recommendationRoute !== 'ambition' && recommendationRoute !== 'archive'
    ? recommendationRoute
    : null;
  const streakHonor = ambitionStreakHonor(streak);
  const recommendedCategory = recommendation.categoryId ? archive.categories.find(item => item.id === recommendation.categoryId) ?? null : null;

  const followRecommendation = () => {
    if (recommendation.action === 'expedition') {
      setOpen(false);
      onExpedition?.();
      return;
    }
    if (!homeRoute) return;
    setOpen(false);
    onNavigate?.(homeRoute);
  };

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
          <small>GROWTH ARCHIVE · 100 SLOTS</small>
          <h2>성장 도감</h2>
          <div className={`archive-rank-card archive-rank-${archiveStatus.id}`}>
            <span>ARCHIVE RANK</span>
            <strong>{archiveStatus.label}</strong>
            <b>{archive.current} / 100</b>
            <p>{archiveStatus.description}</p>
            <small>{archiveStatus.next ? `다음 ${archiveStatus.next.label}까지 ${archiveStatus.next.remaining}칸` : '100슬롯 완성 · 최종 명예 달성'}</small>
          </div>
          <div className={`archive-recommendation archive-recommendation-${recommendation.action}`}>
            <span>{recommendation.action === 'complete' ? 'ARCHIVE COMPLETE' : 'NEXT COLLECTION TARGET'}</span>
            <strong>{recommendation.label}</strong>
            <b>{recommendedCategory ? `${recommendedCategory.label} ${recommendedCategory.current} / ${recommendedCategory.total}` : '100 / 100'}</b>
            <p>{recommendation.reason}</p>
            {(homeRoute || recommendation.action === 'expedition') && <button onClick={followRecommendation}>바로 이동</button>}
            {!homeRoute && recommendationRoute === 'ambition' && <small>성장 메뉴의 올해의 야망에서 현재 진행률과 다음 행동을 확인하세요.</small>}
            {!homeRoute && recommendationRoute === 'archive' && <small>연간 수호 기록을 쌓으면 이 도감에서 레거시 유물이 열려요.</small>}
          </div>
          <div className="collection-archive-total"><strong>{archive.percent}%</strong><span>{archive.current} / {archive.total} 수집</span></div>
          <div className="v11-archive-tabs" role="group" aria-label="도감 정보">
            <button type="button" aria-pressed={archiveView === 'progress'} onClick={() => setArchiveView('progress')}>진행 현황</button>
            <button type="button" aria-pressed={archiveView === 'legacy'} onClick={() => setArchiveView('legacy')}>명예 · 유물</button>
            <button type="button" aria-pressed={archiveView === 'history'} onClick={() => setArchiveView('history')}>연간 기록</button>
          </div>

          {archiveView === 'progress' && <div className="v11-archive-section">
            <div className="collection-archive-list">
              {archive.categories.map(category => <div key={category.id} className={category.id === recommendation.categoryId ? 'is-recommended' : ''}>
                <span>{category.label}</span>
                <b>{category.current} / {category.total}</b>
                <i><em style={{ width: `${Math.round((category.current / category.total) * 100)}%` }} /></i>
              </div>)}
            </div>
          </div>}

          {archiveView === 'legacy' && <div className="v11-archive-section">
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
          </div>}

          {archiveView === 'history' && <div className="v11-archive-section annual-records">
            <h3>연간 수호 기록</h3>
            {state.annualRecords.length === 0 ? <p role="status">1년차 12월을 마치면 첫 연간 기록이 남아요.</p> : [...state.annualRecords].reverse().map(record => {
              const honor = annualHonor(record);
              return <article key={record.id}>
                <b>{annualRecordHeadline(record)}</b>
                <strong className="annual-honor">✦ {honor.label}</strong>
                <small>{honor.description}</small>
                <span>훈련 {record.trainings} · 외출 {record.outings} · 선물 {record.gifts} · S등급 {record.sGrades}</span>
                <span>기억 {record.memories} · 기술 {record.skills} · 발견 {record.discoveries} · 계절 인장 {record.seasonStamps}/4</span>
              </article>;
            })}
          </div>}
          <p>100개의 성장과 원정 흔적을 완성하면 루나와 보낸 모든 시간이 하나의 수호 연대기로 남습니다.</p>
        </div>
      </section>
    </div>}
  </>;
}
