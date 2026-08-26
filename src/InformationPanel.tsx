import type {ReactNode} from 'react';

export type InformationPanelSummaryItem={
  label:string;
  value:ReactNode;
};

export type InformationPanelFilter={
  id:string;
  label:string;
  count?:number;
};

type InformationPanelProps={
  summaryItems:InformationPanelSummaryItem[];
  filters?:InformationPanelFilter[];
  activeFilter?:string;
  onFilterChange?:(id:string)=>void;
  children?:ReactNode;
  emptyMessage?:string;
};

export default function InformationPanel({
  summaryItems,
  filters,
  activeFilter,
  onFilterChange,
  children,
  emptyMessage,
}:InformationPanelProps){
  const hasContent=children!==null&&children!==undefined&&children!==false;

  return <section className="v11-info-panel">
    <dl className="v11-info-summary" aria-label="요약">
      {summaryItems.map(item=><div className="v11-info-stat" key={item.label}>
        <dt>{item.label}</dt>
        <dd>{item.value}</dd>
      </div>)}
    </dl>

    {filters?.length?<div className="v11-info-tabs" role="group" aria-label="상태 필터">
      {filters.map(filter=><button
        type="button"
        className="v11-info-tab"
        aria-pressed={activeFilter===filter.id}
        data-information-filter={filter.id}
        onClick={()=>onFilterChange?.(filter.id)}
        key={filter.id}
      >
        <span>{filter.label}</span>
        {filter.count===undefined?null:<b>{filter.count}</b>}
      </button>)}
    </div>:null}

    <div className="v11-info-content">
      {hasContent?children:emptyMessage?<p className="v11-info-empty" role="status">{emptyMessage}</p>:null}
    </div>
  </section>;
}
