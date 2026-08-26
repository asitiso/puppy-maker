import GuidedActionCard from './GuidedActionCard';
import type {GuidedActionRoute,GuidedActionStack} from './guided-actions';
import './mobile-v10-guidance.css';

type Props={stack:GuidedActionStack;onAction:(route:GuidedActionRoute)=>void};

export default function HomeCommandCenter({stack,onAction}:Props){
  return <section className="v10-command-center" aria-label="지금 할 일">
    <header className="v10-command-heading"><small>NEXT ACTION</small><strong>지금 할 일</strong></header>
    <GuidedActionCard action={stack.primary} variant="primary" onAction={onAction}/>
    {stack.secondary.length>0&&<div className="v10-command-secondary-list" aria-label="다음 할 일">
      {stack.secondary.slice(0,2).map(action=><GuidedActionCard key={action.id} action={action} variant="secondary" onAction={onAction}/>)}
    </div>}
  </section>;
}
