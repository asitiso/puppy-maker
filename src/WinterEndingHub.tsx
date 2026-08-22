import { useEffect, useRef } from 'react';
import './winter-ending.css';

export type WinterEndingAxis = {
  id: 'campaign' | 'bond' | 'world' | 'career';
  label: string;
  title: string;
  summary: string;
};

export type WinterEndingViewModel = {
  season: string;
  campaign: string;
  longNightResult: string;
  primaryCta: string;
  endingCommitted: boolean;
  axes: WinterEndingAxis[];
  epilogue: {
    title: string;
    body: string[];
    next: string;
  };
  vn: {
    portrait: string;
    name: string;
    dialogue: string;
    choices: string[];
    log: string[];
    seen: boolean;
  };
};

type WinterEndingHubProps = {
  open: boolean;
  model: WinterEndingViewModel;
  onOpen: () => void;
  onClose: () => void;
};

const focusableSelector = 'button:not([disabled]), [href], summary, [tabindex]:not([tabindex="-1"])';

export default function WinterEndingHub({ open, model, onOpen, onClose }: WinterEndingHubProps) {
  const launcherRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const wasOpen = useRef(false);

  const openEnding = () => {
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
    return <section className="winter-home-entry" aria-label={`겨울 결말 요약 · ${model.season}`}>
      <header><span>{model.season}</span><span>{model.endingCommitted ? '결말 기록 완료' : 'Long Night 진행 중'}</span></header>
      <h1>{model.campaign}</h1>
      <p className="winter-home-result"><b>Long Night</b><span>{model.longNightResult}</span></p>
      <button type="button" onClick={openEnding}>{model.primaryCta}</button>
    </section>;
  }

  return <div className="winter-ending-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section ref={panelRef} className="winter-ending-panel" role="dialog" aria-modal="true" aria-labelledby="winter-ending-title">
      <header className="winter-ending-header">
        <div>
          <small>{model.season}</small>
          <h2 id="winter-ending-title">Ending</h2>
          <p>{model.campaign} · {model.endingCommitted ? '결말 기록 완료' : '결말 정리 중'}</p>
        </div>
        <button ref={closeRef} type="button" className="winter-ending-close" onClick={onClose} aria-label="Winter Ending 닫기">×</button>
      </header>

      <div className="winter-ending-scroll">
        <section className="winter-long-night" aria-labelledby="winter-long-night-heading">
          <div className="winter-section-heading"><small>THE LONG NIGHT</small><h3 id="winter-long-night-heading">마지막 밤의 결과</h3></div>
          <p>{model.longNightResult}</p>
          <strong>{model.endingCommitted ? '결말 기록 완료' : '이 결과가 마지막 기록을 결정해요.'}</strong>
        </section>

        <section className="winter-axis-section" aria-labelledby="winter-axis-heading">
          <div className="winter-section-heading"><small>MODULAR ENDING</small><h3 id="winter-axis-heading">네 갈래의 결말</h3></div>
          <div className="winter-axis-grid">
            {model.axes.map(axis => <article className="winter-axis-card" key={axis.id} data-axis={axis.id}>
              <small>{axis.label}</small>
              <h4>{axis.title}</h4>
              <p>{axis.summary}</p>
            </article>)}
          </div>
        </section>

        <section className="winter-epilogue" aria-labelledby="winter-epilogue-heading">
          <div className="winter-section-heading"><small>WINTER EPILOGUE</small><h3 id="winter-epilogue-heading">{model.epilogue.title}</h3></div>
          <div className="winter-epilogue-copy">{model.epilogue.body.map(line => <p key={line}>{line}</p>)}</div>
          <p className="winter-epilogue-next">{model.epilogue.next}</p>
        </section>

        <section className="winter-vn" aria-labelledby="winter-vn-heading">
          <div className="winter-section-heading"><small>FINAL SCENE</small><h3 id="winter-vn-heading">마지막 대화</h3></div>
          <div className="winter-vn-stage">
            {model.vn.portrait ? <img src={model.vn.portrait} alt="" className="winter-vn-portrait" /> : null}
            <div className="winter-vn-dialogue"><strong>{model.vn.name}</strong><p>{model.vn.dialogue}</p></div>
          </div>
          <div className="winter-vn-choices" aria-label="마지막 대화 선택지">{model.vn.choices.map(choice => <button type="button" key={choice}>{choice}</button>)}</div>
          <details className="winter-vn-log"><summary>대화 기록</summary>{model.vn.log.map(line => <p key={line}>{line}</p>)}</details>
          <button type="button" className="winter-vn-skip" disabled={!model.vn.seen}>읽은 장면 빠르게</button>
        </section>
      </div>
    </section>
  </div>;
}
