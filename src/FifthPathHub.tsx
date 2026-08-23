import { useEffect, useRef } from 'react';
import type {
  FifthPathAutumnPresentation,
  FifthPathSpringPresentation,
  FifthPathSummerPresentation,
  FifthPathTrueEndingPresentation,
  FifthPathWinterPresentation,
} from './fifth-path-experience';
import './fifth-path.css';

export type FifthPathHubViewModel = {
  spring: FifthPathSpringPresentation;
  selected: boolean;
  current:
    | FifthPathSummerPresentation
    | FifthPathAutumnPresentation
    | FifthPathWinterPresentation
    | FifthPathTrueEndingPresentation
    | null;
  vn: {
    portrait?: string;
    name: string;
    dialogue: string;
    choices: readonly string[];
  };
};

type FifthPathHubProps = {
  open: boolean;
  model: FifthPathHubViewModel;
  onOpen: () => void;
  onClose: () => void;
  onSelectTruePath: () => void;
};

const focusableSelector = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

function renderCurrent(current: FifthPathHubViewModel['current']) {
  if (!current) return null;

  if ('id' in current) {
    return (
      <section className="fifth-path-panel fifth-path-ending" aria-labelledby="fifth-true-ending-title">
        <p className="fifth-path-kicker">TRUE ENDING</p>
        <h2 id="fifth-true-ending-title">{current.title}</h2>
        <p>{current.summary}</p>
        <div className="fifth-path-grid">
          <article>
            <h3>세계에 남은 것</h3>
            {current.worldLegacy.map((item) => <p key={item}>{item}</p>)}
          </article>
          <article>
            <h3>관계에 남은 것</h3>
            {current.bondLegacy.map((item) => <p key={item}>{item}</p>)}
          </article>
        </div>
        <p className="fifth-path-future">{current.future}</p>
      </section>
    );
  }

  if (current.season === 'summer') {
    return (
      <section className="fifth-path-panel">
        <p className="fifth-path-kicker">SUMMER</p>
        <h2>{current.title}</h2>
        <p className="fifth-path-objective">{current.objective}</p>
        <p>{current.reveal}</p>
        <blockquote>{current.lyra}</blockquote>
        {current.world.map((item) => <p key={item}>{item}</p>)}
      </section>
    );
  }

  if (current.season === 'autumn') {
    return (
      <section className="fifth-path-panel">
        <p className="fifth-path-kicker">AUTUMN</p>
        <h2>{current.title}</h2>
        <p className="fifth-path-objective">{current.objective}</p>
        <p>{current.crisis}</p>
        <article className="fifth-path-choice">
          <h3>{current.choice.label}</h3>
          <p>{current.choice.consequence}</p>
        </article>
        <blockquote>{current.bond}</blockquote>
        {current.world.map((item) => <p key={item}>{item}</p>)}
      </section>
    );
  }

  return (
    <section className="fifth-path-panel">
      <p className="fifth-path-kicker">LONG NIGHT</p>
      <h2>{current.title}</h2>
      <p className="fifth-path-objective">{current.objective}</p>
      <p>{current.resolution}</p>
      <blockquote>{current.bond}</blockquote>
      {current.world.map((item) => <p key={item}>{item}</p>)}
    </section>
  );
}

export default function FifthPathHub({ open, model, onOpen, onClose, onSelectTruePath }: FifthPathHubProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const first = dialog?.querySelector<HTMLElement>(focusableSelector);
    first?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusables.length === 0) return;
      const firstItem = focusables[0];
      const lastItem = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      triggerRef.current?.focus();
    };
  }, [open, onClose]);

  const currentTitle = model.current?.title ?? (model.selected ? '다섯 번째 길' : '새로운 가능성');

  if (!open) {
    return (
      <section className="fifth-path-home" aria-label="다섯 번째 길 홈">
        <div>
          <p className="fifth-path-kicker">FIFTH PATH</p>
          <h2>다섯 번째 길</h2>
          <p>{currentTitle}</p>
        </div>
        <button ref={triggerRef} type="button" onClick={onOpen}>Journey 열기</button>
      </section>
    );
  }

  return (
    <section ref={dialogRef} className="fifth-path-shell" role="dialog" aria-modal="true" aria-label="다섯 번째 길 Journey">
      <header className="fifth-path-header">
        <div>
          <p className="fifth-path-kicker">FIFTH PATH · JOURNEY</p>
          <h1>{currentTitle}</h1>
        </div>
        <button type="button" onClick={onClose} aria-label="다섯 번째 길 Journey 닫기">돌아가기</button>
      </header>

      {!model.selected && (
        <section className="fifth-path-panel" aria-labelledby="fifth-path-selection-title">
          <p className="fifth-path-kicker">PATH CONVERGENCE</p>
          <h2 id="fifth-path-selection-title">이번 봄에 열린 길</h2>
          <div className="fifth-path-candidates">
            {model.spring.normalCandidates.map((candidate) => (
              <article className="fifth-path-card" key={candidate.id}>
                <h3>{candidate.title}</h3>
                <p>{candidate.tendency}</p>
                {candidate.reasons.map((reason) => <p key={reason}>{reason}</p>)}
              </article>
            ))}
          </div>
          {model.spring.fifthCandidate && (
            <article className="fifth-path-card fifth-path-special">
              <p className="fifth-path-kicker">추가로 열린 가능성</p>
              <h3>{model.spring.fifthCandidate.title}</h3>
              {model.spring.fifthCandidate.reasons.map((reason) => <p key={reason}>{reason}</p>)}
              <button type="button" onClick={onSelectTruePath}>{model.spring.fifthCandidate.cta}</button>
            </article>
          )}
        </section>
      )}

      {model.selected && renderCurrent(model.current)}

      <section className="fifth-path-panel fifth-path-vn" aria-label="리라 이야기">
        <div className="fifth-path-vn-row">
          {model.vn.portrait ? <img src={model.vn.portrait} alt="" /> : null}
          <div>
            <p className="fifth-path-kicker">{model.vn.name}</p>
            <p>{model.vn.dialogue}</p>
          </div>
        </div>
        <div className="fifth-path-vn-choices">
          {model.vn.choices.map((choice) => <button type="button" key={choice}>{choice}</button>)}
        </div>
      </section>
    </section>
  );
}
