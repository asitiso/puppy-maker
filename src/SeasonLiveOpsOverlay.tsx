import type { GameState } from './game';
import { liveOpsUiSummary } from './live-ops-ui';
import type { SeasonShopOfferId } from './season-shop';

const seasonNames = { spring:'봄', summer:'여름', autumn:'가을', winter:'겨울' } as const;
const milestoneNames = {
  first_keepsake:'첫 계절의 기억',
  four_seasons:'사계절의 추억',
  eight_seasons:'두 해의 계절 연대기',
} as const;

export default function SeasonLiveOpsOverlay({
  state,
  open,
  onOpen,
  onClose,
  onPurchase,
}:{
  state:GameState;
  open:boolean;
  onOpen:()=>void;
  onClose:()=>void;
  onPurchase:(offer:SeasonShopOfferId)=>void;
}) {
  const summary = liveOpsUiSummary(state);
  if (!open) {
    return <button className="season-live-entry" onClick={onOpen} aria-label="시즌 여정 열기">
      <small>SEASON JOURNEY</small>
      <strong>{summary.season.label}</strong>
      <span>{summary.season.score} P · ✦ {summary.season.tokens}</span>
    </button>;
  }

  return <div className="season-live-backdrop" role="presentation" onClick={onClose}>
    <section className="season-live-panel" role="dialog" aria-modal="true" aria-label="시즌 여정" onClick={event => event.stopPropagation()}>
      <img className="season-live-frame" src="/ui/popup_panel_frame.png" alt="" />
      <div className="season-live-content">
        <header>
          <div><small>SEASON JOURNEY</small><h2>{summary.season.label}</h2></div>
          <button onClick={onClose} aria-label="닫기">×</button>
        </header>

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
