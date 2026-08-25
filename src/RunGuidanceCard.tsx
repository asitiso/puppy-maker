import type {RunGuidanceView} from './run-guidance';
import './run-guidance.css';

type Props={guidance:RunGuidanceView};

export default function RunGuidanceCard({guidance}:Props){
  return <section
    className={`run-guidance-card is-${guidance.mode}`}
    data-route-tone={guidance.routeTone}
    aria-label="현재 여정 안내"
  >
    <div className="run-guidance-heading">
      <small>{guidance.eyebrow}</small>
      <span>{guidance.seasonLabel}</span>
    </div>
    <h2>{guidance.title}</h2>
    <p>{guidance.body}</p>
    {guidance.recentResult&&<p className="run-guidance-recent"><b>최근 기록</b>{guidance.recentResult}</p>}
    <div className="run-guidance-next"><small>다음</small><strong>{guidance.nextAction}</strong></div>
  </section>;
}
