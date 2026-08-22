import { useEffect, useRef } from 'react';
import SpringCampaignHome from './SpringCampaignHome';
import './spring-hub.css';

export type SpringConvergenceCard = {
  id: string;
  title: string;
  tendency: string;
  reason: string;
  evidence: string[];
};

export type SpringCharacterBondCard = {
  id: string;
  name: string;
  trust: string;
  memory: string;
  promise: string;
  conflict: string;
};

export type SpringHubViewModel = {
  season: string;
  campaign: string;
  phase: string;
  primaryCta: string;
  relationChange: string;
  worldChange: string;
  journey: {
    objective: string;
    events: string[];
    upcomingQuestion: string;
  };
  convergence: SpringConvergenceCard[];
  bonds: SpringCharacterBondCard[];
  vn: {
    portrait: string;
    name: string;
    dialogue: string;
    choices: string[];
    log: string[];
    seen: boolean;
  };
};

type SpringHubOverlayProps = {
  open: boolean;
  model: SpringHubViewModel;
  onOpen: () => void;
  onClose: () => void;
};

const focusableSelector = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export default function SpringHubOverlay({ open, model, onOpen, onClose }: SpringHubOverlayProps) {
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
    const [seasonLabel, monthLabel = ''] = model.season.split(' · ');
    return <div className="spring-home-entry" ref={node => { launcherRef.current = node; }}>
      <SpringCampaignHome
        seasonLabel={seasonLabel}
        monthLabel={monthLabel}
        campaignLabel={`${model.campaign} · ${model.phase}`}
        primaryActionLabel={model.primaryCta}
        relationshipChange={model.relationChange}
        worldChange={model.worldChange}
        onPrimaryAction={openJourney}
      />
    </div>;
  }

  return <div className="spring-hub-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section
      ref={panelRef}
      className="spring-hub-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="spring-journey-title"
    >
      <header className="spring-hub-header">
        <div>
          <small>{model.season} · {model.phase}</small>
          <h2 id="spring-journey-title">Journey</h2>
          <p>{model.campaign}</p>
        </div>
        <button ref={closeRef} type="button" className="spring-hub-close" onClick={onClose} aria-label="Journey 닫기">×</button>
      </header>

      <div className="spring-hub-scroll">
        <section className="spring-story-card" aria-labelledby="spring-story-heading">
          <div className="spring-section-heading">
            <small>CAMPAIGN JOURNAL</small>
            <h3 id="spring-story-heading">이야기 기록</h3>
          </div>
          <p className="spring-objective"><b>Season objective</b><span>{model.journey.objective}</span></p>
          <div className="spring-memory-list" aria-label="완료한 주요 사건">
            {model.journey.events.length > 0 ? model.journey.events.map(event => <p key={event}>{event}</p>) : <p>아직 기록된 주요 사건이 없어요.</p>}
          </div>
          <p className="spring-question"><b>다가오는 질문</b><span>{model.journey.upcomingQuestion}</span></p>
          <p className="spring-world-change"><b>World 변화</b><span>{model.worldChange}</span></p>
        </section>

        <section className="spring-convergence" aria-labelledby="spring-convergence-heading">
          <div className="spring-section-heading">
            <small>PATH CONVERGENCE</small>
            <h3 id="spring-convergence-heading">열리고 있는 길</h3>
            <p>숫자가 아니라 지금까지의 선택과 기억으로 길을 확인해요.</p>
          </div>
          <div className="spring-path-grid">
            {model.convergence.slice(0, 3).map(card => <article className="spring-path-card" key={card.id}>
              <small>{card.tendency}</small>
              <h4>{card.title}</h4>
              <p>{card.reason}</p>
              <ul aria-label={`${card.title} 플레이 근거`}>
                {card.evidence.slice(0, 3).map(item => <li key={item}>{item}</li>)}
              </ul>
            </article>)}
          </div>
        </section>

        <section className="spring-bonds" aria-labelledby="spring-bond-heading">
          <div className="spring-section-heading">
            <small>CHARACTER BOND</small>
            <h3 id="spring-bond-heading">동료와 남은 것</h3>
            <p>루나와의 교감과 별개인, 캠페인 인물 관계 기록이에요.</p>
          </div>
          <div className="spring-bond-grid">
            {model.bonds.map(bond => <article className="spring-bond-card" key={bond.id}>
              <header><h4>{bond.name}</h4><strong>{bond.trust}</strong></header>
              <dl>
                <div><dt>Memory</dt><dd>{bond.memory}</dd></div>
                <div><dt>Promise</dt><dd>{bond.promise}</dd></div>
                <div><dt>Conflict</dt><dd>{bond.conflict}</dd></div>
              </dl>
            </article>)}
          </div>
        </section>

        <section className="spring-vn" aria-labelledby="spring-vn-heading">
          <div className="spring-section-heading">
            <small>SPRING SCENE</small>
            <h3 id="spring-vn-heading">이야기 장면</h3>
          </div>
          <div className="spring-vn-stage">
            <img src={model.vn.portrait} alt="" className="spring-vn-portrait" />
            <div className="spring-vn-dialogue">
              <strong>{model.vn.name}</strong>
              <p>{model.vn.dialogue}</p>
            </div>
          </div>
          <div className="spring-vn-choices" aria-label="대화 선택지">
            {model.vn.choices.map(choice => <button type="button" key={choice}>{choice}</button>)}
          </div>
          <details className="spring-vn-log"><summary>대화 기록</summary>{model.vn.log.map(line => <p key={line}>{line}</p>)}</details>
          <button type="button" className="spring-vn-skip" disabled={!model.vn.seen}>읽은 장면 빠르게</button>
        </section>
      </div>
    </section>
  </div>;
}
