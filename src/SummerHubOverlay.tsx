import { useEffect, useRef } from 'react';
import './summer-hub.css';

export type SummerHubViewModel = {
  season: string;
  campaign: string;
  phase: string;
  primaryCta: string;
  relationshipChange: string;
  festivalResult: string;
  journey: {
    title: string;
    objective: string;
    framing: string;
    beats: string[];
    nextAction: string;
  };
  bond: {
    id: string;
    name: string;
    relationship: string;
    memories: string[];
    promises: string[];
    conflicts: string[];
  } | null;
  vn: {
    portrait: string;
    name: string;
    dialogue: string;
    choices: string[];
    log: string[];
    seen: boolean;
  };
};

type SummerHubOverlayProps = {
  open: boolean;
  model: SummerHubViewModel;
  onOpen: () => void;
  onClose: () => void;
};

const focusableSelector = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

function renderList(items: readonly string[], empty: string) {
  return items.length > 0 ? items.map(item => <li key={item}>{item}</li>) : <li>{empty}</li>;
}

export default function SummerHubOverlay({ open, model, onOpen, onClose }: SummerHubOverlayProps) {
  const launcherRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);

  const openJourney = () => {
    const active = document.activeElement;
    launcherRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
    onOpen();
  };

  useEffect(() => {
    if (!open) {
      if (wasOpen.current) launcherRef.current?.focus();
      wasOpen.current = false;
      return;
    }

    wasOpen.current = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusables = Array.from(panelRef.current.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return <section className="summer-home-entry" aria-label={`여름 캠페인 요약 · ${model.season}`} ref={node => { launcherRef.current = node; }}>
      <header><span>{model.season}</span><span>{model.phase}</span></header>
      <h1>{model.campaign}</h1>
      <dl>
        <div><dt>Relationship</dt><dd>{model.relationshipChange}</dd></div>
        <div><dt>Guardian Festival</dt><dd>{model.festivalResult}</dd></div>
      </dl>
      <button type="button" onClick={openJourney}>{model.primaryCta}</button>
    </section>;
  }

  return <div className="summer-hub-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section
      ref={panelRef}
      className="summer-hub-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="summer-journey-title"
    >
      <header className="summer-hub-header">
        <div>
          <small>{model.season} · {model.phase}</small>
          <h2 id="summer-journey-title">Journey</h2>
          <p>{model.campaign}</p>
        </div>
        <button ref={closeRef} type="button" className="summer-hub-close" onClick={onClose} aria-label="Summer Journey 닫기">×</button>
      </header>

      <div className="summer-hub-scroll">
        <section className="summer-story-card" aria-labelledby="summer-story-heading">
          <div className="summer-section-heading">
            <small>CAMPAIGN JOURNAL</small>
            <h3 id="summer-story-heading">{model.journey.title}</h3>
          </div>
          <p className="summer-objective"><b>Summer objective</b><span>{model.journey.objective}</span></p>
          <p className="summer-framing"><b>Guardian Festival</b><span>{model.journey.framing}</span></p>
          <div className="summer-story-beats" aria-label="여름 이야기 기록">
            {model.journey.beats.length > 0 ? model.journey.beats.map(beat => <p key={beat}>{beat}</p>) : <p>아직 기록된 여름 장면이 없어요.</p>}
          </div>
          <p className="summer-result"><b>결과</b><span>{model.festivalResult}</span></p>
          <p className="summer-next-action"><b>다음 행동</b><span>{model.journey.nextAction}</span></p>
        </section>

        <section className="summer-bond" aria-labelledby="summer-bond-heading">
          <div className="summer-section-heading">
            <small>CHARACTER BOND</small>
            <h3 id="summer-bond-heading">여름에 남은 관계</h3>
          </div>
          {model.bond ? <article className="summer-bond-card">
            <header><h4>{model.bond.name}</h4><strong>{model.bond.relationship}</strong></header>
            <div className="summer-bond-columns">
              <section><h5>Memory</h5><ul>{renderList(model.bond.memories, '아직 남은 기억이 없어요.')}</ul></section>
              <section><h5>Promise</h5><ul>{renderList(model.bond.promises, '아직 기록된 약속이 없어요.')}</ul></section>
              <section><h5>Conflict</h5><ul>{renderList(model.bond.conflicts, '현재 드러난 갈등은 없어요.')}</ul></section>
            </div>
          </article> : <p className="summer-bond-empty">아직 이번 여름에 기록된 Character Bond가 없어요.</p>}
        </section>

        <section className="summer-vn" aria-labelledby="summer-vn-heading">
          <div className="summer-section-heading">
            <small>SUMMER SCENE</small>
            <h3 id="summer-vn-heading">이야기 장면</h3>
          </div>
          <div className="summer-vn-stage">
            <img src={model.vn.portrait} alt="" className="summer-vn-portrait" />
            <div className="summer-vn-dialogue">
              <strong>{model.vn.name}</strong>
              <p>{model.vn.dialogue}</p>
            </div>
          </div>
          <div className="summer-vn-choices" aria-label="대화 선택지">
            {model.vn.choices.map(choice => <button type="button" key={choice}>{choice}</button>)}
          </div>
          <details className="summer-vn-log"><summary>대화 기록</summary>{model.vn.log.map(line => <p key={line}>{line}</p>)}</details>
          <button type="button" className="summer-vn-skip" disabled={!model.vn.seen}>읽은 장면 빠르게</button>
        </section>
      </div>
    </section>
  </div>;
}
