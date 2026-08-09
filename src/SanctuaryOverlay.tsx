import type { GameState } from './game';
import AstralRiftPanel from './AstralRiftPanel';
import type { AstralRiftId, AstralRiftIntensity } from './astral-rift';
import type { AstralRiftRelicId } from './astral-rift-relics';
import { sanctuaryAstralUiSummary } from './sanctuary-astral-ui';
import { sanctuaryContractUiSummary } from './sanctuary-contract-ui';
import { sanctuaryGrandProgress, sanctuaryGrandRank } from './sanctuary-grand-milestones';
import { canBuildSanctuaryMasterwork, sanctuaryMasterworks, type SanctuaryMasterworkId } from './sanctuary-masterworks';
import type { SanctuarySpecializationId, SanctuarySpecializationSynergyId } from './sanctuary-specializations';
import { sanctuaryUiSummary } from './sanctuary-ui';
import type { SanctuaryFacilityId } from './starlight-sanctuary';

const materialLabels = { star_bark:'별빛 나무껍질', arcane_shard:'비전 파편', wind_pearl:'바람 진주' } as const;
const synergyLabels:Record<SanctuarySpecializationSynergyId,{ label:string; description:string }> = {
  guardian_academy:{ label:'수호자 아카데미', description:'훈련 교본과 숙련 연구가 연결되어 성장 효율이 상승해요.' },
  living_haven:{ label:'살아있는 안식처', description:'유대의 숲과 연대기가 이어져 교감 중심 성장이 강화돼요.' },
  star_route_network:{ label:'별길 원정망', description:'적응 훈련과 원정 항로가 연결되어 원정 여정 효율이 상승해요.' },
  season_oracle:{ label:'계절의 예언소', description:'달샘과 계절 관측이 연결되어 회복과 시즌 흐름이 강화돼요.' },
};
const masterworkReason = {
  level:'시설 Lv.3 필요', specialization:'전문화 선택 필요', resources:'자원 부족', completed:'완성됨', invalid:'잠김',
} as const;

