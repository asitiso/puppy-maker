import './mobile-v10-guidance.css';

export type ActionResultValue={label:string;value:string};

type Props={
  title:string;
  message?:string;
  changes?:ActionResultValue[];
  totals?:ActionResultValue[];
  continuationLabel:string;
  onContinue:()=>void;
};

export default function ActionResultSummary({title,message,changes=[],totals=[],continuationLabel,onContinue}:Props){
  return <section className="v10-result-summary" aria-label={title} role="status" aria-live="polite" aria-atomic="true">
    <header><small>RESULT</small><h2>{title}</h2>{message&&<p>{message}</p>}</header>
    {changes.length>0&&<dl className="v10-result-change-list">
      {changes.map(item=><div key={`${item.label}:${item.value}`}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
    </dl>}
    {totals.length>0&&<details className="v10-result-totals"><summary>현재 상태 자세히</summary><dl>{totals.map(item=><div key={`${item.label}:${item.value}`}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl></details>}
    <button type="button" className="v10-result-continue" onClick={onContinue}>{continuationLabel}</button>
  </section>;
}
