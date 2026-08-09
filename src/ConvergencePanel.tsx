import type { GameState } from './game';
import type { CelestialGuardianId, ConvergenceIntensity } from './celestial-convergence';
import type { GuardianBoonId } from './guardian-boons';
import { convergenceUiSummary } from './convergence-ui';
import './convergence.css';

const intensityLabels:Record<ConvergenceIntensity,string> = { 1:'I', 2:'II', 3:'III' };
const guardianMarks:Record<CelestialGuardianId,string> = {
  dawn_stag:'☀', moon_crane:'☾', storm_wolf:'ϟ', star_fox:'✦',
};

export default function ConvergencePanel({
  state,
  onClear,
  onBoon,
}:{
  state:GameState;
  onClear:(guardianId:CelestialGuardianId,intensity:ConvergenceIntensity)=>void;
  onBoon:(boonId:GuardianBoonId)=>void;
}) {
  const summary = convergenceUiSummary(state);
  return <article className="convergence-block">
    <div className="convergence-heading">
      <div><small>CELESTIAL CONVERGENCE</small><h3>천체 수호 합일전</h3><p>천상 균열 너머의 네 수호자와 공명해 최후의 별빛 기록을 완성해요.</p></div>
      <div className="convergence-currency"><span>GUARDIAN SIGIL</span><b>✧ {summary.sigils}</b></div>
    </div>

    <div className="convergence-guardians">
      {summary.guardians.map(guardian => <section key={guardian.id}>
        <header>
          <span className="convergence-mark">{guardianMarks[guardian.id]}</span>
          <div><small>{guardian.callingAffinity.toUpperCase()} AFFINITY</small><b>{guardian.label}</b></div>
          <strong>{guardian.power} P</strong>
        </header>
        <div className="convergence-intensities">
          {guardian.intensities.map(item => <button
            key={item.intensity}
            disabled={!item.available}
            className={item.grade ? `grade-${item.grade.toLowerCase()}` : ''}
            onClick={() => onClear(guardian.id,item.intensity)}
          >
            <strong>{intensityLabels[item.intensity]}</strong>
            <span>{item.grade ? `${item.grade} · ${item.bestPower}P` : item.available ? '도전' : '잠김'}</span>
            {item.clearCount > 0 && <small>{item.clearCount}회 합일</small>}
          </button>)}
        </div>
      </section>)}
    </div>

    <div className="convergence-columns">
      <section>
        <h4>주간 합일 지령</h4>
        <div className="convergence-directives">{summary.directives.map(item => <div className={item.rewarded ? 'is-complete' : ''} key={item.id}>
          <span><b>{item.rewarded ? '✓ ' : ''}{item.label}</b><small>수호 인장 +2</small></span>
          <strong>{item.current}/{item.target}</strong>
        </div>)}</div>
      </section>
      <section>
        <h4>천체 합일 명예</h4>
        <div className="convergence-honors">{summary.honors.map(item => <div className={item.claimed ? 'is-complete' : ''} key={item.id}>
          <span><b>{item.claimed ? '✓ ' : ''}{item.label}</b><small>{item.reward.gold ? `${item.reward.gold}G` : ''}{item.reward.gold && item.reward.gems ? ' · ' : ''}{item.reward.gems ? `◆${item.reward.gems}` : ''}</small></span>
          <strong>{item.claimed ? '완료' : `${Math.min(item.current,item.target)}/${item.target}`}</strong>
        </div>)}</div>
      </section>
    </div>

    <section className="convergence-boons">
      <div className="convergence-boon-heading"><div><small>GUARDIAN BOONS</small><h4>수호자의 서약</h4></div><strong>{summary.boons.filter(item => item.purchased).length}/8</strong></div>
      <div className="convergence-boon-grid">{summary.boons.map(item => <button
        key={item.id}
        className={item.purchased ? 'is-owned' : ''}
        disabled={!item.canBuy}
        onClick={() => onBoon(item.id)}
      >
        <span><b>{item.purchased ? '✓ ' : ''}{item.label}</b><small>{item.reward.gold ? `${item.reward.gold}G` : ''}{item.reward.gold && item.reward.gems ? ' · ' : ''}{item.reward.gems ? `◆${item.reward.gems}` : ''}</small></span>
        <strong>{item.purchased ? '서약 완료' : item.available ? `✧ ${item.cost}` : '선행 필요'}</strong>
      </button>)}</div>
    </section>
  </article>;
}
