import { useEffect, useRef } from 'react';
import './ngplus-replay.css';

export type NgPlusReplayPathCard = {
  id: string;
  title: string;
  tendency: string;
  reasons: string[];
};

export type NgPlusReplaySpecialCard = {
  id: 'fifth_path_candidate';
  title: string;
  reasons: string[];
};

export type NgPlusReplayViewModel = {
  entry: {
    title: string;
    previousRun: string;
    currentRun: string;
    cta: string;
  };
  home: {
    season: string;
    runLabel: string;
    echoSummary: string;
    primaryCta: string;
  };
  journey: {
    pastLife: string[];
    reunions: string[];
    worldEchoes: string[];
    currentRun: string[];
  };
  normalCandidates: NgPlusReplayPathCard[];
  specialCandidate: NgPlusReplaySpecialCard | null;
  vn: {
    portrait?: string;
    name: string;
    dialogue: string;
    choices: string[];
    log: string[];
    seen: boolean;
  };
};

type Props = {
  open: boolean;
  model: NgPlusReplayViewModel;
  onOpen: () => void;
  onClose: () => void;
};

const focusableSelector = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

function ReplayList({ items, empty }: { items: readonly string[]; empty: string }) {
  return <div className="ngplus-replay-list">{items.length ? items.map(item => <p key={item}>{item}</p>) : <p>{empty}</p>}</div>;
}

export default function NgPlusReplayHub({ open, model, onOpen, onClose }: Props) {
  const launcherRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);

  const openReplayJourney = () => {
    const active = document.activeElement;
    launcherRef.current = active instanceof HTMLElement && active !== document.body ? active : launcherRef.current;
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
      if (!focusables.length) return;
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
    return <section
      className="ngplus-replay-home ngplus-replay-shell"
      aria-label={`새로운 가능성 · ${model.home.season}`}
      ref={node => { launcherRef.current = node; }}
    >
      <div className="ngplus-entry-card">
        <small>NEW POSSIBILITY</small>
        <h2>{model.entry.title}</h2>
        <p>{model.entry.previousRun}</p>
        <p>{model.entry.currentRun}</p>
        <strong>{model.entry.cta}</strong>
      </div>
      <div className="ngplus-home-card">
        <small>{model.home.runLabel}</small>
        <h3>{model.home.season}</h3>
        <p>{model.home.echoSummary}</p>
        <button type="button" onClick={openReplayJourney}>{model.home.primaryCta}</button>
      </div>
    </section>;
  }

  return <div className="ngplus-replay-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section
      className="ngplus-replay-panel ngplus-replay-shell"
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ngplus-replay-title"
    >
      <header className="ngplus-replay-header">
        <div>
          <small>{model.home.runLabel}</small>
          <h2 id="ngplus-replay-title">Journey · 새로운 가능성</h2>
          <p>{model.home.season}</p>
        </div>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Replay Journey 닫기">×</button>
      </header>

      <div className="ngplus-replay-scroll">
        <section aria-labelledby="ngplus-past-life-title">
          <small>INHERITED MEMORY</small>
          <h3 id="ngplus-past-life-title">지난 삶의 기억</h3>
          <ReplayList items={model.journey.pastLife} empty="이번 봄에는 지난 삶의 기억이 조용히 잠들어 있어요." />
        </section>

        <section aria-labelledby="ngplus-reunion-title">
          <small>RELATIONSHIP REUNION</small>
          <h3 id="ngplus-reunion-title">다시 만난 관계</h3>
          <ReplayList items={model.journey.reunions} empty="아직 다시 이어진 관계의 기억은 없어요." />
        </section>

        <section aria-labelledby="ngplus-world-echo-title">
          <small>INHERITED WORLD</small>
          <h3 id="ngplus-world-echo-title">이어진 세계의 메아리</h3>
          <ReplayList items={model.journey.worldEchoes} empty="이전 세계의 흔적이 이번 회차에 드러나지 않았어요." />
        </section>

        <section aria-labelledby="ngplus-current-run-title">
          <small>CURRENT RUN</small>
          <h3 id="ngplus-current-run-title">이번 회차의 기록</h3>
          <ReplayList items={model.journey.currentRun} empty="이번 봄의 기록은 지금부터 새로 쌓여요." />
        </section>

        <section className="ngplus-paths" aria-labelledby="ngplus-path-title">
          <small>PATH CONVERGENCE</small>
          <h3 id="ngplus-path-title">이번 봄에 열리는 길</h3>
          <p>지난 삶은 힌트가 될 뿐, 이번 회차의 선택이 길을 결정해요.</p>
          <div className="ngplus-path-grid">
            {model.normalCandidates.map(card => <article className="ngplus-path-card" key={card.id}>
              <small>{card.tendency}</small>
              <h4>{card.title}</h4>
              <ul>{card.reasons.slice(0, 4).map(reason => <li key={reason}>{reason}</li>)}</ul>
            </article>)}
          </div>
          {model.specialCandidate && <article className="ngplus-special-card">
            <small>추가로 보이는 가능성</small>
            <h4>{model.specialCandidate.title}</h4>
            <ul>{model.specialCandidate.reasons.slice(0, 3).map(reason => <li key={reason}>{reason}</li>)}</ul>
            <p>아직 선택 가능한 본편 경로가 아니라, 다음 가능성의 흔적이에요.</p>
          </article>}
        </section>

        <section className="ngplus-vn" aria-labelledby="ngplus-vn-title">
          <small>REUNION SCENE</small>
          <h3 id="ngplus-vn-title">다시 시작하는 장면</h3>
          <div className="ngplus-vn-stage">
            {model.vn.portrait ? <img src={model.vn.portrait} alt="" className="ngplus-vn-portrait" /> : null}
            <div>
              <strong>{model.vn.name}</strong>
              <p>{model.vn.dialogue}</p>
            </div>
          </div>
          <div className="ngplus-vn-choices" aria-label="대화 선택지">
            {model.vn.choices.map(choice => <button type="button" key={choice}>{choice}</button>)}
          </div>
          <details><summary>대화 기록</summary>{model.vn.log.map(line => <p key={line}>{line}</p>)}</details>
          <button type="button" disabled={!model.vn.seen}>읽은 장면 빠르게</button>
        </section>
      </div>
    </section>
  </div>;
}
