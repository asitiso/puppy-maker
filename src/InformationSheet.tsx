import {useId,type ReactNode} from 'react';

export type InformationSheetAction={
  label:string;
  onClick:()=>void;
};

export type InformationSheetMetric={
  label:string;
  value:ReactNode;
};

type InformationSheetProps={
  open:boolean;
  title:string;
  summary?:ReactNode;
  metrics?:InformationSheetMetric[];
  detail?:ReactNode;
  detailLabel?:string;
  detailExpanded?:boolean;
  onDetailToggle?:()=>void;
  primaryAction:InformationSheetAction;
  secondaryActions?:InformationSheetAction[];
  onClose:()=>void;
};

export default function InformationSheet({
  open,
  title,
  summary,
  metrics,
  detail,
  detailLabel='자세히 보기',
  detailExpanded=false,
  onDetailToggle,
  primaryAction,
  secondaryActions,
  onClose,
}:InformationSheetProps){
  const titleId=useId();

  if(!open)return null;

  const visibleSecondaryActions=(secondaryActions??[]).slice(0,2);

  return (
    <div className="ux-sheet-backdrop information-sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className="ux-sheet information-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event)=>event.stopPropagation()}
      >
        <button
          type="button"
          className="ux-sheet-close information-sheet__close"
          onClick={onClose}
          aria-label={`${title} 닫기`}
        >
          ×
        </button>

        <header className="information-sheet__header">
          <h3 id={titleId}>{title}</h3>
          {summary?<div className="information-sheet__summary">{summary}</div>:null}
        </header>

        {metrics?.length?(
          <dl className="information-sheet__metrics">
            {metrics.map((metric)=>(
              <div className="information-sheet__metric" key={metric.label}>
                <dt>{metric.label}</dt>
                <dd>{metric.value}</dd>
              </div>
            ))}
          </dl>
        ):null}

        {detail?(
          onDetailToggle?(
            <div className="information-sheet__detail-region">
              <button
                type="button"
                className="information-sheet__disclosure"
                aria-expanded={detailExpanded}
                onClick={onDetailToggle}
              >
                {detailLabel}
              </button>
              {detailExpanded?<div className="information-sheet__detail">{detail}</div>:null}
            </div>
          ):(
            <div className="information-sheet__detail">{detail}</div>
          )
        ):null}

        {visibleSecondaryActions.length?(
          <div className="information-sheet__secondary-actions">
            {visibleSecondaryActions.map((action)=>(
              <button
                type="button"
                className="information-sheet__secondary"
                data-information-action="secondary"
                onClick={action.onClick}
                key={action.label}
              >
                {action.label}
              </button>
            ))}
          </div>
        ):null}

        <button
          type="button"
          className="ux-sheet-primary information-sheet__primary"
          data-information-action="primary"
          onClick={primaryAction.onClick}
        >
          {primaryAction.label}
        </button>
      </div>
    </div>
  );
}