export default function SanctuaryOverlay({
  state,
  open,
  onOpen,
  onClose,
  onUpgrade,
  onSpecialization,
  onMasterwork,
  onAstralRiftClear,
  onAstralRiftRelic,
}:{
  state:GameState;
  open:boolean;
  onOpen:()=>void;
  onClose:()=>void;
  onUpgrade:(facility:SanctuaryFacilityId)=>void;
  onSpecialization:(specialization:SanctuarySpecializationId)=>void;
  onMasterwork:(masterwork:SanctuaryMasterworkId)=>void;
  onAstralRiftClear:(riftId:AstralRiftId,intensity:AstralRiftIntensity)=>void;
  onAstralRiftRelic:(relicId:AstralRiftRelicId)=>void;
}) {
  const summary = sanctuaryUiSummary(state);
  const contractSummary = sanctuaryContractUiSummary(state);
  const astralSummary = sanctuaryAstralUiSummary(state);
  const ascension = astralSummary.ascension;
  const masterworkIds = state.sanctuaryMasterworks ?? [];
  const grandScore = sanctuaryGrandProgress({
    levels:state.sanctuaryLevels,
    specializationCount:Object.keys(state.sanctuarySpecializations ?? {}).length,
    masterworkCount:masterworkIds.length,
    prestige:state.sanctuaryPrestige ?? 0,
  });
  const grand = sanctuaryGrandRank(grandScore);
  const prestigeProgress = contractSummary.prestige.nextThreshold
    ? `${contractSummary.prestige.prestige}/${contractSummary.prestige.nextThreshold}`
    : `${contractSummary.prestige.prestige} MAX`;
  const ascensionProgress = ascension.rank.nextThreshold
    ? `${ascension.score}/${ascension.rank.nextThreshold}`
    : `${ascension.score} MAX`;
  if (!open) {
    return <button className="sanctuary-entry" onClick={onOpen} aria-label="별빛 성소 열기">
      <small>STARLIGHT SANCTUARY</small>
      <strong>별빛 성소</strong>
      <span>{grand.label} · {ascension.rank.label}</span>
    </button>;
  }
  return <div className="sanctuary-backdrop" role="presentation" onClick={onClose}>
    <section className="sanctuary-panel" role="dialog" aria-modal="true" aria-label="별빛 성소" onClick={event => event.stopPropagation()}>
      <img className="sanctuary-frame" src="/ui/popup_panel_frame.png" alt="" />
      <div className="sanctuary-content">
        <header>
          <div><small>STARLIGHT SANCTUARY</small><h2>별빛 성소</h2><p>시설 성장 → 영구 전문화 → Masterwork → 천상 승천으로 성역을 완성해요.</p></div>
          <button onClick={onClose} aria-label="닫기">×</button>
        </header>

        <div className="sanctuary-grand-card">
          <div><small>SANCTUARY GRAND RANK</small><strong>{grand.label}</strong><span>{grand.description}</span></div>
          <b>{grand.nextThreshold ? `${grand.score}/${grand.nextThreshold}` : `${grand.score} MAX`}</b>
        </div>

        <article className="sanctuary-ascension-block">
          <div className="sanctuary-ascension-heading">
            <div><small>CELESTIAL ASCENSION</small><h3>{ascension.rank.label}</h3><p>{ascension.rank.description}</p></div>
            <strong>{ascensionProgress}</strong>
          </div>
          <div className="sanctuary-ascension-components">
            <span>시련 <b>{ascension.components.trialClears}/12</b></span>
            <span>S 다양성 <b>{ascension.components.uniqueSClears}/4</b></span>
            <span>축복 <b>{ascension.components.blessings}/4</b></span>
            <span>성좌 <b>{ascension.components.constellations}/5</b></span>
            <span>성소 <b>{ascension.components.sanctuaryProgress}/65</b></span>
          </div>
          <div className="sanctuary-ascension-rewards">
            {ascension.rewards.map(item => <div className={item.claimed ? 'is-claimed' : item.reached ? 'is-reached' : ''} key={item.rank}>
              <span><b>{item.claimed ? '✓ ' : ''}{item.rank === 'awakened' ? '성광 각성' : item.rank === 'stellar' ? '성좌 승천' : item.rank === 'empyrean' ? '천궁 수호' : '초월'}</b><small>{item.threshold}점</small></span>
              <strong>{item.reward.gold ? `${item.reward.gold}G` : ''}{item.reward.gold && item.reward.gems ? ' · ' : ''}{item.reward.gems ? `◆${item.reward.gems}` : ''}{(item.reward.gold || item.reward.gems) && item.reward.starShards ? ' · ' : ''}{item.reward.starShards ? `✦${item.reward.starShards}` : ''}</strong>
            </div>)}
          </div>
          <p>{ascension.nextReward ? `다음 승천 보상 · ${ascension.nextReward.threshold}점` : '모든 천상 승천 보상을 획득했어요.'}</p>
        </article>

        <AstralRiftPanel state={state} onClear={onAstralRiftClear} onRelic={onAstralRiftRelic} />

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
            {!facility.complete && <button disabled={!facility.canUpgrade} onClick={() => onUpgrade(facility.id)}>{facility.canUpgrade ? '시설 업그레이드' : '조건 미충족'}</button>}
            {facility.complete && facility.specialization && <div className="sanctuary-specialization-selected">
              <small>PERMANENT SPECIALIZATION</small>
              <strong>{facility.specialization.label}</strong>
              <span>{facility.specialization.description}</span>
            </div>}
            {facility.canChooseSpecialization && <div className="sanctuary-specialization-choices">
              <small>전문화 선택 · 선택 후 변경할 수 없어요</small>
              {facility.specializationChoices.map(choice => <button key={choice.id} onClick={() => onSpecialization(choice.id as SanctuarySpecializationId)}>
                <b>{choice.label}</b><span>{choice.description}</span>
              </button>)}
            </div>}
          </article>)}
        </div>

        <article className="sanctuary-masterwork-block">
          <div className="sanctuary-masterwork-heading"><div><small>MASTERWORKS</small><h3>성역 최종 프로젝트</h3></div><strong>{masterworkIds.length}/4 완성</strong></div>
          <div className="sanctuary-masterwork-list">
            {sanctuaryMasterworks.map(project => {
              const status = canBuildSanctuaryMasterwork({ id:project.id, levels:state.sanctuaryLevels, specializations:state.sanctuarySpecializations ?? {}, completed:masterworkIds, gold:state.gold, materials:state.expeditionMaterials });
              const completed = masterworkIds.includes(project.id);
              return <div className={completed ? 'is-complete' : ''} key={project.id}>
                <span><b>{completed ? '✓ ' : ''}{project.label}</b><small>{project.description}</small></span>
                <p>{project.cost.gold.toLocaleString()}G · {(Object.entries(project.cost.materials) as Array<[keyof typeof materialLabels,number]>).filter(([,amount]) => amount > 0).map(([id,amount]) => `${materialLabels[id]}×${amount}`).join(' · ')}</p>
                <button disabled={!status.accepted} onClick={() => onMasterwork(project.id)}>{status.accepted ? 'Masterwork 완성' : completed ? '완성됨' : masterworkReason[status.reason]}</button>
              </div>;
            })}
          </div>
          <p>4개 모두 완성 시 성역 완성 보상 · 1,000G + ◆5</p>
        </article>

        {summary.specializationSynergies.length > 0 && <article className="sanctuary-synergy-block">
          <div><small>SANCTUARY SYNERGY</small><h3>활성 성소 시너지</h3></div>
          <div className="sanctuary-synergy-list">{summary.specializationSynergies.map(id => <span key={id}>
            <b>{synergyLabels[id].label}</b><small>{synergyLabels[id].description}</small>
          </span>)}</div>
        </article>}

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
