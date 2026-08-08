import type { GameState } from './game';
import { sanctuaryContractUiSummary } from './sanctuary-contract-ui';
import { sanctuaryUiSummary } from './sanctuary-ui';
import type { SanctuaryFacilityId } from './starlight-sanctuary';

const materialLabels = { star_bark:'별빛 나무껍질', arcane_shard:'비전 파편', wind_pearl:'바람 진주' } as const;

export default function SanctuaryOverlay({
  state,
  open,
  onOpen,
  onClose,
  onUpgrade,
}:{
  state:GameState;
  open:boolean;
  onOpen:()=>void;
  onClose:()=>void;
  onUpgrade:(facility:SanctuaryFacilityId)=>void;
}) {
  const summary = sanctuaryUiSummary(state);
  const contractSummary = sanctuaryContractUiSummary(state);
  const prestigeProgress = contractSummary.prestige.nextThreshold
    ? `${contractSummary.prestige.prestige}/${contractSummary.prestige.nextThreshold}`
    : `${contractSummary.prestige.prestige} MAX`;
  if (!open) {
    return <button className="sanctuary-entry" onClick={onOpen} aria-label="별빛 성소 열기">
      <small>STARLIGHT SANCTUARY</small>
      <strong>별빛 성소</strong>
      <span>{contractSummary.prestige.label} · 시설 {summary.levelTotal}/{summary.maxLevelTotal}</span>
    </button>;
  }
  return <div className="sanctuary-backdrop" role="presentation" onClick={onClose}>
    <section className="sanctuary-panel" role="dialog" aria-modal="true" aria-label="별빛 성소" onClick={event => event.stopPropagation()}>
      <img className="sanctuary-frame" src="/ui/popup_panel_frame.png" alt="" />
      <div className="sanctuary-content">
        <header>
          <div><small>STARLIGHT SANCTUARY</small><h2>별빛 성소</h2><p>원정 재료로 시설을 성장시키고 주간 성역 의뢰로 명성을 높여요.</p></div>
          <button onClick={onClose} aria-label="닫기">×</button>
        </header>

        <div className="sanctuary-prestige-card">
          <div><small>SANCTUARY PRESTIGE</small><strong>{contractSummary.prestige.label}</strong><span>주간 성역 의뢰를 완료해 성소의 위상을 높여요.</span></div>
          <b>{prestigeProgress}</b>
        </div>

        <div className="sanctuary-progress"><span>전체 시설 성장</span><strong>{summary.levelTotal}/{summary.maxLevelTotal}</strong><i><b style={{ width:`${summary.levelTotal / summary.maxLevelTotal * 100}%` }} /></i></div>
        <div className="sanctuary-grid">
          {summary.facilities.map(facility => <article className={facility.complete ? 'is-complete' : ''} key={facility.id}>
            <div className="sanctuary-facility-head">
              <div><small>LV.{facility.level}</small><h3>{facility.label}</h3></div>
              <strong>{facility.complete ? 'MAX' : `→ LV.${facility.nextLevel}`}</strong>
            </div>
            <p>{facility.description}</p>
            <div className="sanctuary-effect"><span>현재</span><b>{facility.currentEffect}</b>{facility.nextEffect && <><span>다음</span><b>{facility.nextEffect}</b></>}</div>
            {facility.nextCost && <div className="sanctuary-cost">
              <strong>{facility.nextCost.gold.toLocaleString()}G</strong>
              {(Object.entries(facility.nextCost.materials) as Array<[keyof typeof materialLabels,number]>).filter(([,amount]) => amount > 0).map(([id,amount]) => <span key={id}>{materialLabels[id]} ×{amount}</span>)}
            </div>}
            {facility.blockReason && <em>{facility.blockReason}</em>}
            <button disabled={!facility.canUpgrade} onClick={() => onUpgrade(facility.id)}>{facility.complete ? '최대 성장' : facility.canUpgrade ? '시설 업그레이드' : '조건 미충족'}</button>
          </article>)}
        </div>

        <article className="sanctuary-contract-block">
          <div className="sanctuary-contract-heading">
            <div><small>WEEKLY CONTRACTS</small><h3>이번 주 성역 의뢰</h3></div>
            <strong>{contractSummary.contracts.filter(item => item.completed).length}/3 완료</strong>
          </div>
          <div className="sanctuary-contract-list">
            {contractSummary.contracts.map(contract => <div className={contract.completed ? 'is-complete' : ''} key={contract.id}>
              <span><b>{contract.completed ? '✓ ' : ''}{contract.label}</b><small>Prestige +{contract.prestige} · {contract.reward.gold ? `${contract.reward.gold}G` : ''}{contract.reward.gold && contract.reward.gems ? ' · ' : ''}{contract.reward.gems ? `◆${contract.reward.gems}` : ''}</small></span>
              <strong>{contract.current}/{contract.target}</strong>
              <i><b style={{ width:`${contract.progressPercent}%` }} /></i>
            </div>)}
          </div>
        </article>

        <footer>
          <span>보유 재료 · 나무껍질 {state.expeditionMaterials.star_bark} · 비전 파편 {state.expeditionMaterials.arcane_shard} · 바람 진주 {state.expeditionMaterials.wind_pearl}</span>
          <b>{state.gold.toLocaleString()}G</b>
        </footer>
      </div>
    </section>
  </div>;
}
