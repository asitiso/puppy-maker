import { useEffect, useRef, useState } from 'react';
import type { GameState } from './game';
import { worldUiSummary } from './world-ui';

export default function WorldProgressOverlay({
  state,
  open:controlledOpen,
  onOpenChange,
}: {
  state: GameState;
  open?: boolean;
  onOpenChange?: (open:boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const launcherRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(open);
  const summary = worldUiSummary(state);
  const setOpen = (next:boolean) => {
    if (controlledOpen === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (wasOpen.current && !open) launcherRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  if (!open) {
    return <button ref={launcherRef} className="world-progress-card" onClick={() => setOpen(true)} aria-label={`${summary.homeCard.title}, ${summary.homeCard.seasonLabel}, ${summary.homeCard.contractLabel}`}>
      <img src="/ui/info_card_frame.png" alt="" draggable={false}/>
      <span>
        <small>{summary.homeCard.eyebrow}</small>
        <strong>{summary.homeCard.title}</strong>
        <b>{summary.homeCard.seasonLabel}</b>
        <em>{summary.homeCard.contractLabel}</em>
      </span>
    </button>;
  }

  return <div className="world-progress-backdrop" role="dialog" aria-modal="true" aria-label="월드 진행">
    <section className="world-progress-panel">
      <img className="world-progress-frame" src="/ui/popup_panel_frame.png" alt="" draggable={false}/>
      <div className="world-progress-content">
        <button className="world-progress-close" onClick={() => setOpen(false)} aria-label="닫기">×</button>
        <small>WORLD PROGRESS</small>
        <h2>월드 진행</h2>

        <article className="world-event-card">
          <small>MONTHLY WORLD EVENT</small>
          <h3>{summary.event.label}</h3>
          <b>추천 지역 · {summary.event.regionLabel}</b>
          <p>{summary.event.description}</p>
          <em>{summary.event.bonusLabel}</em>
        </article>

        <section className="world-season-section">
          <h3>계절 원정 <small>{summary.season.score}점</small></h3>
          <div className="world-progress-bar"><i style={{ width:`${summary.season.percent}%` }}/></div>
          <p>{summary.season.nextThreshold ? `다음 보상까지 ${Math.max(0, summary.season.nextThreshold - summary.season.score)}점` : '이번 계절 보상 트랙 완료'}</p>
          <div className="world-season-tiers">
            {summary.season.tiers.map(tier => <div key={tier.tier} className={`is-${tier.status}`}>
              <b>{tier.tier}단계</b><span>{tier.threshold}점</span><em>{tier.rewardLabel}</em><small>{tier.status === 'claimed' ? '수령 완료' : tier.status === 'earned' ? '수령 가능' : '진행 중'}</small>
            </div>)}
          </div>
        </section>

        <section className="world-renown-section">
          <h3>지역 명성</h3>
          {summary.regions.map(region => <article key={region.id} className={region.id === summary.event.regionId ? 'is-featured' : ''}>
            <div><b>{region.label}</b><span>Lv.{region.level} · {region.renown}</span></div>
            <div className="world-progress-bar"><i style={{ width:`${region.percent}%` }}/></div>
            <small>{region.nextThreshold === null ? '최고 명성' : `다음 Lv. ${region.nextThreshold}`}{region.id === summary.event.regionId ? ' · 이벤트 추천' : ''}</small>
          </article>)}
        </section>

        <section className="world-contract-section">
          <h3>월간 월드 의뢰 <small>{summary.completedContracts} / {summary.contracts.length}</small></h3>
          {summary.contracts.map(contract => <article key={contract.id} className={contract.rewarded ? 'is-complete' : ''}>
            <div><b>{contract.label}</b><span>{contract.progress} / {contract.target}</span></div>
            <p>{contract.description}</p>
            <div className="world-progress-bar"><i style={{ width:`${contract.percent}%` }}/></div>
            <small>{contract.rewarded ? '보상 수령 완료' : contract.rewardLabel}</small>
          </article>)}
        </section>
      </div>
    </section>
  </div>;
}
