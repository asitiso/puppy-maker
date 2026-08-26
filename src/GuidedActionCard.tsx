import type {GuidedAction,GuidedActionRoute} from './guided-actions';
import './mobile-v10-guidance.css';

type Props={action:GuidedAction;variant:'primary'|'secondary';onAction:(route:GuidedActionRoute)=>void};

export default function GuidedActionCard({action,variant,onAction}:Props){
  const blocked=action.state==='blocked';
  const target=blocked?action.resolveRoute:action.route;
  return <article className={`v10-guided-action v10-command-${variant} is-${action.state}`} data-guided-action={action.id}>
    <div className="v10-guided-copy">
      <strong>{action.label}</strong>
      <p>{action.detail}</p>
      {action.reason&&<small className="v10-guided-reason">{action.reason}</small>}
    </div>
    {target&&<button type="button" className="v10-guided-cta" onClick={()=>onAction(target)}>{blocked?'해결하러 가기':variant==='primary'?'바로 하기':'열기'}</button>}
  </article>;
}
