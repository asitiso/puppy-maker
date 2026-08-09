import type { GameState } from './game';
import type { AstralRiftId, AstralRiftIntensity } from './astral-rift';
import type { AstralRiftRelicId } from './astral-rift-relics';
import { astralRiftUiSummary } from './astral-rift-ui';

const intensityLabels:Record<AstralRiftIntensity,string> = { 1:'I', 2:'II', 3:'III' };
const honorProgress = (id:string, progress:{ clearedRifts:number; sRifts:number; clearedCombinations:number }) => {
  if (id === 'first_rift_clear') return `${Math.min(1,progress.clearedCombinations)}/1`;
  if (id === 'six_rifts') return `${progress.clearedRifts}/6`;
  if (id === 'six_rifts_s') return `${progress.sRifts}/6`;
  return `${progress.clearedCombinations}/18`;
};

export default function AstralRiftPanel({
  state,
  onClear,
  onRelic,
}:{
  state:GameState;
  onClear:(riftId:AstralRiftId,intensity:AstralRiftIntensity)=>void;
  onRelic:(relicId:AstralRiftRelicId)=>void;
}) {
  const summary = astralRiftUiSummary(state);
  return <article className="astral-rift-block">
    <div className="astral-rift-heading">
      <div><small>ASTRAL RIFT</small><h3>천상 균열</h3><p>승천과 성소의 힘으로 반복 가능한 천상 균열을 돌파해요.</p></div>
      <div className="astral-rift-currencies"><span>RIFT POWER <b>{summary.power}</b></span><span>RIFT ECHO <b>◈ {summary.echoes}</b></span></div>
    </div>

    <div className="astral-rift-map">
      {summary.rifts.map(rift => <section key={rift.id} className={summary.ascension.score >= rift.ascensionThreshold ? '' : 'is-locked'}>
        <header><div><small>ASCENSION {rift.ascensionThreshold}</small><b>{rift.label}</b></div><span>{summary.ascension.score >= rift.ascensionThreshold ? 'OPEN' : 'LOCKED'}</span></header>
        <div className="astral-rift-intensities">
          {rift.intensities.map(item => <button
            key={item.intensity}
            disabled={!item.available}
            className={item.grade ? `grade-${item.grade.toLowerCase()}` : ''}
            onClick={() => onClear(rift.id,item.intensity)}
          >
            <strong>{intensityLabels[item.intensity]}</strong>
            <span>{item.grade ? `${item.grade} · ${item.bestPower}P` : item.available ? '도전' : '잠김'}</span>
            {item.clearCount > 0 && <small>{item.clearCount}회 돌파</small>}
          </button>)}
        </div>
      </section>)}
    </div>

    <div className="astral-rift-columns">
      <section>
        <h4>주간 균열 지령</h4>
        <div className="astral-rift-directives">{summary.directives.map(item => <div className={item.rewarded ? 'is-complete' : ''} key={item.id}>
          <span><b>{item.rewarded ? '✓ ' : ''}{item.label}</b><small>Echo +{item.rewardEchoes}</small></span>
          <strong>{item.current}/{item.target}</strong>
        </div>)}</div>
      </section>
      <section>
        <h4>균열 정복 명예</h4>
        <div className="astral-rift-honors">{summary.honors.map(item => <div className={item.claimed ? 'is-complete' : ''} key={item.id}>
          <span><b>{item.claimed ? '✓ ' : ''}{item.label}</b><small>{item.reward.gold ? `${item.reward.gold}G` : ''}{item.reward.gold && item.reward.gems ? ' · ' : ''}{item.reward.gems ? `◆${item.reward.gems}` : ''}</small></span>
          <strong>{item.claimed ? '완료' : honorProgress(item.id,summary.honorProgress)}</strong>
        </div>)}</div>
      </section>
    </div>

    <section className="astral-rift-relics">
      <div><small>RIFT RELICS</small><h4>균열 유물</h4></div>
      <div className="astral-rift-relic-grid">{summary.relics.map(item => <button
        key={item.id}
        className={item.purchased ? 'is-owned' : ''}
        disabled={!item.canBuy}
        onClick={() => onRelic(item.id)}
      >
        <span><small>{item.branch.toUpperCase()} · T{item.tier}</small><b>{item.purchased ? '✓ ' : ''}{item.label}</b><em>{item.description}</em></span>
        <strong>{item.purchased ? '보유' : item.available ? `◈ ${item.cost}` : '선행 필요'}</strong>
      </button>)}</div>
    </section>
  </article>;
}
