import { useEffect, useRef } from 'react';
import './autumn-hub.css';

export type AutumnMajorChoiceOption = {
  id: string;
  label: string;
  description: string;
  available: boolean;
  lockedHint?: string;
};

export type AutumnHubViewModel = {
  season: string;
  campaign: string;
  phase: string;
  primaryCta: string;
  relationshipChange: string;
  expeditionResult: string;
  journey: {
    title: string;
    objective: string;
    framing: string;
    beats: string[];
    nextAction: string;
  };
  majorChoice: {
    prompt: string;
    committedChoiceId: string | null;
    options: AutumnMajorChoiceOption[];
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

type AutumnHubOverlayProps = {
  open: boolean;
  model: AutumnHubViewModel;
  onOpen: () => void;
  onClose: () => void;
  onCommitChoice: (choiceId: string) => void;
};

const focusableSelector = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

function renderList(items: readonly string[], empty: string) {
  return items.length > 0 ? items.map(item => <li key={item}>{item}</li>) : <li>{empty}</li>;
}

export default function AutumnHubOverlay({ open, model, onOpen, onClose, onCommitChoice }: AutumnHubOverlayProps) {
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
    return <section className="autumn-home-entry" aria-label={`가을 캠페인 요약 · ${model.season}`} ref={node => { launcherRef.current = node; }}>
      <header><span>{model.season}</span><span>{model.phase}</span></header>
      <h1>{model.campaign}</h1>
      <dl>
        <div><dt>Relationship</dt><dd>{model.relationshipChange}</dd></div>
        <div><dt>Great Expedition</dt><dd>{model.expeditionResult}</dd></div>
      </dl>
      <button type="button" onClick={openJourney}>{model.primaryCta}</button>
    </section>;
  }

  return <div className="autumn-hub-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section ref={panelRef} className="autumn-hub-panel" role="dialog" aria-modal="true" aria-labelledby="autumn-journey-title">
      <header className="autumn-hub-header">
        <div>
          <small>{model.season} · {model.phase}</small>
          <h2 id="autumn-journey-title">Journey</h2>
          <p>{model.campaign}</p>
        </div>
        <button ref={closeRef} type="button" className="autumn-hub-close" onClick={onClose} aria-label="Autumn Journey 닫기">×</button>
      </header>

      <div className="autumn-hub-scroll">
        <section className="autumn-story-card" aria-labelledby="autumn-story-heading">
          <div className="autumn-section-heading">
            <small>CAMPAIGN JOURNAL</small>
            <h3 id="autumn-story-heading">{model.journey.title}</h3>
          </div>
          <p className="autumn-objective"><b>Autumn objective</b><span>{model.journey.objective}</span></p>
          <p className="autumn-framing"><b>Great Expedition</b><span>{model.journey.framing}</span></p>
          <div className="autumn-story-beats" aria-label="가을 이야기 기록">
            {model.journey.beats.length > 0 ? model.journey.beats.map(beat => <p key={beat}>{beat}</p>) : <p>아직 기록된 가을 장면이 없어요.</p>}
          </div>
          <p className="autumn-result"><b>결과</b><span>{model.expeditionResult}</span></p>
          <p className="autumn-next-action"><b>다음 행동</b><span>{model.journey.nextAction}</span></p>
        </section>

        <section className="autumn-major-choice" aria-labelledby="autumn-choice-heading">
          <div className="autumn-section-heading">
            <small>MAJOR CHOICE</small>
            <h3 id="autumn-choice-heading">{model.majorChoice.prompt}</h3>
          </div>
          <p className="autumn-choice-note">조건은 숫자가 아니라 지금까지의 관계와 현장 경험으로 드러나요.</p>
          <div className="autumn-choice-list">
            {model.majorChoice.options.map(option => {
              const committed = model.majorChoice.committedChoiceId === option.id;
              return <article key={option.id} className="autumn-choice-card" data-available={option.available ? 'true' : 'false'}>
                <div>
                  <h4>{option.label}</h4>
                  <p>{option.description}</p>
                  {!option.available && option.lockedHint ? <small>{option.lockedHint}</small> : null}
                  {committed ? <strong>선택됨</strong> : null}
                </div>
                <button
                  type="button"
                  aria-disabled={!option.available}
                  disabled={!option.available || Boolean(model.majorChoice.committedChoiceId)}
                  onClick={() => onCommitChoice(option.id)}
                >
                  {committed ? '결정 완료' : option.available ? '이 선택을 결정' : '아직 선택할 수 없음'}
                </button>
              </article>;
            })}
          </div>
        </section>

        <section className="autumn-bond" aria-labelledby="autumn-bond-heading">
          <div className="autumn-section-heading">
            <small>CHARACTER BOND</small>
            <h3 id="autumn-bond-heading">가을에 남은 관계</h3>
          </div>
          {model.bond ? <article className="autumn-bond-card">
            <header><h4>{model.bond.name}</h4><strong>{model.bond.relationship}</strong></header>
            <div className="autumn-bond-columns">
              <section><h5>Memory</h5><ul>{renderList(model.bond.memories, '아직 남은 기억이 없어요.')}</ul></section>
              <section><h5>Promise</h5><ul>{renderList(model.bond.promises, '아직 기록된 약속이 없어요.')}</ul></section>
              <section><h5>Conflict</h5><ul>{renderList(model.bond.conflicts, '현재 드러난 갈등은 없어요.')}</ul></section>
            </div>
          </article> : <p className="autumn-bond-empty">아직 이번 가을에 기록된 Character Bond가 없어요.</p>}
        </section>

        <section className="autumn-vn" aria-labelledby="autumn-vn-heading">
          <div className="autumn-section-heading"><small>AUTUMN SCENE</small><h3 id="autumn-vn-heading">선택 이후의 장면</h3></div>
          <div className="autumn-vn-stage">
            {model.vn.portrait ? <img src={model.vn.portrait} alt="" className="autumn-vn-portrait" /> : null}
            <div className="autumn-vn-dialogue"><strong>{model.vn.name}</strong><p>{model.vn.dialogue}</p></div>
          </div>
          <div className="autumn-vn-choices" aria-label="대화 선택지">{model.vn.choices.map(choice => <button type="button" key={choice}>{choice}</button>)}</div>
          <details className="autumn-vn-log"><summary>대화 기록</summary>{model.vn.log.map(line => <p key={line}>{line}</p>)}</details>
          <button type="button" className="autumn-vn-skip" disabled={!model.vn.seen}>읽은 장면 빠르게</button>
        </section>
      </div>
    </section>
  </div>;
}
