import { useRef } from 'react';
import type { GameState } from './game';
import { liveOpsUiSummary } from './live-ops-ui';
import type { SeasonLegacyNodeId } from './season-legacy-board';
import type { SeasonShopOfferId } from './season-shop';
import { useOverlayFocusManagement } from './useOverlayFocusManagement';

const seasonNames = { spring:'봄', summer:'여름', autumn:'가을', winter:'겨울' } as const;
const milestoneNames = {
  first_keepsake:'첫 계절의 기억',
  four_seasons:'사계절의 추억',
  eight_seasons:'두 해의 계절 연대기',
} as const;
const masteryRewardNames = {
  traveler:'계절 여행자',
  chronicler:'사계절 기록자',
  guardian:'별빛 계절수호자',
  eternal:'영원의 계절수호자',
} as const;
const legacyBranchNames = { chronicle:'연대기', bond:'유대', expedition:'원정' } as const;

export default function SeasonLiveOpsOverlay({
  state,
  open,
  onOpen,
  onClose,
  onPurchase,
  onLegacyUnlock,
}:{
  state:GameState;
  open:boolean;
  onOpen:()=>void;
  onClose:()=>void;
  onPurchase:(offer:SeasonShopOfferId)=>void;
  onLegacyUnlock:(nodeId:SeasonLegacyNodeId)=>void;
}) {
  const launcherRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  useOverlayFocusManagement({ open, onClose, dialogRef, launcherRef, initialFocusRef });

  const summary = liveOpsUiSummary(state);
  const masteryProgress = summary.mastery.nextThreshold
    ? `${summary.mastery.score}/${summary.mastery.nextThreshold}`
    : `${summary.mastery.score} MAX`;
  const lifetimeProgress = summary.lifetimeLegacy.milestone.nextThreshold
    ? `${summary.lifetimeLegacy.points}/${summary.lifetimeLegacy.milestone.nextThreshold}`
    : `${summary.lifetimeLegacy.points} MAX`;

  if (!open) {
    return <button ref={launcherRef} className="season-live-entry" onClick={onOpen} aria-label="시즌 여정 열기">
      <small>SEASON JOURNEY</small>
      <strong>{summary.season.label}</strong>
      <span>{summary.season.score} P · ✦ {summary.season.tokens}</span>
      <em>{summary.mastery.label}</em>
    </button>;
  }

  return <div className="season-live-backdrop" role="presentation" onClick={onClose}>
    <section ref={dialogRef} className="season-live-panel" role="dialog" aria-modal="true" aria-label="시즌 여정" onClick={event => event.stopPropagation()}>
      <img className="season-live-frame" src="/ui/popup_panel_frame.png" alt="" />
      <div className="season-live-content">
        <header>
          <div><small>SEASON JOURNEY</small><h2>{summary.season.label}</h2></div>
          <button ref={initialFocusRef} onClick={onClose} aria-label="닫기">×</button>
        </header>

        <div className="season-mastery-card">
          <div>
            <small>SEASON MASTERY</small>
            <strong>{summary.mastery.label}</strong>
            <span>{summary.mastery.description}</span>
          </div>
          <b>{masteryProgress}</b>
        </div>
        <div className="season-mastery-rewards">
          {summary.masteryRewards.items.map(item => <div className={item.claimed ? 'is-claimed' : item.unlocked ? 'is-unlocked' : ''} key={item.rank}>
            <span>{item.claimed ? '✓' : item.unlocked ? '!' : '○'} {masteryRewardNames[item.rank]}</span>
            <b>{item.reward.gold ? `${item.reward.gold}G` : ''}{item.reward.gold && item.reward.gems ? ' · ' : ''}{item.reward.gems ? `◆${item.reward.gems}` : ''}</b>
          </div>)}
        </div>
        <p className="season-mastery-next">{summary.masteryRewards.next
          ? `다음 Mastery 보상 · ${masteryRewardNames[summary.masteryRewards.next.rank]} ${summary.mastery.score}/${summary.masteryRewards.next.threshold}`
          : '모든 Season Mastery 보상을 획득했어요.'}</p>

        <article className="season-lifetime-legacy-block">
          <div className="season-lifetime-legacy-heading">
            <div><small>LIFETIME LEGACY</small><h3>{summary.lifetimeLegacy.milestone.label}</h3></div>
            <strong>{lifetimeProgress}</strong>
          </div>
          <p>완료한 시즌의 품질과 기념품 기록에서 자동 계산되는 평생 계절 유산이에요. 별도 소비 없이 다음 시즌에 계속 적용됩니다.</p>
          <div className="season-lifetime-bonuses">
            <span>훈련 <b>+{summary.lifetimeLegacy.bonuses.trainingPercent}%</b></span>
            <span>숙련 XP <b>+{summary.lifetimeLegacy.bonuses.masteryXp}</b></span>
            <span>보상 <b>+{summary.lifetimeLegacy.bonuses.rewardPercent}%</b></span>
            <span>초기 컨디션 <b>+{summary.lifetimeLegacy.bonuses.startingCondition}</b></span>
          </div>
          <em>{summary.lifetimeLegacy.completedSeasons}개 시즌 완주 기록 기반</em>
        </article>

        <article className="season-legacy-block">
          <div className="season-legacy-heading">
            <div><small>SEASON LEGACY</small><h3>계절 유산 보드</h3></div>
            <strong>LP {summary.legacy.available} <small>/ {summary.legacy.earned}</small></strong>
          </div>
          <p>완주 시즌과 시즌 명예가 Legacy Point가 됩니다. 해금한 유산은 영구 보존돼요.</p>
          <div className="season-legacy-branches">
            {(Object.keys(legacyBranchNames) as Array<keyof typeof legacyBranchNames>).map(branch => <div className="season-legacy-branch" key={branch}>
              <b>{legacyBranchNames[branch]}</b>
              {summary.legacy.nodes.filter(node => node.branch === branch).map(node => <button
                key={node.id}
                className={node.unlocked ? 'is-unlocked' : node.affordable ? 'is-affordable' : ''}
                disabled={node.unlocked || !node.affordable}
                onClick={() => onLegacyUnlock(node.id)}
              >
                <span><strong>{node.unlocked ? '✓ ' : ''}{node.label}</strong><small>{node.description}</small></span>
                <em>{node.unlocked ? '해금' : `${node.cost} LP`}</em>
                <i>{node.reward.gold ? `${node.reward.gold}G` : ''}{node.reward.gold && node.reward.gems ? ' · ' : ''}{node.reward.gems ? `◆${node.reward.gems}` : ''}</i>
              </button>)}
            </div>)}
          </div>
        </article>

        <div className="season-live-score">
          <div><span>여정 점수</span><b>{summary.season.score}</b></div>
          <div><span>시즌 토큰</span><b>✦ {summary.season.tokens}</b></div>
          <div className="season-live-progress"><i style={{ width:`${summary.season.progressPercent}%` }} /></div>
          <p>{summary.season.nextTier ? `다음 보상: ${summary.season.nextTier.tier}단계 · ${summary.season.nextTier.threshold} P` : '이번 시즌 여정을 모두 완주했어요.'}</p>
        </div>

        <div className="season-live-columns">
          <article>
            <h3>이번 주 지령</h3>
            <div className="season-directive-list">
              {summary.directives.map(item => <div className={item.completed ? 'is-complete' : ''} key={item.id}>
                <span><b>{item.label}</b><small>+{item.reward.journeyPoints}P · ✦{item.reward.tokens}</small></span>
                <strong>{item.current}/{item.target}</strong>
              </div>)}
            </div>
          </article>

          <article>
            <h3>시즌 교환소</h3>
            <div className="season-shop-list">
              {summary.shop.map(item => <button key={item.id} disabled={!item.canBuy} onClick={() => onPurchase(item.id as SeasonShopOfferId)}>
                <span><b>{item.label}</b><small>남은 횟수 {item.remaining}/{item.limit}</small></span>
                <strong>✦ {item.cost}</strong>
              </button>)}
            </div>
          </article>
        </div>

        <article className="season-keepsake-block">
          <div className="season-keepsake-heading">
            <div><small>SEASON KEEPSAKES</small><h3>계절 기념품 컬렉션</h3></div>
            <strong>{summary.keepsakes.total}개</strong>
          </div>
          <div className="season-keepsake-seasons">
            {(Object.keys(seasonNames) as Array<keyof typeof seasonNames>).map(season => <div key={season}>
              <span>{seasonNames[season]}</span><b>{summary.keepsakes.seasons[season]}</b>
            </div>)}
          </div>
          <div className="season-keepsake-milestones">
            {Object.entries(milestoneNames).map(([id,label]) => {
              const claimed = summary.keepsakes.claimed.includes(id as keyof typeof milestoneNames);
              return <span className={claimed ? 'is-claimed' : ''} key={id}>{claimed ? '✓' : '○'} {label}</span>;
            })}
          </div>
          <p>{summary.keepsakes.nextMilestone
            ? `다음 장기 보상 · ${milestoneNames[summary.keepsakes.nextMilestone.id]} ${summary.keepsakes.total}/${summary.keepsakes.nextMilestone.threshold}`
            : '모든 계절 기념품 마일스톤을 달성했어요.'}</p>
        </article>

        <article className="season-honor-block">
          <div className="season-honor-heading">
            <div><small>SEASON HONORS</small><h3>시즌 완주 명예</h3></div>
            <strong>{summary.honors.progress.completedSeasons} 시즌 완주</strong>
          </div>
          <div className="season-honor-stats">
            <span>완주 계절 <b>{summary.honors.progress.completedSeasonTypes}/4</b></span>
            <span>퍼펙트 연도 <b>{summary.honors.progress.perfectYears}</b></span>
          </div>
          <div className="season-honor-list">
            {summary.honors.items.map(item => <div className={item.claimed ? 'is-claimed' : ''} key={item.id}>
              <span><b>{item.claimed ? '✓ ' : ''}{item.label}</b><small>{item.description}</small></span>
              <strong>{item.claimed ? '획득' : `${Math.min(item.current,item.threshold)}/${item.threshold}`}</strong>
              <em>{item.reward.gold ? `${item.reward.gold}G` : ''}{item.reward.gold && item.reward.gems ? ' · ' : ''}{item.reward.gems ? `◆${item.reward.gems}` : ''}</em>
            </div>)}
          </div>
        </article>

        <article className="season-archive-block">
          <h3>지난 시즌 기록</h3>
          {summary.archive.length ? <div className="season-archive-list">{summary.archive.slice(0,6).map(record => <div key={record.key}>
            <span><b>{record.label}</b><small>{record.rank}</small></span>
            <strong>{record.score}P · {record.tiersCompleted}/10 · ✦{record.tokensEarned}</strong>
          </div>)}</div> : <p>아직 완료된 시즌 기록이 없어요.</p>}
        </article>
      </div>
    </section>
  </div>;
}
